/**
 * คลังลวดลายมัดหมี่ — เขียนบน "กระดาษกราฟ" แบบเดียวกับที่ช่างทอใช้
 *
 * ทุกลายสร้างเป็นตารางจุด (Grid) ค่าของแต่ละช่องคือหมายเลขสี
 *   0 = พื้นหลัก   1 = สีลายหลัก   2 = สีรอง   3 = สีไฮไลต์
 *   4 = พื้นแถบกลาง   5 = สีอุ่นสำหรับริ้วเส้นเล็ก
 *
 * ลายกนกอีสานประกอบจากสามอย่าง: หนามเปลว ขดม้วน และหยดน้ำ
 * จึงทำเป็นเครื่องมือพื้นฐานไว้ แล้วนำมาประกอบเป็นลายแต่ละชนิด
 */

export type Grid = { w: number; h: number; cells: Uint8Array };

export const GROUND_VALUES = new Set([0, 4]);

export const createGrid = (w: number, h: number, fill = 0): Grid => ({
  w,
  h,
  cells: new Uint8Array(w * h).fill(fill),
});

export const gset = (g: Grid, x: number, y: number, v: number) => {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi >= 0 && yi >= 0 && xi < g.w && yi < g.h) g.cells[yi * g.w + xi] = v;
};

export const gget = (g: Grid, x: number, y: number) =>
  x >= 0 && y >= 0 && x < g.w && y < g.h ? g.cells[y * g.w + x] : 0;

/** วางตารางลายย่อยลงบนตารางใหญ่ โดยช่องค่า 0 ถือว่าโปร่ง */
export const stampGrid = (dst: Grid, src: Grid, left: number, top: number) => {
  for (let y = 0; y < src.h; y += 1) {
    for (let x = 0; x < src.w; x += 1) {
      const v = src.cells[y * src.w + x];
      if (v) gset(dst, left + x, top + y, v);
    }
  }
};

/** สะท้อนครึ่งซ้ายไปเป็นครึ่งขวา — ลายกนกสมมาตรซ้ายขวาเสมอ */
export const mirrorHalf = (half: Grid, gap = 0): Grid => {
  const w = half.w * 2 + gap;
  const out = createGrid(w, half.h);
  for (let y = 0; y < half.h; y += 1) {
    for (let x = 0; x < half.w; x += 1) {
      const v = half.cells[y * half.w + x];
      if (!v) continue;
      gset(out, half.w - 1 - x, y, v);
      gset(out, half.w + gap + x, y, v);
    }
  }
  return out;
};

/* ---------- เครื่องมือวาดบนตาราง ---------- */

/** เส้นหนาระหว่างสองจุด */
export function thickLine(
  g: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  v: number,
  t = 1
) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = y0 + ((y1 - y0) * i) / steps;
    const half = (t - 1) / 2;
    for (let dx = -half; dx <= half; dx += 1)
      for (let dy = -half; dy <= half; dy += 1) gset(g, x + dx, y + dy, v);
  }
}

/** ข้าวหลามตัด ขอบเป็นขั้นบันไดตามแนวเส้นไหม */
export function steppedDiamond(
  g: Grid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  v: number,
  filled = false,
  thickness = 1
) {
  for (let dy = -ry; dy <= ry; dy += 1) {
    const half = Math.round(rx * (1 - Math.abs(dy) / ry));
    const y = cy + dy;
    if (filled) {
      for (let x = cx - half; x <= cx + half; x += 1) gset(g, x, y, v);
    } else {
      for (let t = 0; t < thickness; t += 1) {
        gset(g, cx - half + t, y, v);
        gset(g, cx + half - t, y, v);
      }
      if (Math.abs(dy) === ry) for (let x = cx - half; x <= cx + half; x += 1) gset(g, x, y, v);
    }
  }
}

/** หนามเปลว — สามเหลี่ยมเรียวพุ่งออกจากจุดตั้งต้นตามมุมที่กำหนด */
export function spike(
  g: Grid,
  cx: number,
  cy: number,
  angleDeg: number,
  length: number,
  halfBase: number,
  v: number
) {
  const a = (angleDeg * Math.PI) / 180;
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  for (let i = 0; i <= length; i += 1) {
    const t = i / length;
    const half = halfBase * (1 - t);
    const px = cx + Math.cos(a) * i;
    const py = cy + Math.sin(a) * i;
    for (let k = -half; k <= half; k += 1) gset(g, px + nx * k, py + ny * k, v);
  }
}

