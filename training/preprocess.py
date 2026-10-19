"""
เตรียม dataset สำหรับเทรน LoRA ลายผ้าไหมมัดหมี่อีสาน

ภาพผ้าหนึ่งใบคือ repeating texture ดังนั้นการตัดเป็น tile ย่อยไม่ใช่การปลอมข้อมูล
แต่ละ tile คือตัวอย่างที่ถูกต้องของ visual language เดียวกัน
ภาพผ้า 20 ใบจึงกลายเป็น tile หลักร้อยที่ใช้เทรนได้จริง

ขั้นตอน
  1. อ่านภาพต้นฉบับ + ข้อมูลลายจาก manifest
  2. ตัด tile จัตุรัสหลายสเกลแบบ sliding window
  3. ทิ้ง tile ที่เบลอ (Laplacian variance ต่ำกว่าเปอร์เซ็นไทล์ที่กำหนด)
  4. ทิ้ง tile ที่ซ้ำกัน (perceptual hash)
  5. ทิ้ง tile ที่เป็นพื้นเรียบไม่มีลาย (edge density ต่ำ)
  6. เขียน caption ต่อ tile จาก template
  7. สรุปจำนวนต่อตระกูลลาย เพื่อดูว่าข้อมูลเอียงไปทางไหน

การใช้งาน
    python training/preprocess.py
    python training/preprocess.py --tile-size 768 --out training/dataset/v1
"""

from __future__ import annotations

import argparse
import json
import shutil
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np
from scipy.fftpack import dct

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "public" / "silk"
MANIFEST = Path(__file__).resolve().parent / "manifest.json"
REJECT = Path(__file__).resolve().parent / "reject.json"

TRIGGER = "isaanmudmee"


# --------------------------------------------------------------------------
# คุณภาพของ tile
# --------------------------------------------------------------------------

def sharpness(gray: np.ndarray) -> float:
    """ความคมของภาพ — ภาพเบลอจะสอนให้โมเดลสร้างภาพเบลอ"""
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def edge_density(gray: np.ndarray) -> float:
    """
    สัดส่วนพิกเซลที่เป็นขอบ ใช้คัด tile ที่เป็นพื้นเรียบไม่มีลาย
    ใช้เกณฑ์ Canny ที่ปรับตามความสว่างของภาพ เพราะผ้าโทนเข้มกับโทนสว่าง
    ให้ค่าต่างกันมากถ้าใช้เกณฑ์ตายตัว
    """
    median = float(np.median(gray))
    lower = int(max(0, 0.66 * median))
    upper = int(min(255, 1.33 * median))
    edges = cv2.Canny(gray, lower, upper)
    return float((edges > 0).mean())


def phash(gray: np.ndarray, size: int = 32, keep: int = 8) -> int:
    """
    perceptual hash แบบ DCT เขียนเองเพื่อไม่ต้องพึ่ง imagehash
    คืนค่าเป็นเลขฐานสอง 64 บิต เทียบกันด้วย hamming distance
    """
    small = cv2.resize(gray, (size, size), interpolation=cv2.INTER_AREA).astype(np.float32)
    coeffs = dct(dct(small, axis=0, norm="ortho"), axis=1, norm="ortho")[:keep, :keep]
    # ตัด DC ออก เพราะมันคือความสว่างรวม ไม่ใช่โครงสร้างลาย
    flat = coeffs.flatten()[1:]
    bits = flat > np.median(flat)
    value = 0
    for bit in bits:
        value = (value << 1) | int(bit)
    return value


