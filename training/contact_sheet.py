"""
สร้างหน้าเปิดดู dataset แบบโต้ตอบได้

ก่อนเทรนต้องเอาตาดู tile จริงทุกใบ สคริปต์คัดอัตโนมัติจับได้แค่ภาพเบลอ
พื้นเรียบ และภาพซ้ำ แต่จับไม่ได้ว่า tile ไหนตัดกลางลายจนเสียทรง
หรือติดขอบผ้าเข้ามา ซึ่งเป็นสิ่งที่ทำให้โมเดลเรียนผิด

ไฟล์ที่ได้เป็น HTML ไฟล์เดียวจบ ฝังภาพไว้ข้างในแล้ว เปิดที่ไหนก็ได้
กดเลือก tile ที่อยากทิ้ง แล้วกดคัดลอกรายชื่อไปใส่ reject.json

การใช้งาน
    python training/contact_sheet.py
    python training/contact_sheet.py --dataset training/dataset/v1 --thumb 240
"""

from __future__ import annotations

import argparse
import base64
import json
from pathlib import Path

import cv2

HERE = Path(__file__).resolve().parent


def thumbnail(path: Path, size: int, quality: int) -> str:
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        return ""
    image = cv2.resize(image, (size, size), interpolation=cv2.INTER_AREA)
    ok, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        return ""
    return base64.b64encode(buffer.tobytes()).decode("ascii")


