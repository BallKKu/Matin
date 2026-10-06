import {
  GROUND_VALUES,
  MOTIFS,
  buildBorder,
  createGrid,
  gget,
  gset,
  stampGrid,
  steppedDiamond,
  type Grid,
  type MotifId,
} from "@/lib/mudmeeMotifs";
import { patternMotifs, type Pattern } from "@/lib/silk-patterns";

/**
 * ประกอบผ้าผืนใหม่จากลายหลักของผ้าที่เลือก
 *
 * โครงเป็นริ้วแนวตั้งแบบผ้าซิ่นอีสาน สมมาตรรอบแกนกลาง:
 *   ริมผ้า | ริ้วคั่น | แถบข้าง | ริ้วคั่น | แถบกลาง | ริ้วคั่น | แถบข้าง | ริ้วคั่น | ริมผ้า
 * แถบกลางใช้พื้นคนละสีและวางลายหลักของผืนแรก
 * แถบข้างวางลายของผืนที่เหลือ ริ้วคั่นเป็นลายเล็กขนาบเส้นยืนสีอุ่น
 * ปิดท้ายด้วยเชิงผ้าด้านล่าง
 */

const CELL = 3; // ขนาดเส้นไหมหนึ่งเส้นเมื่อเรนเดอร์ (px)
const COLS = 256; // จำนวนเส้นยืน
const ROWS = 256; // จำนวนเส้นพุ่ง

const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
};

