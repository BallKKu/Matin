"""
สกัดภาพผ้าจาก PDF ต้นฉบับที่ความละเอียดจริง แบบไม่สูญเสียคุณภาพ

ไฟล์ใน public/silk/ ถูกย่อ/ขยายเป็นกว้าง 900px แล้วบีบ JPEG สำหรับใช้บนเว็บ
ภาพจริงใน PDF กว้างแค่ 422-745px หลายใบจึงถูกอัปสเกลขึ้นมาก่อนแล้วโดนบีบซ้ำ
ซึ่งทำให้ขอบลายฟุ้งตั้งแต่ต้นทาง ไม่เหมาะเป็นข้อมูลเทรน

สคริปต์นี้ดึงภาพที่ขนาดจริงและเขียนเป็น PNG เพื่อให้ pipeline เริ่มจาก
ข้อมูลที่คมที่สุดเท่าที่ต้นฉบับมี

การใช้งาน
    python training/extract_sources.py --pdf "C:/path/to/ลายผ้า.pdf"
"""

from __future__ import annotations

import argparse
from pathlib import Path

HERE = Path(__file__).resolve().parent

# xref ของภาพใน PDF ที่จับคู่กับลายแต่ละจังหวัดไว้แล้ว
# crop เป็นสัดส่วน (ซ้าย, บน, ขวา, ล่าง) ใช้ตัดคำบรรยายหรือพร็อพที่ติดมา
SOURCES: dict[str, tuple[int, tuple[float, float, float, float] | None]] = {
    "nong-khai": (21, None),
    "amnat-charoen": (23, None),
    "bueng-kan": (27, None),
    "chaiyaphum": (28, None),
    "khon-kaen": (31, (0.02, 0.02, 0.98, 0.79)),
    "kalasin": (33, None),
    "nakhon-ratchasima": (37, None),
    "loei": (38, None),
    "mukdahan": (54, None),
    "maha-sarakham": (56, None),
    "nong-bua-lamphu": (64, None),
    "nakhon-phanom": (66, None),
    "roi-et": (70, (0.10, 0.56, 0.83, 0.915)),
    "sakon-nakhon": (71, None),
    "si-sa-ket": (75, None),
    "surin": (79, None),
    "ubon-ratchathani": (82, None),
    "udon-thani": (84, None),
    "yasothon": (85, None),
    "buri-ram": (88, None),
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, help="ไฟล์ PDF ต้นฉบับ")
    parser.add_argument("--out", default=str(HERE / "source"))
    args = parser.parse_args()

    try:
        import pymupdf
    except ImportError:
        print("ต้องติดตั้งก่อน: pip install pymupdf")
        return

    document = pymupdf.open(args.pdf)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    rows = []
    for name, (xref, box) in SOURCES.items():
        try:
            pixmap = pymupdf.Pixmap(document, xref)
        except Exception as error:
            print(f"  ! {name}: อ่าน xref {xref} ไม่ได้ ({error})")
            continue

        if pixmap.n > 4:
            pixmap = pymupdf.Pixmap(pymupdf.csRGB, pixmap)
        if pixmap.alpha:
            pixmap = pymupdf.Pixmap(pixmap, 0)

        width, height = pixmap.width, pixmap.height
        if box:
            x0, y0 = int(box[0] * width), int(box[1] * height)
            x1, y1 = int(box[2] * width), int(box[3] * height)
        else:
            x0, y0, x1, y1 = 0, 0, width, height

        # วาดลงหน้าเปล่าขนาดเท่า crop แล้ว render ที่อัตราส่วน 1:1
        # ไม่ย่อไม่ขยาย จึงได้พิกเซลเดิมของต้นฉบับทุกเม็ด
        crop_w, crop_h = x1 - x0, y1 - y0
        page_doc = pymupdf.open()
        page = page_doc.new_page(width=crop_w, height=crop_h)
        page.insert_image(
            pymupdf.Rect(-x0, -y0, width - x0, height - y0), pixmap=pixmap
        )
        rendered = page.get_pixmap(matrix=pymupdf.Matrix(1, 1))
        rendered.save(str(out_dir / f"{name}.png"))

        square = min(rendered.width, rendered.height)
        rows.append((name, rendered.width, rendered.height, square))

    rows.sort(key=lambda r: -r[3])
    print(f"เขียน {len(rows)} ภาพลง {out_dir}\n")
    print(f"{'ภาพ':<22}{'ขนาดจริง':>14}{'จัตุรัสใหญ่สุด':>16}")
    for name, width, height, square in rows:
        print(f"{name:<22}{f'{width}x{height}':>14}{square:>14}px")

    squares = [r[3] for r in rows]
    print(f"\nจัตุรัสที่ตัดได้: เล็กสุด {min(squares)}px · กลาง {sorted(squares)[len(squares)//2]}px · ใหญ่สุด {max(squares)}px")
    print("ขนาด tile ที่ควรใช้ไม่ควรเกินค่ากลาง ไม่งั้นจะเสียภาพครึ่งหนึ่งไป")


if __name__ == "__main__":
    main()