PAGE = """<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dataset ลายผ้ามัดหมี่</title>
<style>
  :root {
    --bg: #14100c; --panel: #1e1813; --line: #352c22;
    --text: #f3ece3; --muted: #a2917f; --accent: #e0a44a; --bad: #d9534f;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
         font: 14px/1.6 "Segoe UI", system-ui, sans-serif; }
  header { position: sticky; top: 0; z-index: 5; background: var(--panel);
           border-bottom: 1px solid var(--line); padding: 14px 20px; }
  h1 { margin: 0 0 4px; font-size: 17px; letter-spacing: .02em; }
  .sub { color: var(--muted); font-size: 12px; }
  .controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; align-items: center; }
  button { background: #2a221a; color: var(--text); border: 1px solid var(--line);
           border-radius: 999px; padding: 6px 14px; font-size: 13px; cursor: pointer; }
  button:hover { border-color: var(--accent); }
  button.on { background: var(--accent); color: #231a0e; border-color: var(--accent); font-weight: 600; }
  .spacer { flex: 1; }
  .count { color: var(--muted); font-size: 12px; }
  main { padding: 18px 20px 80px; }
  .grid { display: grid; gap: 10px;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  figure { margin: 0; background: var(--panel); border: 1px solid var(--line);
           border-radius: 10px; overflow: hidden; cursor: pointer; position: relative; }
  figure img { width: 100%; display: block; aspect-ratio: 1; object-fit: cover; }
  figure.rejected { outline: 2px solid var(--bad); opacity: .45; }
  figure.rejected::after { content: "ทิ้ง"; position: absolute; top: 6px; right: 6px;
           background: var(--bad); color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 999px; }
  figcaption { padding: 7px 9px; font-size: 11px; color: var(--muted);
               border-top: 1px solid var(--line); }
  figcaption b { color: var(--text); font-weight: 600; display: block; }
  footer { position: fixed; left: 0; right: 0; bottom: 0; background: var(--panel);
           border-top: 1px solid var(--line); padding: 10px 20px;
           display: flex; gap: 12px; align-items: center; font-size: 13px; }
  code { background: #2a221a; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  dialog { background: var(--panel); color: var(--text); border: 1px solid var(--line);
           border-radius: 12px; max-width: 560px; width: 90vw; padding: 20px; }
  dialog::backdrop { background: #000a; }
  textarea { width: 100%; height: 200px; background: #14100c; color: var(--text);
             border: 1px solid var(--line); border-radius: 8px; padding: 10px;
             font: 12px/1.5 ui-monospace, monospace; }
</style>
</head>
<body>
<header>
  <h1>Dataset ลายผ้ามัดหมี่ &mdash; __TILES__ tiles จาก __SOURCES__ ภาพ</h1>
  <div class="sub">
    กดที่ tile เพื่อทำเครื่องหมายว่าจะทิ้ง &middot; ตัวเลขใต้ภาพคือความคม / ความหนาแน่นของขอบ
  </div>
  <div class="controls" id="filters"></div>
</header>

<main><div class="grid" id="grid"></div></main>

<footer>
  <span class="count" id="status"></span>
  <span class="spacer"></span>
  <button id="clear">ล้างที่เลือก</button>
  <button id="export" class="on">ส่งออกรายชื่อที่ทิ้ง</button>
</footer>

<dialog id="out">
  <h3 style="margin-top:0">รายชื่อ tile ที่เลือกทิ้ง</h3>
  <p class="sub" style="margin:0 0 10px">
    บันทึกเป็น <code>training/reject.json</code> แล้วรัน preprocess ใหม่ได้เลย
  </p>
  <textarea id="json" readonly></textarea>
  <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end">
    <button onclick="document.getElementById('out').close()">ปิด</button>
    <button class="on" id="copy">คัดลอก</button>
  </div>
</dialog>

<script>
const DATA = __DATA__;
const rejected = new Set();
let filter = "ทั้งหมด";

const families = ["ทั้งหมด", ...new Set(DATA.map(d => d.family))];
const filters = document.getElementById("filters");
families.forEach(name => {
  const button = document.createElement("button");
  button.textContent = name === "ทั้งหมด" ? name : `${name} (${DATA.filter(d => d.family === name).length})`;
  button.className = name === filter ? "on" : "";
  button.onclick = () => {
    filter = name;
    [...filters.children].forEach(c => c.className = "");
    button.className = "on";
    render();
  };
  filters.appendChild(button);
});

const grid = document.getElementById("grid");
const status = document.getElementById("status");

function render() {
  const shown = DATA.filter(d => filter === "ทั้งหมด" || d.family === filter);
  grid.innerHTML = "";
  shown.forEach(item => {
    const figure = document.createElement("figure");
    if (rejected.has(item.file)) figure.className = "rejected";
    figure.innerHTML =
      `<img src="data:image/jpeg;base64,${item.thumb}" alt="${item.file}" loading="lazy">` +
      `<figcaption><b>${item.source}</b>คม ${item.sharpness} &middot; ขอบ ${item.edge_density}</figcaption>`;
    figure.onclick = () => {
      rejected.has(item.file) ? rejected.delete(item.file) : rejected.add(item.file);
      render();
    };
    grid.appendChild(figure);
  });
  status.textContent = `แสดง ${shown.length} tiles · เลือกทิ้งแล้ว ${rejected.size}`;
}

document.getElementById("clear").onclick = () => { rejected.clear(); render(); };
document.getElementById("export").onclick = () => {
  document.getElementById("json").value =
    JSON.stringify({
      reject: DATA.filter(d => rejected.has(d.file))
                  .map(d => ({ file: d.file, source: d.source, hash: d.hash }))
    }, null, 2);
  document.getElementById("out").showModal();
};
document.getElementById("copy").onclick = async () => {
  const field = document.getElementById("json");
  try {
    await navigator.clipboard.writeText(field.value);
  } catch {
    field.select();
    document.execCommand("copy");
  }
};

render();
</script>
</body>
</html>
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", default=str(HERE / "dataset" / "v1"))
    parser.add_argument("--thumb", type=int, default=240)
    parser.add_argument("--quality", type=int, default=72)
    parser.add_argument("--out", default=None)
    args = parser.parse_args()

    dataset = Path(args.dataset)
    summary = json.loads((dataset / "dataset.json").read_text(encoding="utf-8"))

    records = []
    for record in summary["records"]:
        encoded = thumbnail(dataset / "images" / record["file"], args.thumb, args.quality)
        if not encoded:
            continue
        records.append(
            {
                "file": record["file"],
                "source": record["source"],
                "family": record["family"],
                "sharpness": round(record["sharpness"]),
                "edge_density": round(record["edge_density"], 3),
                "caption": record["caption"],
                "hash": record.get("hash", ""),
                "thumb": encoded,
            }
        )

    page = (
        PAGE.replace("__TILES__", str(len(records)))
        .replace("__SOURCES__", str(summary["source_images"]))
        .replace("__DATA__", json.dumps(records, ensure_ascii=False))
    )

    out_path = Path(args.out) if args.out else dataset / "browse.html"
    out_path.write_text(page, encoding="utf-8")
    size_mb = out_path.stat().st_size / 1024 / 1024
    print(f"เขียน {out_path} ({size_mb:.1f} MB, {len(records)} tiles)")


if __name__ == "__main__":
    main()