/** ขดกนก — เส้นม้วนเข้าหาศูนย์กลาง */
export function curl(
  g: Grid,
  cx: number,
  cy: number,
  startDeg: number,
  sweepDeg: number,
  r0: number,
  r1: number,
  v: number,
  t = 2
) {
  const steps = Math.max(12, Math.round(Math.abs(sweepDeg) / 3));
  let px = 0;
  let py = 0;
  for (let i = 0; i <= steps; i += 1) {
    const f = i / steps;
    const a = ((startDeg + sweepDeg * f) * Math.PI) / 180;
    const r = r0 + (r1 - r0) * f;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i) thickLine(g, px, py, x, y, v, t);
    px = x;
    py = y;
  }
}

/** ช่อเปลว — หนามหลายอันเรียงเป็นพัด */
export function fan(
  g: Grid,
  cx: number,
  cy: number,
  count: number,
  fromDeg: number,
  toDeg: number,
  length: number,
  v: number,
  taper = 0.45
) {
  for (let i = 0; i < count; i += 1) {
    const f = count === 1 ? 0.5 : i / (count - 1);
    const angle = fromDeg + (toDeg - fromDeg) * f;
    // หนามกลางยาวสุด ไล่สั้นลงไปทางริม
    const len = length * (0.55 + 0.45 * Math.sin(Math.PI * f));
    spike(g, cx, cy, angle, Math.round(len), Math.max(1, len * taper * 0.18), v);
  }
}

/** หยดน้ำ / ดอกตูม — ทรงรีปลายแหลมด้านบน */
export function teardrop(
  g: Grid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  v: number,
  filled = false
) {
  for (let dy = -ry; dy <= ry; dy += 1) {
    const t = (dy + ry) / (2 * ry);
    // บนแหลม ล่างป้าน
    const shape = Math.sin(Math.PI * Math.pow(t, 0.72));
    const half = Math.round(rx * shape);
    const y = cy + dy;
    if (filled) {
      for (let x = cx - half; x <= cx + half; x += 1) gset(g, x, y, v);
    } else {
      gset(g, cx - half, y, v);
      gset(g, cx + half, y, v);
    }
  }
}

/** ดอกจันกลางลาย */
export function rosette(g: Grid, cx: number, cy: number, r: number, v1: number, v2: number) {
  steppedDiamond(g, cx, cy, r, r, v1, false, 1);
  for (let k = -r + 1; k <= r - 1; k += 1) {
    gset(g, cx + k, cy, v2);
    gset(g, cx, cy + k, v2);
  }
  steppedDiamond(g, cx, cy, Math.max(1, Math.round(r * 0.3)), Math.max(1, Math.round(r * 0.3)), v1, true);
}

/* ---------- ลวดลาย ---------- */

export type MotifId =
  | "naga"
  | "makbeng"
  | "kho"
  | "phum"
  | "dokKhun"
  | "dokFai"
  | "kaew"
  | "konHoi"
  | "kapBua"
  | "dokMak"
  | "hol"
  | "mook"
  | "lukWai"
  | "khit"
  | "wave"
  | "twill"
  | "kong";

type Build = (w: number, h: number) => Grid;

/* ลายหลัก — เขียนแยกกันทีละลาย ให้ซิลูเอตต่างกันและเต็มกรอบ */

