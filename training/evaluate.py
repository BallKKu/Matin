"""
ประเมิน checkpoint ของ LoRA ลายผ้าไหมมัดหมี่อีสาน

หลักการ
  - ไม่ให้ Vision LLM ตัดสินทุกอย่าง เพราะคะแนน 0-10 จาก LLM แกว่งกว่าความต่าง
    ระหว่าง checkpoint ที่เราอยากจับ สคริปต์นี้จึงใช้ embedding กับ computer vision
    ซึ่งวัดซ้ำได้ค่าเดิมเสมอ
  - threshold ทุกตัว calibrate จาก dataset ของเราเอง ไม่ใช่เลขที่ตั้งลอย ๆ
  - ใช้ระบบ gate ก่อน แล้วค่อยให้คะแนนถ่วงน้ำหนัก เพราะคะแนนรวมล้วน ๆ
    ทำให้ภาพ "สวยแต่ผิดสไตล์" ชนะได้

โหมดการใช้งาน
    python training/evaluate.py calibrate --dataset training/dataset/v1
        วัดการกระจายความคล้ายภายใน dataset แล้วเขียนเกณฑ์ลง calibration.json

    python training/evaluate.py score --dataset training/dataset/v1 \\
        --generated runs/exp_a/epoch_08 --experiment exp_a --checkpoint epoch_08
        ให้คะแนนภาพที่ generate มา แล้วบันทึกลง SQLite

    python training/evaluate.py report --db training/results.sqlite
        สรุปเทียบทุก checkpoint และเลือกตัวที่ควรใช้
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import statistics
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
DEFAULT_DB = HERE / "results.sqlite"
CALIBRATION = HERE / "calibration.json"
CALIBRATION_ARRAYS = HERE / "calibration.npz"

IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp"}

# น้ำหนักคะแนน — ให้ style กับ motif รวมกัน 45% เพราะโจทย์คือรักษาเอกลักษณ์
# visual quality ไม่อยู่ในสูตร มันถูกคุมด้วย gate แล้ว
WEIGHTS = {
    "style_similarity": 0.25,
    "motif_fidelity": 0.20,
    "textile_realism": 0.15,
    "composition": 0.12,
    "novelty": 0.10,
    "color_harmony": 0.10,
    "diversity": 0.08,
}


# --------------------------------------------------------------------------
# Computer vision metrics — ไม่ต้องใช้โมเดล วัดซ้ำได้ค่าเดิม
# --------------------------------------------------------------------------

def symmetry(gray: np.ndarray) -> float:
    """ลายมัดหมี่สมมาตรซ้ายขวาเสมอ ค่าเข้าใกล้ 1 คือสมมาตรดี"""
    flipped = np.fliplr(gray)
    return float(1.0 - np.abs(gray.astype(np.float32) - flipped).mean() / 255.0)


def periodicity(gray: np.ndarray) -> float:
    """
    ผ้าทอคือลายซ้ำเป็นคาบ สเปกตรัมจึงต้องมี peak ชัด ไม่ใช่กระจายเรียบ
    เป็น metric ที่ตรงกับธรรมชาติของผ้ามากที่สุด และแยก 'ลายผ้า' ออกจาก
    'ภาพนามธรรมสวย ๆ' ได้ดีกว่าการดูด้วยตา
    """
    small = cv2.resize(gray, (256, 256), interpolation=cv2.INTER_AREA).astype(np.float32)
    small -= small.mean()
    spectrum = np.abs(np.fft.fftshift(np.fft.fft2(small)))
    centre = 128
    # ปิด DC กับความถี่ต่ำมาก ซึ่งเป็นความสว่างรวมไม่ใช่ลาย
    spectrum[centre - 3 : centre + 4, centre - 3 : centre + 4] = 0
    peak = float(spectrum.max())
    mean = float(spectrum.mean()) + 1e-6
    return peak / mean


def sharpness(gray: np.ndarray) -> float:
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def lab_histogram(bgr: np.ndarray, bins: int = 16) -> np.ndarray:
    """ฮิสโทแกรมใน Lab เพราะใกล้การรับรู้สีของคนมากกว่า BGR"""
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    hist = cv2.calcHist([lab], [0, 1, 2], None, [bins] * 3, [0, 256] * 3)
    hist = hist.flatten()
    return hist / (hist.sum() + 1e-9)


def histogram_distance(a: np.ndarray, b: np.ndarray) -> float:
    """Bhattacharyya distance — 0 คือเหมือนกัน 1 คือต่างสุด"""
    return float(np.sqrt(max(0.0, 1.0 - np.sum(np.sqrt(a * b)))))


# --------------------------------------------------------------------------
# Embedding — ใช้เมื่อโหลดโมเดลได้ ถ้าโหลดไม่ได้จะข้ามพร้อมบอกเหตุผล
# --------------------------------------------------------------------------

class Embedder:
    """
    DINOv2 สำหรับวัดความคล้ายเชิงโครงสร้าง
    ไม่ใช้ CLIP เพราะ CLIP จับ 'ความหมายเชิงภาษา' ภาพผ้าลายคนละแบบ
    จะได้ CLIP similarity สูงทั้งคู่เพราะมันเห็นว่าเป็นผ้าลายเรขาคณิตเหมือนกัน
    """

    def __init__(self, model_name: str = "facebook/dinov2-base") -> None:
        self.ready = False
        self.reason = ""
        try:
            import torch
            from transformers import AutoImageProcessor, AutoModel

            self.torch = torch
            self.processor = AutoImageProcessor.from_pretrained(model_name)
            self.model = AutoModel.from_pretrained(model_name).eval()
            self.ready = True
        except Exception as error:  # โหลดน้ำหนักไม่ได้ / ไม่มีเน็ต
            self.reason = str(error)[:200]

    def encode(self, images: list[np.ndarray]) -> np.ndarray:
        from PIL import Image

        vectors = []
        for start in range(0, len(images), 8):
            batch = [
                Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                for img in images[start : start + 8]
            ]
            inputs = self.processor(images=batch, return_tensors="pt")
            with self.torch.no_grad():
                output = self.model(**inputs).last_hidden_state[:, 0]
            vectors.append(output.cpu().numpy())
        matrix = np.concatenate(vectors, axis=0)
        return matrix / (np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-9)


def gram_descriptor(bgr: np.ndarray) -> np.ndarray:
    """
    ตัวแทนของ 'สไตล์' แบบไม่ต้องใช้ VGG
    style คือความสัมพันธ์ระหว่างช่องสัญญาณของฟิลเตอร์ จึงใช้ Gabor bank
    แล้วคำนวณ correlation matrix ซึ่งเป็นแนวคิดเดียวกับ Gram matrix
    ข้อดีคือรันบน CPU ได้เร็วและไม่ต้องโหลดน้ำหนักโมเดล
    """
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    gray = cv2.resize(gray, (192, 192), interpolation=cv2.INTER_AREA)

    responses = []
    for theta in np.arange(0, np.pi, np.pi / 6):
        for wavelength in (4.0, 8.0, 16.0):
            kernel = cv2.getGaborKernel((15, 15), 3.0, theta, wavelength, 0.5, 0, cv2.CV_32F)
            responses.append(cv2.filter2D(gray, cv2.CV_32F, kernel).flatten())

    features = np.stack(responses, axis=0)
    features -= features.mean(axis=1, keepdims=True)
    gram = features @ features.T
    gram /= np.linalg.norm(gram) + 1e-9
    return gram.flatten()


# --------------------------------------------------------------------------
# การโหลดภาพ
# --------------------------------------------------------------------------

def load_images(folder: Path, limit: int | None = None) -> tuple[list[np.ndarray], list[str]]:
    paths = sorted(p for p in folder.rglob("*") if p.suffix.lower() in IMAGE_EXT)
    if limit:
        paths = paths[:limit]
    images, names = [], []
    for path in paths:
        img = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if img is not None:
            images.append(img)
            names.append(path.name)
    return images, names


# --------------------------------------------------------------------------
# โหมด calibrate
# --------------------------------------------------------------------------

def cmd_calibrate(args: argparse.Namespace) -> None:
    """
    หาเกณฑ์จากข้อมูลจริง ไม่ใช่ตั้งเลขเอง

    แนวคิด: ถ้าภาพที่ generate เหมือนภาพ train มากกว่าที่ภาพ train สองใบ
    เหมือนกันเอง แปลว่ามันลอกมา ไม่ได้สร้างใหม่
    """
    folder = Path(args.dataset) / "images"
    images, _ = load_images(folder)
    if len(images) < 10:
        print(f"ภาพใน {folder} น้อยเกินไป ({len(images)}) ยังไม่พอ calibrate")
        return

    print(f"calibrate จาก {len(images)} tiles")

    sym = [symmetry(cv2.cvtColor(i, cv2.COLOR_BGR2GRAY)) for i in images]
    per = [periodicity(cv2.cvtColor(i, cv2.COLOR_BGR2GRAY)) for i in images]

    calibration = {
        "dataset": str(args.dataset),
        "tiles": len(images),
        # gate ตั้งที่เปอร์เซ็นไทล์ล่างของ dataset เอง
        # ภาพที่ generate ควรทำได้อย่างน้อยเท่าภาพจริงที่แย่ที่สุด 10%
        "symmetry_min": round(float(np.percentile(sym, 10)), 4),
        "periodicity_min": round(float(np.percentile(per, 10)), 2),
        "symmetry_ref": round(float(np.median(sym)), 4),
        "periodicity_ref": round(float(np.median(per)), 2),
    }

    embedder = Embedder()
    if embedder.ready:
        vectors = embedder.encode(images)
        similarity = vectors @ vectors.T
        upper = similarity[np.triu_indices(len(images), k=1)]
        # เกณฑ์ memorization = เปอร์เซ็นไทล์ที่ 95 ของความคล้ายภายใน dataset
        calibration["memorization_threshold"] = round(float(np.percentile(upper, 95)), 4)
        calibration["intra_similarity_median"] = round(float(np.median(upper)), 4)
        calibration["embedder"] = "facebook/dinov2-base"
        print(
            f"  ความคล้ายภายใน dataset: median {np.median(upper):.3f} "
            f"| p95 {np.percentile(upper, 95):.3f} ← ใช้เป็นเกณฑ์ memorization"
        )
    else:
        print(f"  ! โหลด DINOv2 ไม่ได้ ข้ามเกณฑ์ memorization ({embedder.reason})")
        print("    ติดตั้ง/ดาวน์โหลดน้ำหนักแล้วรัน calibrate ใหม่ก่อนเริ่มให้คะแนนจริง")

    grams = np.stack([gram_descriptor(i) for i in images])
    reference = grams.mean(axis=0)
    distances = np.linalg.norm(grams - reference, axis=1)
    # tau ใช้แปลงระยะเป็นคะแนน 0-1 ตั้งจากการกระจายของ dataset เอง
    calibration["style_tau"] = round(float(np.percentile(distances, 75)), 6)

    # เก็บฮิสโทแกรมของทุก tile ไว้ ไม่ใช่ค่าเฉลี่ย
    # dataset นี้มีทั้งผ้าส้ม คราม ม่วง ชมพู ค่าเฉลี่ยจึงเป็นสีขุ่นที่ไม่มีผ้าผืนไหนเป็น
    # คำถามที่ถูกต้องคือ "โทนสีนี้เป็นไปได้ไหมในคลังนี้" ไม่ใช่ "ใกล้ค่าเฉลี่ยไหม"
    histograms = np.stack([lab_histogram(i) for i in images])

    # tau ของสี ตั้งจากระยะที่ tile จริงห่างจากเพื่อนที่ใกล้ที่สุด
    nearest = []
    for index, hist in enumerate(histograms):
        others = np.delete(histograms, index, axis=0)
        nearest.append(min(histogram_distance(hist, o) for o in others))
    calibration["color_tau"] = round(float(np.percentile(nearest, 90)), 6)
    print(f"  ระยะสีถึงเพื่อนที่ใกล้ที่สุด: median {np.median(nearest):.3f} | p90 {np.percentile(nearest, 90):.3f}")

    # อาเรย์อ้างอิงมีขนาดหลายเมกะไบต์ เก็บแยกเป็น .npz
    # ส่วน calibration.json เหลือแต่ตัวเลขเกณฑ์ ให้อ่านและ diff ได้สะดวก
    np.savez_compressed(CALIBRATION_ARRAYS, style_reference=reference, color_bank=histograms)
    calibration["arrays"] = CALIBRATION_ARRAYS.name

    CALIBRATION.write_text(json.dumps(calibration, indent=2), encoding="utf-8")
    summary = {k: v for k, v in calibration.items() if not isinstance(v, list)}
    print(f"\nเขียนเกณฑ์ลง {CALIBRATION}")
    for key, value in summary.items():
        print(f"  {key}: {value}")


# --------------------------------------------------------------------------
# โหมด score
# --------------------------------------------------------------------------

@dataclass
class Scores:
    style_similarity: float = 0.0
    motif_fidelity: float = 0.0
    textile_realism: float = 0.0
    composition: float = 0.0
    novelty: float = 0.0
    color_harmony: float = 0.0
    diversity: float = 0.0


def ensure_db(path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(path)
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            experiment_id TEXT NOT NULL,
            checkpoint TEXT NOT NULL,
            step INTEGER,
            dataset_version TEXT,
            base_model TEXT,
            lora_config TEXT,
            generation_config TEXT,
            scores TEXT,
            gates TEXT,
            final_score REAL,
            disqualified INTEGER,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (experiment_id, checkpoint)
        )
        """
    )
    connection.commit()
    return connection


