"""ตรวจทุกเซลล์โค้ดในโน้ตบุ๊กว่า compile ผ่านไหม ก่อนส่งให้ผู้ใช้รันบน Colab"""

import json
import pathlib
import re
import sys

P = pathlib.Path(
    r"C:\Users\ASUS\Documents\LernP3T1\RM\Minta\Mudmee-pattern3d-main\training"
)


def strip_magics(source: str) -> str:
    """แปลงบรรทัด ! และ % ให้เป็นโค้ดที่ compile ได้ เพื่อตรวจส่วนที่เหลือ"""
    out = []
    continuing = False
    for line in source.split("\n"):
        stripped = line.lstrip()
        if continuing:
            out.append("pass")
            continuing = line.rstrip().endswith("\\")
            continue
        if stripped.startswith("!") or stripped.startswith("%"):
            out.append("pass")
            continuing = line.rstrip().endswith("\\")
            continue
        out.append(line)
    return "\n".join(out)


bad = 0
for notebook in sorted(P.glob("*.ipynb")):
    nb = json.loads(notebook.read_text(encoding="utf-8"))
    print(f"\n=== {notebook.name} ===")
    for index, cell in enumerate(nb["cells"]):
        if cell["cell_type"] != "code":
            continue
        source = "".join(cell["source"])
        try:
            compile(strip_magics(source), f"{notebook.name}:cell{index}", "exec")
        except SyntaxError as error:
            bad += 1
            print(f"  cell {index}: SyntaxError บรรทัด {error.lineno} — {error.msg}")
            lines = source.split("\n")
            lo = max(0, (error.lineno or 1) - 3)
            for n in range(lo, min(len(lines), (error.lineno or 1) + 2)):
                mark = ">>" if n == (error.lineno or 1) - 1 else "  "
                print(f"     {mark} {n+1:3d} | {lines[n]}")
    else:
        pass

print(f"\nเซลล์ที่มีปัญหา: {bad}")
sys.exit(1 if bad else 0)