/** พญานาค — ลำตัวหยักเต็มความกว้าง มีหงอนเปลวและหัวอยู่บนสุด */
const naga: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = (w - 1) / 2;
  const u = Math.max(2, Math.round(h / 24));
  const halfW = w / 2 - 1;

  // หงอนเปลวแผ่เต็มความกว้างด้านบน
  fan(g, cx, u * 7, 5, 242, 298, u * 5, 1);
  steppedDiamond(g, cx, u * 7, Math.round(u * 1.6), Math.round(u * 2), 1, true);
  steppedDiamond(g, cx, u * 7, Math.round(u * 0.7), Math.round(u * 0.9), 3, true);

  // ลำตัวหยักซ้อนชั้น กินเต็มความกว้าง
  const bodyTop = u * 9;
  const tiers = 3;
  const tierH = Math.max(4, Math.floor((h - bodyTop - u * 3) / tiers));
  for (let i = 0; i < tiers; i += 1) {
    const top = bodyTop + i * tierH;
    for (let dx = 0; dx <= halfW; dx += 1) {
      const y = top + Math.round((tierH * 0.95 * dx) / halfW);
      for (let t = 0; t < 3; t += 1) {
        gset(g, cx - dx, y + t, i % 2 ? 2 : 1);
        gset(g, cx + dx, y + t, i % 2 ? 2 : 1);
      }
      gset(g, cx - dx, y + 4, 3);
      gset(g, cx + dx, y + 4, 3);
    }
    steppedDiamond(g, cx, top + tierH * 0.3, Math.round(u * 1.2), Math.round(u * 1.4), 3, true);
  }

  // เกล็ดริมสองข้าง
  for (let i = 0; i < tiers; i += 1) {
    const y = bodyTop + i * tierH + tierH * 0.2;
    spike(g, cx - halfW, y, 160, u * 2, u * 0.6, 2);
    spike(g, cx + halfW, y, 20, u * 2, u * 0.6, 2);
  }
  return g;
};

/** หมากเบ็ง — พุ่มเครื่องสักการะซ้อนชั้น กว้างขึ้นเรื่อย ๆ จนเต็มฐาน */
const makbeng: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = (w - 1) / 2;
  const u = Math.max(2, Math.round(h / 24));

  // ยอดเปลว
  spike(g, cx, u * 4, 270, u * 3.4, u * 1.1, 1);
  steppedDiamond(g, cx, u * 4.4, Math.round(u), Math.round(u * 1.3), 3, true);

  const tiers = 5;
  const top0 = u * 5;
  const tierH = Math.max(3, Math.floor((h - top0 - u * 3) / tiers));
  for (let i = 0; i < tiers; i += 1) {
    const top = top0 + i * tierH;
    const half = Math.round(((i + 1.3) / (tiers + 0.3)) * (w / 2 - 1));
    for (let dy = 0; dy < tierH; dy += 1) {
      const hw = Math.round((half * dy) / Math.max(1, tierH - 1));
      for (let x = cx - hw; x <= cx + hw; x += 1) gset(g, x, top + dy, i % 2 ? 2 : 1);
    }
    // ขอบล่างและปลายชั้นงอนขึ้นแบบใบตอง
    for (let x = cx - half; x <= cx + half; x += 1) gset(g, x, top + tierH - 1, 3);
    spike(g, cx - half, top + tierH - 1, 200, u * 1.8, u * 0.5, 1);
    spike(g, cx + half, top + tierH - 1, 340, u * 1.8, u * 0.5, 1);
  }

  // ฐาน
  const baseTop = top0 + tiers * tierH;
  for (let y = baseTop; y < Math.min(h, baseTop + u * 2); y += 1)
    for (let x = cx - u * 2; x <= cx + u * 2; x += 1) gset(g, x, y, 1);
  return g;
};

/** พุ่มบายศรี — ข้าวหลามตัดเรียงเป็นพีระมิดเต็มกรอบ */
const phum: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = (w - 1) / 2;
  const rows = 4;
  const rowH = Math.floor((h - 4) / (rows + 0.6));
  const r = Math.max(3, Math.floor(Math.min(rowH * 0.46, w / (rows * 2 + 0.5))));

  for (let row = 0; row < rows; row += 1) {
    const cy = 2 + rowH * 0.6 + row * rowH;
    const count = row + 1;
    for (let i = 0; i < count; i += 1) {
      const x = cx + (i - (count - 1) / 2) * (r * 2 + 2);
      steppedDiamond(g, x, cy, r, r, i % 2 ? 2 : 1, true);
      steppedDiamond(g, x, cy, Math.max(1, Math.round(r * 0.4)), Math.max(1, Math.round(r * 0.4)), 3, true);
    }
  }
  fan(g, cx, 2 + rowH * 0.3, 3, 248, 292, rowH * 0.9, 1);
  for (let y = 2 + rowH * 0.6 + rows * rowH; y < h - 1; y += 1) gset(g, cx, y, 1);
  return g;
};