/** ปรับความสว่างของสี ใช้ถอยพื้นให้เข้มขึ้นหรือดึงสีลายให้สว่างขึ้น */
function shade(hex: string, factor: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(factor > 1 ? v + (255 - v) * (factor - 1) : v * factor)))
  );
  return `#${ch.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** หมุนเฉดสี ใช้หาสีพื้นของแถบกลางให้ต่างจากพื้นหลัก */
function rotateHue(hex: string, deg: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1) || 1);
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = (h * 60 + deg + 360) % 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return `#${[r1, g1, b1]
    .map((v) =>
      Math.max(0, Math.min(255, Math.round((v + m) * 255)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

/**
 * จานสี 6 ช่อง
 * 0 พื้นหลัก · 1 สีลาย · 2 สีรอง · 3 ไฮไลต์ · 4 พื้นแถบกลาง · 5 สีอุ่นของริ้ว
 */
function buildPalette(selected: Pattern[]) {
  const unique = Array.from(new Set(selected.flatMap((pattern) => pattern.colors))).sort(
    (a, b) => luminance(a) - luminance(b)
  );

  let ground = unique[0];
  let bright = unique[unique.length - 1];
  const mid = unique[Math.floor(unique.length * 0.55)] ?? bright;
  const deep = unique[Math.floor(unique.length * 0.3)] ?? mid;
  const highlight = luminance(deep) > luminance(ground) + 45 ? deep : bright;

  // ผ้าบางผืนสีใกล้กันหมด ถ้าปล่อยไว้ลายจะจมไปกับพื้น จึงถ่างคอนทราสต์ให้พอ
  if (luminance(bright) - luminance(ground) < 95) {
    ground = shade(ground, 0.42);
    bright = shade(bright, 1.45);
  }

  const panel = shade(rotateHue(ground, randInt(26, 50)), 1.3);
  const warm = shade(rotateHue(bright, 150), 0.8);

  return [ground, bright, mid, highlight, panel, warm];
}

/* ---------- ส่วนประกอบของผืนผ้า ---------- */

/** ริ้วคั่นแนวตั้ง: เส้นยืนสีอุ่นขนาบลายเล็กที่ซ้ำตลอดความสูง */
function drawStripe(field: Grid, x0: number, width: number, motif: MotifId | null) {
  for (let y = 0; y < ROWS; y += 1) {
    gset(field, x0, y, 5);
    gset(field, x0 + 1, y, 1);
    gset(field, x0 + width - 1, y, 5);
    gset(field, x0 + width - 2, y, 1);
  }
  if (!motif || width < 8) return;

  const inner = width - 4;
  const tile = MOTIFS[motif].build(inner, inner);
  for (let y = -inner; y < ROWS; y += inner + 1) stampGrid(field, tile, x0 + 2, y);
}

/** ริมผ้า: ริ้วเส้นยืนสลับสี เลียนแบบเส้นยืนย้อมแยกสีอย่างซิ่นทิว */
function drawWarpStripes(field: Grid, x0: number, width: number) {
  const sequence = [1, 5, 0, 1, 0, 5, 1, 0, 0, 2, 0, 0];
  for (let i = 0; i < width; i += 1) {
    const v = sequence[i % sequence.length];
    if (!v) continue;
    for (let y = 0; y < ROWS; y += 1) gset(field, x0 + i, y, v);
  }
}

/** แถบลาย: วางลายซ้ำลงมาตลอดความสูง สลับสีทีละดอกแบบผ้าจริง */
function drawPanel(
  field: Grid,
  x0: number,
  width: number,
  motif: MotifId,
  motifH: number,
  swapEvery: boolean
) {
  const motifW = Math.max(8, width - 4);
  let index = 0;
  for (let y = -Math.round(motifH * 0.4); y < ROWS; y += motifH) {
    const grid = MOTIFS[motif].build(motifW, Math.max(10, motifH - 4));
    if (swapEvery && index % 2 === 1) {
      for (let i = 0; i < grid.cells.length; i += 1) {
        const v = grid.cells[i];
        if (v === 1) grid.cells[i] = 2;
        else if (v === 2) grid.cells[i] = 1;
      }
    }
    stampGrid(field, grid, x0 + 2, y);
    steppedDiamond(field, x0 + width / 2, y - 2, 3, 2, 3, true);
    index += 1;
  }
}

/**
 * รอยฟุ้งของการมัดย้อม: ขอบลายด้านบน-ล่างแตกเป็นเส้นยืนสั้น ๆ
 * เป็นลักษณะเฉพาะที่ทำให้ดูเป็นผ้ามัดหมี่ ไม่ใช่ภาพกราฟิกคมกริบ
 */
function feather(field: Grid, amount: number) {
  const source = new Uint8Array(field.cells);
  const at = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < field.w && y < field.h ? source[y * field.w + x] : 0;

  for (let x = 0; x < field.w; x += 1) {
    for (let y = 0; y < field.h; y += 1) {
      const v = at(x, y);
      if (GROUND_VALUES.has(v)) continue;
      for (const dy of [-1, 1]) {
        const neighbour = at(x, y + dy);
        if (GROUND_VALUES.has(neighbour) && Math.random() < amount) {
          gset(field, x, y + dy, v);
          if (Math.random() < amount * 0.4) gset(field, x, y + dy * 2, v);
        }
      }
    }
  }
}

/** วาดตารางลงเป็นผืนผ้า พร้อมเนื้อเส้นไหม */
function render(field: Grid, palette: string[]) {
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas not supported");

  for (let y = 0; y < field.h; y += 1) {
    for (let x = 0; x < field.w; x += 1) {
      ctx.fillStyle = palette[gget(field, x, y)] ?? palette[0];
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }

  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#17100a";
  for (let x = 0; x < canvas.width; x += CELL) ctx.fillRect(x, 0, 1, canvas.height);
  ctx.globalAlpha = 0.12;
  for (let y = 0; y < canvas.height; y += CELL) ctx.fillRect(0, y, canvas.width, 1);

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  return canvas;
}

export type ComposeResult = { dataUrl: string; recipe: string };

export type ComposeOptions = {
  centerWidth?: number;
  sideWidth?: number;
  stripeWidth?: number;
  motifHeight?: number;
  feather?: number;
  border?: boolean;
};

export function composeMudmee(selected: Pattern[], options: ComposeOptions = {}): ComposeResult {
  const specs = selected.map((pattern) => patternMotifs[pattern.id]).filter(Boolean);
  const palette = buildPalette(selected);

  const main: MotifId = specs[0]?.main ?? "kaew";
  const others = Array.from(
    new Set([...specs.slice(1).map((spec) => spec.main), ...specs.map((spec) => spec.filler)])
  ).filter((motif) => motif !== main);

  const side: MotifId = others[0] ?? specs[0]?.filler ?? "kho";
  const outer: MotifId = others[1] ?? side;
  const stripeMotif: MotifId = specs[0]?.band ?? "khit";

  const field = createGrid(COLS, ROWS);

  // แบ่งความกว้างเป็นริ้วตั้ง สมมาตรรอบแกนกลาง
  const centerW = options.centerWidth ?? randInt(74, 92);
  const stripeW = options.stripeWidth ?? randInt(8, 12);
  const sideW = options.sideWidth ?? randInt(38, 48);
  const centerX0 = Math.round((COLS - centerW) / 2);
  const outerW = Math.max(12, centerX0 - stripeW * 2 - sideW);

  for (let y = 0; y < ROWS; y += 1)
    for (let x = centerX0; x < centerX0 + centerW; x += 1) gset(field, x, y, 4);

  const motifH = options.motifHeight ?? randInt(70, 88);

  drawPanel(field, centerX0, centerW, main, motifH, true);

  for (const dir of [-1, 1]) {
    const sideX0 = dir === -1 ? centerX0 - stripeW - sideW : centerX0 + centerW + stripeW;
    const stripeIn = dir === -1 ? centerX0 - stripeW : centerX0 + centerW;
    const stripeOut = dir === -1 ? sideX0 - stripeW : sideX0 + sideW;
    const outerX0 = dir === -1 ? stripeOut - outerW : stripeOut + stripeW;

    drawStripe(field, stripeIn, stripeW, stripeMotif);
    drawPanel(field, sideX0, sideW, side, Math.round(motifH * 0.64), true);
    drawStripe(field, stripeOut, stripeW, stripeMotif);
    drawWarpStripes(field, outerX0, outerW);
  }

  // เชิงผ้าด้านล่าง
  if (options.border ?? true) {
    const borderH = randInt(26, 34);
    const top = ROWS - borderH;
    for (let y = top; y < ROWS; y += 1) for (let x = 0; x < COLS; x += 1) gset(field, x, y, 4);
    stampGrid(field, buildBorder(COLS, borderH), 0, top);
  }

  feather(field, options.feather ?? rand(0.16, 0.28));

  const names = Array.from(new Set([main, side, outer])).map((motif) => MOTIFS[motif].name);

  return {
    dataUrl: render(field, palette).toDataURL("image/jpeg", 0.93),
    recipe: `แถบกลางลาย${names[0]}จาก${selected[0].name}${
      names.length > 1 ? ` · แถบข้าง${names.slice(1).join(" · ")}` : ""
    } · ริ้วคั่น${MOTIFS[stripeMotif].name}`,
  };
}

// TEMP-LAB: ใช้เทียบลายระหว่างพัฒนา จะลบออกก่อนส่งงาน
if (typeof window !== "undefined") {
  const w = window as unknown as Record<string, unknown>;
  w.__composeMudmee = composeMudmee;
  // เรนเดอร์ลายเดี่ยวเป็นภาพ เพื่อดูรูปทรงตอนแก้
  w.__motifPreview = (id: MotifId, mw: number, mh: number, scale = 6) => {
    const grid = MOTIFS[id].build(mw, mh);
    const canvas = document.createElement("canvas");
    canvas.width = grid.w * scale;
    canvas.height = grid.h * scale;
    const ctx = canvas.getContext("2d")!;
    const colors = ["#15213f", "#ffffff", "#7fa8d8", "#ffcc66"];
    for (let y = 0; y < grid.h; y += 1)
      for (let x = 0; x < grid.w; x += 1) {
        ctx.fillStyle = colors[gget(grid, x, y)] ?? colors[0];
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    return canvas.toDataURL();
  };
  w.__motifIds = Object.keys(MOTIFS);
}