def hamming(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


# --------------------------------------------------------------------------
# การตัด tile
# --------------------------------------------------------------------------

@dataclass
class Tile:
    source: str
    family: str
    caption: str
    image: np.ndarray = field(repr=False)
    scale: float = 1.0
    sharp: float = 0.0
    edges: float = 0.0
    hash: int = 0


def crop_tiles(
    image: np.ndarray, scales: list[float], overlap: float, min_side: int
) -> list[tuple[np.ndarray, float]]:
    """
    ตัดจัตุรัสหลายสเกลแบบ sliding window
    สเกลเล็กให้ลายใกล้ขึ้น สเกลใหญ่เก็บโครงการจัดวาง ทั้งสองอย่างมีค่าต่อการเรียนรู้
    """
    height, width = image.shape[:2]
    base = min(height, width)
    out: list[tuple[np.ndarray, float]] = []

    for scale in scales:
        side = int(base * scale)
        # ห้ามตัด crop ที่เล็กกว่าขนาดที่ยอมให้อัปสเกล
        # การขยายภาพเล็กขึ้นไปเป็น tile ใหญ่ทำให้ลายนุ่มจนโมเดลเรียนความเบลอไปด้วย
        if side < min_side:
            continue
        step = max(1, int(side * (1.0 - overlap)))
        ys = list(range(0, max(1, height - side + 1), step))
        xs = list(range(0, max(1, width - side + 1), step))
        # เก็บขอบขวา/ล่างไว้ด้วย ไม่งั้นลายริมผ้าจะหายไปทั้งชุด
        if ys[-1] != height - side and height - side > 0:
            ys.append(height - side)
        if xs[-1] != width - side and width - side > 0:
            xs.append(width - side)

        for y in ys:
            for x in xs:
                out.append((image[y : y + side, x : x + side], scale))
    return out


def build_caption(entry: dict, scale: float) -> str:
    """
    caption เขียนเฉพาะสิ่งที่ "แปรผัน" ระหว่างภาพ
    คุณสมบัติที่เหมือนกันทุกใบ (ผ้าไหม ทอมือ สมมาตร) ปล่อยให้ trigger token แบกไว้
    ถ้าเขียนลงไปด้วย โมเดลจะผูกคุณสมบัตินั้นกับคำ แทนที่จะผูกกับ trigger
    """
    parts = [TRIGGER, entry["motif"], entry["composition"], entry["colors"]]
    # สเกลต่างกันคือระยะมองต่างกัน บอกโมเดลไว้จะได้ควบคุมได้ตอน generate
    if scale <= 0.55:
        parts.append("close detail")
    elif scale >= 0.95:
        parts.append("full repeat")
    return ", ".join(p for p in parts if p)


# --------------------------------------------------------------------------
# ขั้นตอนหลัก
# --------------------------------------------------------------------------

def run(args: argparse.Namespace) -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries = {e["id"]: e for e in manifest["images"] if e.get("use", True)}
    skipped_ids = [e["id"] for e in manifest["images"] if not e.get("use", True)]

    out_dir = Path(args.out)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    img_dir = out_dir / "images"
    img_dir.mkdir(parents=True)

    scales = [float(s) for s in args.scales.split(",")]
    candidates: list[Tile] = []

    for pattern_id, entry in entries.items():
        path = SOURCE_DIR / f"{pattern_id}.jpg"
        if not path.exists():
            print(f"  ! ไม่พบไฟล์ {path.name}")
            continue

        image = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if image is None:
            print(f"  ! อ่านไม่ได้ {path.name}")
            continue

        min_side = int(args.tile_size / args.max_upscale)
        crops = crop_tiles(image, scales, args.overlap, min_side)
        if not crops:
            usable = min(image.shape[:2])
            print(
                f"  ! {pattern_id}: ความละเอียดไม่พอ ตัดจัตุรัสได้ใหญ่สุด {usable}px "
                f"ต้องการอย่างน้อย {min_side}px"
            )
            continue

        for crop, scale in crops:
            tile = cv2.resize(crop, (args.tile_size, args.tile_size), interpolation=cv2.INTER_LANCZOS4)
            gray = cv2.cvtColor(tile, cv2.COLOR_BGR2GRAY)
            candidates.append(
                Tile(
                    source=pattern_id,
                    family=entry["family"],
                    caption=build_caption(entry, scale),
                    image=tile,
                    scale=scale,
                    sharp=sharpness(gray),
                    edges=edge_density(gray),
                    hash=phash(gray),
                )
            )

    if not candidates:
        print("ไม่ได้ tile เลย ตรวจ manifest กับโฟลเดอร์ภาพต้นฉบับ")
        return

    print(f"ตัดได้ {len(candidates)} tiles จาก {len(entries)} ภาพ")
    if skipped_ids:
        print(f"ข้ามภาพที่ปิดไว้ใน manifest: {', '.join(skipped_ids)}")

    # --- คัดภาพเบลอ แยกรายภาพ ---
    # เกณฑ์ความคมต้องเทียบ "ภายในภาพเดียวกัน" ไม่ใช่เทียบทั้งชุด
    # เพราะภาพต้นฉบับแต่ละใบคมไม่เท่ากัน ถ้าใช้เกณฑ์รวมจะลบภาพที่นุ่มกว่าเพื่อนทิ้งทั้งใบ
    by_source: dict[str, list[Tile]] = {}
    for tile in candidates:
        by_source.setdefault(tile.source, []).append(tile)

    kept: list[Tile] = []
    for source, tiles in by_source.items():
        cut = float(np.percentile([t.sharp for t in tiles], args.blur_percentile))
        kept.extend(t for t in tiles if t.sharp >= cut)
    print(f"ตัดภาพเบลอออก {len(candidates) - len(kept)} (เกณฑ์ {args.blur_percentile:.0f}% ล่างของแต่ละภาพ)")

    # --- คัดพื้นเรียบไม่มีลาย ---
    # ใช้เกณฑ์รวมได้ เพราะ "ไม่มีลาย" คือข้อเท็จจริง ไม่ใช่เรื่องเทียบกัน
    # แต่ต้องรายงานด้วยว่าภาพไหนโดนลบจนหมด
    before = len(kept)
    survivors = [t for t in kept if t.edges >= args.min_edges]
    lost = {
        source
        for source in by_source
        if any(t.source == source for t in kept) and not any(t.source == source for t in survivors)
    }
    kept = survivors
    print(f"ตัดพื้นเรียบออก {before - len(kept)} (edge density < {args.min_edges})")
    if lost:
        print(f"  ! ภาพที่ถูกลบจนไม่เหลือ tile: {', '.join(sorted(lost))}")
        print("    แปลว่าภาพเหล่านี้ลายจางมากหรือคอนทราสต์ต่ำ ควรหาไฟล์ที่ชัดกว่ามาแทน")

    # --- คัดภาพซ้ำ ---
    # เรียงตามความคมก่อน เวลาชนกันจะได้เก็บใบที่คมกว่าไว้
    kept.sort(key=lambda t: -t.sharp)
    unique: list[Tile] = []
    for tile in kept:
        if all(hamming(tile.hash, u.hash) > args.hash_distance for u in unique):
            unique.append(tile)
    print(f"ตัดภาพซ้ำออก {len(kept) - len(unique)} (hamming <= {args.hash_distance})")

    # --- ปรับสมดุลตระกูลลาย ---
    # ตระกูลที่มี tile เยอะจะครอบงำการเรียนรู้ จึงจำกัดเพดานต่อตระกูล
    by_family: dict[str, list[Tile]] = {}
    for tile in unique:
        by_family.setdefault(tile.family, []).append(tile)

    balanced: list[Tile] = []
    for family, tiles in by_family.items():
        tiles.sort(key=lambda t: -t.sharp)
        balanced.extend(tiles[: args.max_per_family])

    dropped = len(unique) - len(balanced)
    if dropped:
        print(f"ตัดส่วนเกินของตระกูลที่มีเยอะออก {dropped} (เพดาน {args.max_per_family}/ตระกูล)")

    # --- ตัด tile ที่คนคัดทิ้งจากหน้า browse.html ---
    # อ้างด้วย perceptual hash ไม่ใช่ชื่อไฟล์ เพราะชื่อไฟล์เป็นเลขลำดับ
    # พอรันใหม่ลำดับจะเลื่อน รายการที่ทิ้งไว้จะชี้ผิดใบ
    if REJECT.exists():
        rejected = json.loads(REJECT.read_text(encoding="utf-8")).get("reject", [])
        hashes = [int(r["hash"]) for r in rejected if isinstance(r, dict) and "hash" in r]
        if hashes:
            before_reject = len(balanced)
            balanced = [
                t for t in balanced if all(hamming(t.hash, h) > args.hash_distance for h in hashes)
            ]
            print(f"ตัด tile ที่คนคัดทิ้งออก {before_reject - len(balanced)} (จาก {REJECT.name})")

    # --- เขียนไฟล์ ---
    records = []
    for index, tile in enumerate(sorted(balanced, key=lambda t: (t.family, t.source))):
        name = f"{index:04d}_{tile.source}"
        cv2.imwrite(str(img_dir / f"{name}.png"), tile.image)
        (img_dir / f"{name}.txt").write_text(tile.caption, encoding="utf-8")
        records.append(
            {
                "file": f"{name}.png",
                "source": tile.source,
                "family": tile.family,
                "scale": tile.scale,
                "caption": tile.caption,
                "sharpness": round(tile.sharp, 2),
                "edge_density": round(tile.edges, 4),
                "hash": str(tile.hash),
            }
        )

    counts = Counter(r["family"] for r in records)
    summary = {
        "tile_size": args.tile_size,
        "trigger": TRIGGER,
        "source_images": len(entries),
        "tiles": len(records),
        "families": dict(counts),
        "settings": {
            "scales": scales,
            "overlap": args.overlap,
            "blur_percentile": args.blur_percentile,
            "min_edges": args.min_edges,
            "hash_distance": args.hash_distance,
            "max_per_family": args.max_per_family,
        },
        "records": records,
    }
    (out_dir / "dataset.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"\nเขียน {len(records)} tiles ลง {img_dir}")
    print("จำนวนต่อตระกูลลาย:")
    for family, count in counts.most_common():
        bar = "#" * max(1, round(count / max(counts.values()) * 28))
        print(f"  {family:<12} {count:>4}  {bar}")

    per_source = Counter(r["source"] for r in records)
    empty = [i for i in entries if i not in per_source]
    thin = [i for i, n in per_source.items() if n < args.min_per_source]
    print("\nจำนวนต่อภาพต้นฉบับ:")
    for source, count in per_source.most_common():
        print(f"  {source:<22} {count:>3}")
    if empty:
        print(f"\n  ! ไม่เหลือ tile เลย: {', '.join(empty)}")
    if thin:
        print(f"  ! มี tile น้อยกว่า {args.min_per_source}: {', '.join(sorted(thin))}")

    smallest = min(counts.values())
    largest = max(counts.values())
    if largest > smallest * 2.5:
        print(
            "\n  ! ตระกูลลายไม่สมดุล (มากสุด/น้อยสุด = "
            f"{largest}/{smallest}) ตระกูลที่มีน้อยจะถูกกลบตอนเทรน"
        )
    if len(records) < 120:
        print(f"\n  ! ได้ tile แค่ {len(records)} ใบ ซึ่งน้อยสำหรับเทรน LoRA")
        print("    ลองลด --overlap, เพิ่มสเกล, หรือเพิ่มภาพต้นฉบับ")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default=str(Path(__file__).parent / "dataset" / "v1"))
    parser.add_argument("--tile-size", type=int, default=768)
    parser.add_argument("--scales", default="1.0,0.75,0.55")
    parser.add_argument("--overlap", type=float, default=0.25)
    parser.add_argument("--blur-percentile", type=float, default=20.0)
    parser.add_argument("--min-edges", type=float, default=0.02)
    parser.add_argument("--hash-distance", type=int, default=6)
    parser.add_argument("--max-per-family", type=int, default=60)
    parser.add_argument("--min-per-source", type=int, default=5)
    parser.add_argument(
        "--max-upscale",
        type=float,
        default=1.15,
        help="ยอมให้ขยาย crop ได้กี่เท่าก่อนย่อ/ขยายเป็น tile (1.0 = ห้ามขยายเลย)",
    )
    run(parser.parse_args())


if __name__ == "__main__":
    main()