/** ดอกคูน — ช่อดอกห้อยลงสามสาย */
const dokKhun: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = Math.round((w - 1) / 2);
  const u = Math.max(2, Math.round(h / 22));
  const stems = [-1, 0, 1];

  for (const dir of stems) {
    const sx = Math.round(cx + dir * w * 0.3);
    const startY = dir === 0 ? u * 2 : u * 5;
    for (let y = startY; y < h - u; y += 1) gset(g, sx, y, 2);
    let i = 0;
    for (let y = startY + u * 2; y < h - u * 2; y += u * 3) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = sx + side * Math.round(u * 1.6);
      teardrop(g, x, y, Math.round(u * 1.1), Math.round(u * 1.5), 1, true);
      steppedDiamond(g, x, y, 1, 1, 3, true);
      thickLine(g, sx, y - u, x, y - Math.round(u * 1.2), 2, 1);
      i += 1;
    }
    fan(g, sx, startY + u, 3, 250, 290, u * 2.2, 1);
  }
  return g;
};

/** ดอกฝ้าย — ดอกแปดกลีบเต็มกรอบ */
const dokFai: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rx = w / 2 - 1;
  const ry = h / 2 - 1;

  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    const px = cx + Math.cos(a) * rx * 0.58;
    const py = cy + Math.sin(a) * ry * 0.58;
    steppedDiamond(
      g,
      px,
      py,
      Math.max(2, Math.round(rx * 0.26)),
      Math.max(2, Math.round(ry * 0.22)),
      i % 2 ? 2 : 1,
      true
    );
    steppedDiamond(g, px, py, Math.max(1, Math.round(rx * 0.1)), Math.max(1, Math.round(ry * 0.09)), 3, true);
  }
  rosette(g, cx, cy, Math.max(3, Math.round(Math.min(rx, ry) * 0.32)), 1, 3);
  steppedDiamond(g, cx, cy, Math.round(rx), Math.round(ry), 2, false, 1);
  return g;
};

/** ก้นหอย — ขดก้นหอยคู่ซ้อนกันเต็มกรอบ */
const konHoi: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = (w - 1) / 2;
  const r = Math.min(w, h / 2) / 2 - 2;

  for (const [cy, dirDeg, color] of [
    [h * 0.27, 0, 1],
    [h * 0.73, 180, 2],
  ] as const) {
    curl(g, cx, cy, dirDeg, 560, r * 0.18, r, color, 2);
    curl(g, cx, cy, dirDeg + 180, 520, r * 0.14, r * 0.74, 3, 1);
  }
  thickLine(g, cx, h * 0.27, cx, h * 0.73, 1, 2);
  return g;
};

/** ลายโฮล — ลูกศรซ้อนชั้นเต็มความกว้าง */
const hol: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = (w - 1) / 2;
  const halfW = w / 2 - 1;
  const rows = 5;
  const rowH = Math.max(4, Math.floor(h / rows));

  for (let i = 0; i < rows; i += 1) {
    const top = i * rowH;
    for (let dx = 0; dx <= halfW; dx += 1) {
      const y = top + Math.round((rowH * 0.72 * dx) / halfW);
      for (let t = 0; t < 3; t += 1) {
        gset(g, cx - dx, y + t, i % 2 ? 1 : 2);
        gset(g, cx + dx, y + t, i % 2 ? 1 : 2);
      }
      gset(g, cx - dx, y + 4, 3);
      gset(g, cx + dx, y + 4, 3);
    }
    steppedDiamond(g, cx, top + rowH * 0.35, 2, 2, 3, true);
  }
  return g;
};

/** ลายขอ — ตะขอตัว S ปลายม้วนทั้งสองข้าง */
const kho: Build = (w, h) => {
  const g = createGrid(w, h);
  const unit = Math.max(2, Math.round(Math.min(w, h) / 12));
  const cx = (w - 1) / 2;
  const t = Math.max(2, Math.round(unit * 0.9));

  thickLine(g, cx + unit * 1.4, h * 0.22, cx - unit * 1.4, h * 0.5, 1, t);
  thickLine(g, cx - unit * 1.4, h * 0.5, cx + unit * 1.4, h * 0.78, 1, t);
  curl(g, cx + unit * 1.2, h * 0.22, 90, 300, unit * 0.6, unit * 2.2, 1, t);
  curl(g, cx - unit * 1.2, h * 0.78, -90, 300, unit * 0.6, unit * 2.2, 1, t);
  steppedDiamond(g, cx, h / 2, unit, unit, 3, true);
  return g;
};

