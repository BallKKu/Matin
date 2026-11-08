"""
เพิ่มข้อมูลเทรนด้วยการหมุนเฉดสีและพลิกภาพ

ทำไมหมุนเฉดสีถึงไม่ใช่การปลอมข้อมูล
    ลายมัดหมี่ลายเดียวกันถูกทอด้วยโทนสีต่างกันจริงในแต่ละชุมชนและแต่ละยุค
    ลายขอนารีมีทั้งโทนแดงครั่ง โทนคราม และโทนเขียว โครงลายเป็นตัวเดียวกัน
    การหมุนเฉดจึงสร้างตัวอย่างที่ถูกต้องตามธรรมชาติของงานผ้า ต่างจากการ
    หมุนภาพหรือบิดภาพ ซึ่งทำลายแกนตั้งของลายที่ช่างทอยึดไว้

สิ่งที่ทำ
    1. หมุนเฉดสีเป็นโทนใหม่ โดยคงความอิ่มสีและน้ำหนักแสงเดิม
       ลายจึงเหมือนเดิมเป๊ะ เปลี่ยนแค่สีย้อม
    2. แก้ caption ให้ตรงกับสีใหม่ ไม่งั้นโมเดลจะเรียนว่าคำว่า indigo
       หมายถึงสีอะไรก็ได้ ซึ่งทำให้ควบคุมสีตอน generate ไม่ได้
    3. พลิกซ้ายขวา เพราะลายมัดหมี่สมมาตรอยู่แล้ว ภาพที่พลิกจึงยังถูกต้อง

สิ่งที่ตั้งใจไม่ทำ
    - ไม่หมุนภาพเป็นองศา ลายมัดหมี่มีแกนตั้งชัดเจน
    - ไม่พลิกบนล่าง ลายหลายตัวมียอดกับฐาน เช่น หมากเบ็ง พุ่มบายศรี
    - ไม่ครอปซ้ำ preprocess ทำไปแล้ว ครอปอีกจะได้ภาพซ้ำเปล่า ๆ

การใช้งาน
    python training/augment.py --dataset training/dataset/v2 --out training/dataset/v3
    python training/augment.py --hues 0,40,90,150,200,280 --no-flip
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from collections import Counter
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent

# ชื่อสีตามองศาเฉดใน HSV (OpenCV ใช้ 0-179 แต่ตรงนี้คิดเป็น 0-359)
# ใช้แปลง caption ให้ตรงกับสีที่หมุนไปจริง
COLOR_NAMES = [
    (0, "red"),
    (20, "burnt orange"),
    (40, "golden ochre"),
    (60, "olive"),
    (100, "green"),
    (160, "teal"),
    (200, "indigo"),
    (230, "deep blue"),
    (270, "violet"),
    (300, "magenta"),
    (330, "crimson pink"),
]

# คำสีที่ปรากฏใน caption ของ dataset พร้อมองศาเฉดของมัน
# คำที่ไม่มีเฉด (ขาว ครีม เทา ดำ) ไม่ต้องแก้ เพราะหมุนเฉดแล้วก็ยังเป็นสีเดิม
COLOR_WORD_HUE: dict[str, int] = {
    "burnt orange": 20, "bright orange": 25, "orange": 25,
    "golden ochre": 42, "gold": 45, "olive": 60,
    "green": 110, "teal": 170, "bright cyan": 185,
    "indigo": 205, "deep indigo": 205, "strong blue": 215, "blue": 215,
    "dark plum": 285, "bright violet": 275, "violet": 275,
    "orchid purple": 290, "dark purple": 285, "purple": 285,
    "magenta pink": 310, "magenta": 310, "hot pink": 325, "pink": 330,
    "dusty rose": 345, "crimson": 350, "scarlet": 355,
    "dark maroon": 358, "maroon": 358, "red": 0, "dark brown": 15,
}
def hue_name(shift: int) -> str:
    """ชื่อโทนสีหลังหมุนเฉดไปแล้ว"""
    best = min(COLOR_NAMES, key=lambda item: min(abs(item[0] - shift), 360 - abs(item[0] - shift)))
    return best[1]


def dominant_hue(bgr: np.ndarray) -> int:
    """
    เฉดหลักของภาพ คิดจากพิกเซลที่อิ่มสีพอ
    พิกเซลสีเทาไม่มีเฉดที่มีความหมาย ถ้ารวมเข้าไปค่าจะเพี้ยน
    """
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    hue, sat = hsv[:, :, 0], hsv[:, :, 1]
    mask = sat > 40
    if mask.sum() < hue.size * 0.02:
        return 0
    # เฉดเป็นค่าวน ต้องเฉลี่ยแบบเวกเตอร์ ไม่ใช่เฉลี่ยเลขตรง ๆ
    angles = hue[mask].astype(np.float32) * 2.0 * np.pi / 180.0
    mean = np.arctan2(np.sin(angles).mean(), np.cos(angles).mean())
    return int(np.degrees(mean) % 360)


def rotate_hue(bgr: np.ndarray, degrees: int, sat_scale: float = 0.88) -> np.ndarray:
    """
    หมุนเฉดสีทั้งภาพ คงน้ำหนักแสงไว้ โครงลายจึงไม่เปลี่ยน

    หรี่ความอิ่มสีลงเล็กน้อยด้วย เพราะเฉดบางช่วง (เขียวมะนาว ชมพูนีออน)
    เมื่อหมุนไปแล้วจะสดเกินกว่าสีย้อมธรรมชาติจะทำได้
    ถ้าปล่อยไว้ โมเดลจะเรียนว่าผ้าไหมมีสีแบบนั้น ซึ่งไม่จริง
    """
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 0] = (hsv[:, :, 0] + degrees // 2) % 180
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * sat_scale, 0, 215)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def recolor_caption(caption: str, shift: int) -> str:
    """
    หมุนคำสีทุกคำใน caption ไปตามองศาเดียวกับที่หมุนภาพ

    ถ้าไม่แก้ caption โมเดลจะเห็นคำว่า indigo คู่กับภาพสีส้ม แล้วสับสน
    จนควบคุมสีตอน generate ไม่ได้
    และต้องหมุน "ทุกคำ" ไม่ใช่แค่คำแรก ไม่งั้นประโยคอย่าง
    "indigo ground, gold accents" จะกลายเป็นสีที่ขัดกันเอง
    """
    if shift % 360 == 0:
        return caption

    words = sorted(COLOR_WORD_HUE, key=len, reverse=True)
    pattern = re.compile("|".join(re.escape(w) for w in words), re.IGNORECASE)

    def swap(match: re.Match[str]) -> str:
        original = match.group(0).lower()
        return hue_name((COLOR_WORD_HUE[original] + shift) % 360)

    return pattern.sub(swap, caption)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", default=str(HERE / "dataset" / "v2"))
    parser.add_argument("--out", default=str(HERE / "dataset" / "v3"))
    parser.add_argument(
        "--hues",
        default="0,45,90,140,190,240,290",
        help="องศาที่จะหมุนเฉดไป 0 คือเก็บสีเดิมไว้",
    )
    parser.add_argument("--no-flip", action="store_true")
    parser.add_argument("--sat-scale", type=float, default=0.88,
                        help="หรี่ความอิ่มสีของภาพที่หมุนเฉด ให้ดูเป็นสีย้อมจริง")
    parser.add_argument("--min-saturation", type=float, default=0.03,
                        help="ข้ามการหมุนเฉดถ้าภาพแทบไม่มีสี เช่น ผ้าขาวดำ")
    args = parser.parse_args()

    source = Path(args.dataset)
    summary = json.loads((source / "dataset.json").read_text(encoding="utf-8"))
    src_images = source / "images"

    out_dir = Path(args.out)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    img_dir = out_dir / "images"
    img_dir.mkdir(parents=True)

    shifts = [int(h) for h in args.hues.split(",")]
    records = []
    skipped_grey = 0

    for record in summary["records"]:
        path = src_images / record["file"]
        image = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if image is None:
            continue

        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        colourful = float((hsv[:, :, 1] > 40).mean())

        # ภาพที่แทบไม่มีสีจะหมุนเฉดไม่ขึ้น เก็บไว้เฉพาะตัวต้นฉบับ
        usable = shifts if colourful >= args.min_saturation else [0]
        if len(usable) == 1 and len(shifts) > 1:
            skipped_grey += 1

        for shift in usable:
            if shift == 0:
                tinted = image
                caption = record["caption"]
            else:
                tinted = rotate_hue(image, shift, args.sat_scale)
                caption = recolor_caption(record["caption"], shift)

            variants = [("", tinted)]
            if not args.no_flip:
                variants.append(("f", np.fliplr(tinted)))

            for tag, variant in variants:
                stem = Path(record["file"]).stem
                name = f"{stem}_h{shift:03d}{tag}.png"
                cv2.imwrite(str(img_dir / name), variant)
                (img_dir / f"{Path(name).stem}.txt").write_text(caption, encoding="utf-8")
                records.append(
                    {
                        "file": name,
                        "source": record["source"],
                        "family": record["family"],
                        "scale": record.get("scale", 1.0),
                        "caption": caption,
                        "hue_shift": shift,
                        "flipped": bool(tag),
                        "sharpness": record.get("sharpness", 0),
                        "edge_density": record.get("edge_density", 0),
                        "hash": record.get("hash", ""),
                    }
                )

    with (img_dir / "metadata.jsonl").open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(
                json.dumps({"file_name": record["file"], "text": record["caption"]}, ensure_ascii=False)
                + "\n"
            )

    counts = Counter(r["family"] for r in records)
    out_summary = {
        **{k: v for k, v in summary.items() if k != "records"},
        "tiles": len(records),
        "families": dict(counts),
        "augmentation": {
            "from": str(source),
            "base_tiles": summary["tiles"],
            "hue_shifts": shifts,
            "flip": not args.no_flip,
        },
        "records": records,
    }
    (out_dir / "dataset.json").write_text(
        json.dumps(out_summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    multiplier = len(records) / max(1, summary["tiles"])
    print(f"{summary['tiles']} tiles → {len(records)} tiles  (x{multiplier:.1f})")
    print(f"หมุนเฉด {len(shifts)} โทน" + ("" if args.no_flip else " × พลิกซ้ายขวา"))
    if skipped_grey:
        print(f"ภาพที่สีจางเกินจะหมุนเฉด จึงเก็บแค่ต้นฉบับ: {skipped_grey}")
    print("\nจำนวนต่อตระกูลลาย:")
    for family, count in counts.most_common():
        print(f"  {family:<12} {count:>5}")
    print(f"\nเขียนลง {img_dir}")


if __name__ == "__main__":
    main()
