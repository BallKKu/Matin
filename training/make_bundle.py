"""
รวม dataset เป็นไฟล์ zip ไฟล์เดียว สำหรับอัปโหลดขึ้น Colab

Colab อัปโหลดไฟล์เดียวเร็วกว่าอัปโหลดภาพทีละร้อยใบมาก
และ zip ยังพก metadata.jsonl กับ dataset.json ไปด้วย

การใช้งาน
    python training/make_bundle.py
    python training/make_bundle.py --dataset training/dataset/v2
"""

from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", default=str(HERE / "dataset" / "v2"))
    parser.add_argument("--out", default=None)
    args = parser.parse_args()

    dataset = Path(args.dataset)
    images = dataset / "images"
    if not images.exists():
        print(f"ไม่พบ {images} รัน preprocess.py ก่อน")
        return

    summary = json.loads((dataset / "dataset.json").read_text(encoding="utf-8"))
    out_path = Path(args.out) if args.out else HERE / f"{dataset.name}_bundle.zip"

    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as bundle:
        for path in sorted(images.iterdir()):
            if path.is_file():
                bundle.write(path, f"images/{path.name}")
        bundle.write(dataset / "dataset.json", "dataset.json")

    size_mb = out_path.stat().st_size / 1024 / 1024
    print(f"เขียน {out_path}")
    print(f"  {summary['tiles']} tiles · {summary['tile_size']}px · {size_mb:.1f} MB")
    print(f"  trigger token: {summary['trigger']}")
    print("\nอัปโหลดไฟล์นี้ในเซลล์ที่สองของ colab_train.ipynb")


if __name__ == "__main__":
    main()