/** กาบบัว — หยดน้ำซ้อนชั้น มีหนามแซมรอบ */
const kapBua: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rx = w / 2 - 2;
  const ry = h / 2 - 2;

  teardrop(g, cx, cy, Math.round(rx), Math.round(ry), 1);
  teardrop(g, cx, cy + 1, Math.round(rx * 0.62), Math.round(ry * 0.72), 2);
  rosette(g, cx, cy + Math.round(ry * 0.2), Math.max(2, Math.round(rx * 0.26)), 3, 1);
  fan(g, cx, cy - ry * 0.58, 3, 248, 292, ry * 0.3, 1);
  // ขอเล็กประกบสองข้างกลีบ
  curl(g, cx - rx * 0.62, cy + ry * 0.18, 90, 260, rx * 0.1, rx * 0.3, 2, 2);
  curl(g, cx + rx * 0.62, cy + ry * 0.18, 90, -260, rx * 0.1, rx * 0.3, 2, 2);
  return g;
};

/** ลูกแก้ว — ข้าวหลามตัดซ้อนชั้น มีหนามที่มุม */
const kaew: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rx = w / 2 - 1;
  const ry = h / 2 - 1;

  steppedDiamond(g, cx, cy, Math.round(rx), Math.round(ry), 1, false, 1);
  steppedDiamond(g, cx, cy, Math.round(rx * 0.72), Math.round(ry * 0.72), 2, false, 1);
  steppedDiamond(g, cx, cy, Math.round(rx * 0.42), Math.round(ry * 0.42), 1, false, 1);
  rosette(g, cx, cy, Math.max(2, Math.round(rx * 0.24)), 3, 1);
  for (const [ax, ay] of [[270, -1], [90, 1]] as const) {
    fan(g, cx, cy + ay * ry * 0.92, 3, ax - 26, ax + 26, ry * 0.3, 2);
  }
  return g;
};

/** สร้อยดอกหมาก — หยดน้ำเรียงสองข้างก้าน */
const dokMak: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = Math.round((w - 1) / 2);
  const count = Math.max(3, Math.round(h / 16));
  const step = h / count;
  thickLine(g, cx, 0, cx, h - 1, 2, 1);
  for (let i = 0; i < count; i += 1) {
    const cy = step / 2 + i * step;
    for (const dir of [-1, 1]) {
      const x = cx + dir * w * 0.26;
      teardrop(g, x, cy, Math.round(w * 0.14), Math.round(step * 0.34), 1, true);
      steppedDiamond(g, x, cy, Math.max(1, Math.round(w * 0.05)), Math.max(1, Math.round(step * 0.12)), 3, true);
      thickLine(g, cx, cy, x, cy, 2, 1);
    }
    steppedDiamond(g, cx, cy + step / 2, 2, 2, 3, true);
  }
  return g;
};

/** ลายมุก — กากบาทมีหนามสี่ทิศ */
const mook: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const r = Math.min(w, h) / 2 - 1;
  for (const a of [45, 135, 225, 315]) spike(g, cx, cy, a, r * 1.1, Math.max(1, r * 0.22), 1);
  rosette(g, cx, cy, Math.max(2, Math.round(r * 0.42)), 2, 3);
  return g;
};

/** ลูกหวาย — ตารางสานไขว้ */
const lukWai: Build = (w, h) => {
  const g = createGrid(w, h);
  const gap = Math.max(5, Math.round(Math.min(w, h) / 3.5));
  for (let o = -h; o < w + h; o += gap) {
    thickLine(g, o, 0, o + h, h - 1, 1, 2);
    thickLine(g, o + gap / 2, h - 1, o + gap / 2 + h, 0, 2, 2);
  }
  rosette(g, (w - 1) / 2, (h - 1) / 2, Math.max(2, Math.round(w * 0.16)), 3, 1);
  return g;
};

