"""
แปลงภาพที่ AI เจน ให้กลายเป็น "ผังทอ" ที่ช่างทอใช้ได้จริง

ปัญหาที่แก้
    โมเดลสร้างภาพทำงานโดยไล่ลดสัญญาณรบกวนทีละขั้น ไม่มีกลไกใดบังคับให้
    ภาพที่ได้สมมาตร อยู่บนกริด หรือมีลายซ้ำเป็นคาบ การเทรน LoRA ก็ไม่ช่วย
    เพราะ LoRA ปรับ "สไตล์" ไม่ได้ปรับ "โครงสร้างทางเรขาคณิต"
    ภาพจึงสวยได้ แต่ช่างทอตามไม่ได้ เพราะลายซ้ายขวาไม่ตรงกันและนับเส้นไม่ได้

    ทางแก้คือไม่หวังให้โมเดลทำเอง แต่บังคับด้วยโค้ดทีหลัง
    ผลคือได้ความสวยจาก AI และความถูกต้องเชิงโครงสร้างจากเรา

สิ่งที่บังคับ
    1. กริด      ย่อลงเป็นตารางเส้นไหม หนึ่งช่องคือหนึ่งเส้น นับได้
    2. สี        ลดเหลือไม่กี่สี เท่าจำนวนสีไหมที่ย้อมจริง
    3. สมมาตร    เอาครึ่งซ้ายสะท้อนไปขวา ซ้ายขวาจึงตรงกันเป๊ะ
    4. ลายซ้ำ    หาคาบของลายแล้วปูซ้ำ ทั้งผืนจึงเป็นแพทเทิร์นเดียวกัน

การใช้งาน
    python training/weaverize.py --input ภาพ.png
    python training/weaverize.py --input โฟลเดอร์/ --grid 96 --colors 5
    python training/weaverize.py --input ภาพ.png --no-repeat     ไม่บังคับลายซ้ำ
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np

IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def quantise(bgr: np.ndarray, colours: int) -> tuple[np.ndarray, np.ndarray]:
    """
    ลดจำนวนสีด้วย k-means ใน Lab เพราะระยะสีใน Lab ใกล้เคียงการรับรู้ของตา
    ถ้าทำใน BGR สีที่ตาเห็นว่าต่างกันมากอาจถูกจับรวมกัน
    """
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    samples = lab.reshape(-1, 3).astype(np.float32)

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    _, labels, centres = cv2.kmeans(
        samples, colours, None, criteria, 5, cv2.KMEANS_PP_CENTERS
    )

    palette = cv2.cvtColor(centres.astype(np.uint8).reshape(-1, 1, 3), cv2.COLOR_LAB2BGR)
    return labels.reshape(bgr.shape[:2]), palette.reshape(-1, 3)


def to_grid(labels: np.ndarray, size: int, colours: int) -> np.ndarray:
    """
    ย่อลงเป็นตารางเส้นไหม โดยแต่ละช่องเอาสีที่พบมากที่สุดในบริเวณนั้น
    ใช้เสียงข้างมาก ไม่ใช่ค่าเฉลี่ย เพราะเฉลี่ยสีจะได้สีที่ไม่มีอยู่จริงในจานสี
    """
    height, width = labels.shape
    grid = np.zeros((size, size), np.int32)
    ys = np.linspace(0, height, size + 1).astype(int)
    xs = np.linspace(0, width, size + 1).astype(int)

    for row in range(size):
        for col in range(size):
            block = labels[ys[row] : ys[row + 1], xs[col] : xs[col + 1]]
            if block.size:
                grid[row, col] = np.bincount(block.ravel(), minlength=colours).argmax()
    return grid


def enforce_mirror(grid: np.ndarray) -> np.ndarray:
    """
    บังคับสมมาตรซ้ายขวา โดยเอาครึ่งซ้ายสะท้อนไปเป็นครึ่งขวา

    ลายมัดหมี่ทอด้วยการมัดเส้นพุ่งเป็นช่วงแล้วสะท้อนกลับ ซ้ายขวาจึงตรงกันเสมอ
    ถ้าไม่ตรง ช่างจะทอตามไม่ได้เพราะต้องมัดคนละแบบทั้งสองฝั่ง
    """
    size = grid.shape[1]
    half = size // 2
    out = grid.copy()
    out[:, size - half :] = np.fliplr(grid[:, :half])
    if size % 2:
        out[:, half] = grid[:, half]
    return out


def find_period(grid: np.ndarray, minimum: int = 10) -> tuple[int, float]:
    """
    หาคาบของลายตามแนวตั้ง ด้วยการเทียบว่าเลื่อนไปกี่แถวแล้วลายทับกันดีที่สุด

    ใช้สัดส่วนช่องที่ตรงกันเป็นเกณฑ์ ไม่ใช่ผลต่างของตัวเลขสี
    เพราะหมายเลขสีเป็นป้ายชื่อ ไม่ใช่ปริมาณที่เอามาลบกันได้

    คืนคาบที่ดีที่สุดเสมอ ไม่ยอมแพ้แม้คะแนนต่ำ เพราะภาพจาก AI แทบไม่มีคาบ
    ตามธรรมชาติอยู่แล้ว แต่ช่างทอต้องการลายที่ซ้ำได้ เราจึงต้องเลือกคาบให้
    แล้วปูซ้ำ ถึงจะเสียองค์ประกอบเดิมไปบ้างก็ตาม
    """
    size = grid.shape[0]
    best, score = size, 0.0
    for period in range(minimum, size // 2 + 1):
        match = float((grid[: size - period] == grid[period:]).mean())
        if match > score:
            best, score = period, match
    return best, score


def enforce_repeat(grid: np.ndarray, period: int) -> np.ndarray:
    """ปูลายหนึ่งคาบซ้ำให้เต็มผืน ทั้งผืนจึงเป็นแพทเทิร์นเดียวกันจริง ๆ"""
    size = grid.shape[0]
    if period >= size:
        return grid
    unit = grid[:period]
    tiled = np.tile(unit, (size // period + 1, 1))[:size]
    return tiled


def render(grid: np.ndarray, palette: np.ndarray, cell: int, major: int = 8) -> np.ndarray:
    """วาดผังเป็นภาพ ทุกช่องเท่ากันเป๊ะ มีเส้นกริดบนรอยต่อช่อง"""
    size = grid.shape[0]
    canvas = np.zeros((size * cell, size * cell, 3), np.uint8)
    for row in range(size):
        for col in range(size):
            colour = palette[grid[row, col]]
            canvas[row * cell : (row + 1) * cell, col * cell : (col + 1) * cell] = colour

    if cell >= 4:
        for i in range(size + 1):
            thickness = 2 if i % major == 0 else 1
            alpha = 0.45 if i % major == 0 else 0.18
            x = min(i * cell, canvas.shape[1] - thickness)
            y = min(i * cell, canvas.shape[0] - thickness)
            canvas[:, x : x + thickness] = (
                canvas[:, x : x + thickness] * (1 - alpha)
            ).astype(np.uint8)
            canvas[y : y + thickness, :] = (
                canvas[y : y + thickness, :] * (1 - alpha)
            ).astype(np.uint8)
    return canvas


def symmetry_score(grid: np.ndarray) -> float:
    return float((grid == np.fliplr(grid)).mean())


def repeat_score(grid: np.ndarray, period: int) -> float:
    size = grid.shape[0]
    if period >= size:
        return 0.0
    return float((grid[: size - period] == grid[period:]).mean())


def process(path: Path, args: argparse.Namespace, out_dir: Path) -> dict:
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        return {"file": path.name, "error": "อ่านภาพไม่ได้"}

    labels, palette = quantise(image, args.colors)
    grid = to_grid(labels, args.grid, args.colors)

    before_symmetry = symmetry_score(grid)
    period_before, _ = find_period(grid)
    before_repeat = repeat_score(grid, period_before)

    if not args.no_mirror:
        grid = enforce_mirror(grid)

    if args.period:
        period, confidence = args.period, repeat_score(grid, args.period)
    else:
        period, confidence = find_period(grid)

    if not args.no_repeat:
        grid = enforce_repeat(grid, period)

    after_symmetry = symmetry_score(grid)
    after_repeat = repeat_score(grid, period)

    chart = render(grid, palette, args.cell)
    out_png = out_dir / f"{path.stem}_chart.png"
    cv2.imwrite(str(out_png), chart)

    (out_dir / f"{path.stem}_chart.json").write_text(
        json.dumps(
            {
                "source": path.name,
                "threads": args.grid,
                "colours": [
                    "#%02x%02x%02x" % (int(c[2]), int(c[1]), int(c[0])) for c in palette
                ],
                "repeat_rows": int(period),
                "grid": grid.tolist(),
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    return {
        "file": path.name,
        "symmetry_before": round(before_symmetry, 3),
        "symmetry_after": round(after_symmetry, 3),
        "repeat_before": round(before_repeat, 3),
        "repeat_after": round(after_repeat, 3),
        "period": int(period),
        "confidence": round(confidence, 3),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="ไฟล์ภาพหรือโฟลเดอร์")
    parser.add_argument("--out", default=None)
    parser.add_argument("--grid", type=int, default=96, help="จำนวนเส้นไหมต่อด้าน")
    parser.add_argument("--colors", type=int, default=5, help="จำนวนสีไหม")
    parser.add_argument("--cell", type=int, default=8, help="ขนาดหนึ่งช่องเมื่อวาด (px)")
    parser.add_argument("--no-mirror", action="store_true", help="ไม่บังคับสมมาตร")
    parser.add_argument("--no-repeat", action="store_true", help="ไม่บังคับลายซ้ำ")
    parser.add_argument("--period", type=int, default=0,
                        help="กำหนดคาบของลายเอง เป็นจำนวนแถว ไม่ใส่คือให้หาเอง")
    args = parser.parse_args()

    source = Path(args.input)
    paths = (
        [source]
        if source.is_file()
        else sorted(p for p in source.iterdir() if p.suffix.lower() in IMAGE_EXT)
    )
    if not paths:
        print(f"ไม่พบภาพใน {source}")
        return

    out_dir = Path(args.out) if args.out else (source if source.is_dir() else source.parent) / "charts"
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"แปลง {len(paths)} ภาพ · กริด {args.grid} เส้น · {args.colors} สี\n")
    print(f"{'ไฟล์':<16}{'สมมาตร':>18}{'ลายซ้ำ':>18}{'คาบ':>7}{'ความพอดี':>10}")
    print(f"{'':<16}{'ก่อน → หลัง':>18}{'ก่อน → หลัง':>18}")

    for path in paths:
        result = process(path, args, out_dir)
        if "error" in result:
            print(f"{path.name:<16} {result['error']}")
            continue
        print(
            f"{result['file']:<16}"
            f"{result['symmetry_before']:>8.3f} →{result['symmetry_after']:>7.3f}"
            f"{result['repeat_before']:>9.3f} →{result['repeat_after']:>7.3f}"
            f"{result['period']:>7}{result['confidence']:>10.3f}"
        )

    print(f"\nเขียนผังลง {out_dir}")
    print("ไฟล์ .json คือผังทอจริง หนึ่งตัวเลขคือหนึ่งเส้นไหม ช่างอ่านไปทอได้เลย")


if __name__ == "__main__":
    main()