def cmd_score(args: argparse.Namespace) -> None:
    if not CALIBRATION.exists():
        print("ยังไม่มี calibration.json รัน `evaluate.py calibrate` ก่อน")
        return
    calibration = json.loads(CALIBRATION.read_text(encoding="utf-8"))
    if not CALIBRATION_ARRAYS.exists():
        print(f"ไม่พบ {CALIBRATION_ARRAYS.name} รัน calibrate ใหม่")
        return
    arrays = np.load(CALIBRATION_ARRAYS)

    generated, names = load_images(Path(args.generated))
    if not generated:
        print(f"ไม่พบภาพใน {args.generated}")
        return
    dataset, _ = load_images(Path(args.dataset) / "images")

    print(f"ให้คะแนน {len(generated)} ภาพ เทียบกับ dataset {len(dataset)} tiles")

    grays = [cv2.cvtColor(i, cv2.COLOR_BGR2GRAY) for i in generated]
    sym_values = [symmetry(g) for g in grays]
    per_values = [periodicity(g) for g in grays]
    sharp_values = [sharpness(g) for g in grays]

    # --- style ---
    reference = arrays["style_reference"]
    tau = calibration["style_tau"]
    style_distances = [float(np.linalg.norm(gram_descriptor(i) - reference)) for i in generated]
    style = float(np.mean([np.exp(-d / max(tau, 1e-6)) for d in style_distances]))

    # --- color ---
    # เทียบกับ tile ที่โทนสีใกล้ที่สุดในคลัง ไม่ใช่ค่าเฉลี่ยของคลัง
    color_bank = arrays["color_bank"]
    color_tau = calibration.get("color_tau", 0.5)
    color_distances = [
        min(histogram_distance(lab_histogram(i), ref) for ref in color_bank) for i in generated
    ]
    color = float(np.mean([np.exp(-d / max(color_tau, 1e-6)) for d in color_distances]))

    # --- textile realism: ลายซ้ำเป็นคาบ + ไม่เบลอ ---
    per_ref = calibration["periodicity_ref"]
    realism = float(np.mean([min(1.0, p / max(per_ref, 1e-6)) for p in per_values]))

    # --- composition: ใช้ความสมมาตรเทียบกับ dataset เป็นตัวแทน ---
    sym_ref = calibration["symmetry_ref"]
    composition = float(np.mean([min(1.0, s / max(sym_ref, 1e-6)) for s in sym_values]))

    scores = Scores(
        style_similarity=style,
        textile_realism=realism,
        composition=composition,
        color_harmony=color,
    )

    gates = {
        "symmetry_mean": round(float(np.mean(sym_values)), 4),
        "symmetry_min_required": calibration["symmetry_min"],
        "periodicity_mean": round(float(np.mean(per_values)), 2),
        "periodicity_min_required": calibration["periodicity_min"],
        "sharpness_mean": round(float(np.mean(sharp_values)), 2),
    }

    # --- memorization / novelty / diversity ---
    embedder = Embedder()
    if embedder.ready and dataset:
        gen_vectors = embedder.encode(generated)
        train_vectors = embedder.encode(dataset)

        nearest = (gen_vectors @ train_vectors.T).max(axis=1)
        memorization = float(nearest.max())
        scores.novelty = float(1.0 - nearest.mean())

        pairwise = gen_vectors @ gen_vectors.T
        upper = pairwise[np.triu_indices(len(generated), k=1)]
        scores.diversity = float(1.0 - upper.mean()) if len(upper) else 0.0

        gates["memorization"] = round(memorization, 4)
        gates["memorization_threshold"] = calibration.get("memorization_threshold")
        worst = int(np.argmax(nearest))
        gates["closest_pair"] = f"{names[worst]} (sim {nearest[worst]:.3f})"
    else:
        print(f"  ! ไม่มี DINOv2 จึงข้าม novelty/diversity/memorization ({embedder.reason})")

    # --- motif fidelity ต้องให้คนหรือ LLM ตัดสิน ---
    # ใส่ค่ากลางไว้ก่อน เพื่อไม่ให้สูตรลำเอียง และบันทึกว่ายังไม่ได้ประเมิน
    scores.motif_fidelity = args.motif_fidelity
    pending_human = args.motif_fidelity < 0

    # --- gates ---
    reasons = []
    if gates["symmetry_mean"] < calibration["symmetry_min"]:
        reasons.append("symmetry ต่ำกว่าภาพจริงที่แย่ที่สุด 10%")
    if gates["periodicity_mean"] < calibration["periodicity_min"]:
        reasons.append("ลายไม่ซ้ำเป็นคาบ ไม่เหมือนผ้าทอ")
    threshold = gates.get("memorization_threshold")
    if threshold is not None and gates.get("memorization", 0) > threshold:
        reasons.append(f"memorization {gates['memorization']} เกินเกณฑ์ {threshold}")
    if embedder.ready and scores.diversity < 0.15:
        reasons.append("diversity ต่ำ อาจเกิด mode collapse")

    if pending_human:
        final = 0.0
    else:
        final = sum(WEIGHTS[k] * getattr(scores, k) for k in WEIGHTS)

    connection = ensure_db(Path(args.db))
    connection.execute(
        """
        INSERT OR REPLACE INTO results
        (experiment_id, checkpoint, step, dataset_version, base_model,
         lora_config, generation_config, scores, gates, final_score, disqualified, notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            args.experiment,
            args.checkpoint,
            args.step,
            args.dataset,
            args.base_model,
            args.lora_config,
            args.generation_config,
            json.dumps(scores.__dict__, ensure_ascii=False),
            json.dumps(gates, ensure_ascii=False),
            round(final, 4),
            1 if reasons else 0,
            "; ".join(reasons) if reasons else args.notes,
        ),
    )
    connection.commit()

    print(f"\n{args.experiment} / {args.checkpoint}")
    for key in WEIGHTS:
        value = getattr(scores, key)
        marker = "  (รอคนประเมิน)" if key == "motif_fidelity" and pending_human else ""
        print(f"  {key:<20} {value:6.3f}  x{WEIGHTS[key]:.2f}{marker}")
    print(f"  {'FINAL':<20} {final:6.3f}")
    for key, value in gates.items():
        print(f"  gate · {key}: {value}")
    if reasons:
        print("  ตกเกณฑ์: " + "; ".join(reasons))


# --------------------------------------------------------------------------
# โหมด report
# --------------------------------------------------------------------------

def cmd_report(args: argparse.Namespace) -> None:
    connection = ensure_db(Path(args.db))
    rows = connection.execute(
        "SELECT experiment_id, checkpoint, step, final_score, disqualified, notes"
        " FROM results ORDER BY experiment_id, step"
    ).fetchall()
    if not rows:
        print("ยังไม่มีผลใน database")
        return

    print(f"{'experiment':<16}{'checkpoint':<14}{'step':>6}{'score':>8}  สถานะ")
    valid: list[tuple] = []
    for experiment, checkpoint, step, score, disqualified, notes in rows:
        status = f"ตกเกณฑ์: {notes}" if disqualified else "ผ่าน"
        print(f"{experiment:<16}{checkpoint:<14}{step or 0:>6}{score:>8.3f}  {status}")
        if not disqualified:
            valid.append((experiment, checkpoint, step or 0, score))

    if not valid:
        print("\nไม่มี checkpoint ที่ผ่าน gate เลย")
        return

    # smooth สามจุด กันคะแนนกระโดดจาก noise ของการสุ่มภาพ
    smoothed = []
    for index, (experiment, checkpoint, step, score) in enumerate(valid):
        window = [v[3] for v in valid[max(0, index - 1) : index + 2]]
        smoothed.append((experiment, checkpoint, step, score, statistics.mean(window)))

    best = max(smoothed, key=lambda r: r[4])
    # parsimony — checkpoint ที่ step น้อยกว่าและคะแนนห่างไม่เกิน 2% ถือว่าดีกว่า
    # เพราะ memorize น้อยกว่าเสมอ
    for row in smoothed:
        if row[2] < best[2] and row[4] >= best[4] * 0.98:
            best = row

    print(f"\nแนะนำ: {best[0]} / {best[1]} (step {best[2]}, smoothed {best[4]:.3f})")
    top = sorted(smoothed, key=lambda r: -r[4])[:3]
    print("ควรเปิดดูภาพของสามตัวนี้ด้วยตาก่อนตัดสินใจจริง:")
    for row in top:
        print(f"  - {row[0]} / {row[1]} ({row[4]:.3f})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    cal = sub.add_parser("calibrate", help="หาเกณฑ์จาก dataset")
    cal.add_argument("--dataset", default=str(HERE / "dataset" / "v1"))
    cal.set_defaults(func=cmd_calibrate)

    sco = sub.add_parser("score", help="ให้คะแนน checkpoint")
    sco.add_argument("--dataset", default=str(HERE / "dataset" / "v1"))
    sco.add_argument("--generated", required=True)
    sco.add_argument("--experiment", required=True)
    sco.add_argument("--checkpoint", required=True)
    sco.add_argument("--step", type=int, default=0)
    sco.add_argument("--base-model", default="stabilityai/stable-diffusion-xl-base-1.0")
    sco.add_argument("--lora-config", default="{}")
    sco.add_argument("--generation-config", default="{}")
    sco.add_argument("--db", default=str(DEFAULT_DB))
    sco.add_argument("--notes", default="")
    sco.add_argument(
        "--motif-fidelity",
        type=float,
        default=-1.0,
        help="คะแนน 0-1 จากคนหรือ LLM pairwise ถ้าไม่ใส่จะถือว่ายังไม่ประเมิน",
    )
    sco.set_defaults(func=cmd_score)

    rep = sub.add_parser("report", help="สรุปและเลือก checkpoint")
    rep.add_argument("--db", default=str(DEFAULT_DB))
    rep.set_defaults(func=cmd_report)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