/* ลายคั่น / ริ้วแคบ */

const khit: Build = (w, h) => {
  const g = createGrid(w, h);
  const r = Math.max(2, Math.floor(h / 2) - 1);
  const step = r * 2 + 2;
  for (let x = 0; x < w + step; x += step) {
    steppedDiamond(g, x, h / 2, r, r, 1, false, 1);
    steppedDiamond(g, x + step / 2, h / 2, Math.max(1, Math.round(r * 0.45)), Math.max(1, Math.round(r * 0.45)), 3, true);
  }
  return g;
};

const wave: Build = (w, h) => {
  const g = createGrid(w, h);
  const period = Math.max(6, h * 2);
  for (let x = 0; x < w; x += 1) {
    const phase = x % period;
    const step = phase < period / 2 ? phase : period - phase;
    const y = Math.round(((h - 3) * step * 2) / period);
    gset(g, x, y, 1);
    gset(g, x, y + 1, 1);
    gset(g, x, y + 2, 2);
  }
  return g;
};

const twill: Build = (w, h) => {
  const g = createGrid(w, h);
  for (let x = -h; x < w + h; x += 3) {
    for (let k = 0; k < h; k += 1) {
      gset(g, x + k, k, 1);
      gset(g, x + k + 1, k, 2);
    }
  }
  return g;
};

const kong: Build = (w, h) => {
  const g = createGrid(w, h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const r = Math.min(w, h) / 2 - 1;
  steppedDiamond(g, cx, cy, Math.round(r), Math.round(r), 1, false, 1);
  rosette(g, cx, cy, Math.max(2, Math.round(r * 0.5)), 2, 3);
  return g;
};

export const MOTIFS: Record<MotifId, { name: string; build: Build }> = {
  naga: { name: "พญานาค", build: naga },
  makbeng: { name: "หมากเบ็ง", build: makbeng },
  kho: { name: "ลายขอ", build: kho },
  phum: { name: "พุ่มบายศรี", build: phum },
  dokKhun: { name: "ดอกคูน", build: dokKhun },
  dokFai: { name: "ดอกฝ้าย", build: dokFai },
  kaew: { name: "ลูกแก้ว", build: kaew },
  konHoi: { name: "ก้นหอย", build: konHoi },
  kapBua: { name: "กาบบัว", build: kapBua },
  dokMak: { name: "สร้อยดอกหมาก", build: dokMak },
  hol: { name: "ลายโฮล", build: hol },
  mook: { name: "ลายมุก", build: mook },
  lukWai: { name: "ลูกหวาย", build: lukWai },
  khit: { name: "ลายขิด", build: khit },
  wave: { name: "ลายหยักสายน้ำ", build: wave },
  twill: { name: "หางกระรอก", build: twill },
  kong: { name: "ลายกง", build: kong },
};

/** ลายเชิงผ้า — ซุ้มยอดแหลมเรียงตลอดความกว้าง */
export function buildBorder(w: number, h: number): Grid {
  const g = createGrid(w, h);
  const unitW = Math.max(10, Math.round(h * 0.8));
  for (let x = 0; x < w + unitW; x += unitW) {
    const cx = x + unitW / 2;
    // ซุ้มทรงระฆัง
    for (let dy = 0; dy < h - 3; dy += 1) {
      const t = dy / (h - 4);
      const half = Math.round((unitW / 2 - 1) * Math.sin((Math.PI / 2) * Math.pow(t, 0.55)));
      gset(g, cx - half, h - 2 - dy, 1);
      gset(g, cx + half, h - 2 - dy, 1);
      if (dy < 3) for (let k = cx - half; k <= cx + half; k += 1) gset(g, k, h - 2 - dy, 1);
    }
    spike(g, cx, 3, 270, Math.round(h * 0.18), 1, 1);
    steppedDiamond(g, cx, h * 0.55, Math.max(1, Math.round(unitW * 0.12)), Math.max(1, Math.round(h * 0.14)), 3, true);
  }
  for (let x = 0; x < w; x += 1) {
    gset(g, x, 0, 1);
    gset(g, x, h - 1, 1);
  }
  return g;
}
