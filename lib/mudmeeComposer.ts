import { MOTIFS, gget, type MotifId } from "@/lib/mudmeeMotifs";
import {
  designToGrid,
  normaliseDesign,
  renderChart,
  type Band,
  type ChartDesign,
} from "@/lib/mudmeeChart";
import { patternMotifs, type Pattern } from "@/lib/silk-patterns";

/**
 * ประกอบผังทอผ้ามัดหมี่จากลายของผ้าที่เลือก
 *
 * ผังที่ได้จะถูกเรนเดอร์ด้วย renderChart ตัวเดียวกับผังที่ Gemini ออกแบบ
 * กริดของทุกภาพจึงเป็นระบบเดียวกัน ช่องเท่ากันทั้งผืน
 */

const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
};

/** ปรับความสว่างของสี */
function shade(hex: string, factor: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(factor > 1 ? v + (255 - v) * (factor - 1) : v * factor)))
  );
  return `#${ch.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/**
 * จานสี 6 ช่อง
 * 0 พื้นหลัก · 1 สีลาย · 2 สีรอง · 3 ไฮไลต์ · 4 พื้นแถบกลาง · 5 สีอุ่นของริ้ว
 */
export function buildPalette(selected: Pattern[]) {
  const sortByLum = (list: string[]) =>
    Array.from(new Set(list)).sort((a, b) => luminance(a) - luminance(b));

  const all = sortByLum(selected.flatMap((pattern) => pattern.colors));

  let ground = all[0];
  let bright = all[all.length - 1];
  const mid = all[Math.floor(all.length * 0.55)] ?? bright;
  const deep = all[Math.floor(all.length * 0.3)] ?? mid;
  const highlight = luminance(deep) > luminance(ground) + 45 ? deep : bright;

  // ผ้าบางผืนสีใกล้กันหมด ถ้าปล่อยไว้ลายจะจมไปกับพื้น จึงถ่างคอนทราสต์ให้พอ
  if (luminance(bright) - luminance(ground) < 95) {
    ground = shade(ground, 0.42);
    bright = shade(bright, 1.45);
  }

  // พื้นแถบกลาง: เลือก "สีจริง" ที่ต่างจากพื้นหลักมากที่สุด
  // (เลี่ยงการเร่งความสว่างเอง เพราะทำให้สีซีดจนกลายเป็นเทา)
  const rgb = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const distance = (a: string, b: string) => {
    const [r1, g1, b1] = rgb(a);
    const [r2, g2, b2] = rgb(b);
    return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
  };
  const panelPool = Array.from(
    new Set([...(selected[1] ?? selected[0]).colors, ...all])
  ).filter((hex) => luminance(bright) - luminance(hex) > 55);
  let panel = panelPool.length
    ? panelPool.reduce((best, hex) => (distance(hex, ground) > distance(best, ground) ? hex : best))
    : shade(ground, 1.5);
  // ถ้ายังใกล้พื้นหลักเกินไป ค่อยขยับความสว่างเล็กน้อย
  if (distance(panel, ground) < 55) panel = shade(panel, luminance(ground) < 90 ? 1.45 : 0.68);

  const warmest = all.reduce((best, hex) => {
    const n = parseInt(hex.slice(1), 16);
    const score = ((n >> 16) & 255) - (((n >> 8) & 255) + (n & 255)) / 2;
    const bn = parseInt(best.slice(1), 16);
    return score > ((bn >> 16) & 255) - ((((bn >> 8) & 255) + (bn & 255)) / 2) ? hex : best;
  }, all[0]);

  return [ground, bright, mid, highlight, panel, shade(warmest, 1.25)];
}

/** แปลงลายจากคลังเป็นผังอักขระครึ่งซ้าย เพื่อให้ใช้ร่วมกับผังของ Gemini ได้ */
function motifToRows(motif: MotifId, halfWidth: number, height: number): string[] {
  const grid = MOTIFS[motif].build(halfWidth * 2, height);
  const rows: string[] = [];
  for (let y = 0; y < height; y += 1) {
    let row = "";
    for (let x = 0; x < halfWidth; x += 1) {
      const v = gget(grid, x, y);
      row += v >= 1 && v <= 3 ? String(v) : ".";
    }
    rows.push(row);
  }
  return rows;
}

/** ตัดแถวว่างหัวท้ายออก ดอกลายจะได้เรียงชิดกันตอนซ้ำ */
function trimRows(rows: string[]): string[] {
  let top = 0;
  let bottom = rows.length - 1;
  const blank = (row: string) => !/[123]/.test(row);
  while (top < bottom && blank(rows[top])) top += 1;
  while (bottom > top && blank(rows[bottom])) bottom -= 1;
  return rows.slice(top, bottom + 1);
}

/**
 * แทรกลายเล็กลงในช่องว่างของผัง
 *
 * ลายหลักเกาะแกนกลาง ทำให้เหลือช่องว่างข้าง ๆ โดยเฉพาะมุมบนของลายทรงพุ่ม
 * ผ้าจริงจะมีลายประกอบเติมตรงนั้นเสมอ จึงไล่หาช่องที่ว่างจริงแล้ววางลงไป
 */
function fillGaps(rows: string[], filler: string[]): string[] {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const fh = filler.length;
  const fw = filler[0]?.length ?? 0;
  if (!width || !fh || !fw || fh + 2 > height) return rows;

  const out = rows.map((row) => [...row]);
  const free = (top: number, left: number) => {
    for (let r = -1; r <= fh; r += 1) {
      const row = out[top + r];
      if (!row) continue;
      for (let c = -1; c <= fw; c += 1) {
        const ch = row[left + c];
        if (ch && ch !== ".") return false;
      }
    }
    return true;
  };

  for (let top = 1; top + fh < height; top += fh + 2) {
    for (let left = 1; left + fw < width; left += fw + 2) {
      if (!free(top, left)) continue;
      for (let r = 0; r < fh; r += 1)
        for (let c = 0; c < fw; c += 1) {
          const ch = filler[r][c];
          if (ch !== ".") out[top + r][left + c] = ch;
        }
    }
  }
  return out.map((row) => row.join(""));
}

/**
 * สร้างผังจากลายของผ้าที่เลือก โดยสุ่มโครงใหม่ทุกครั้ง
 * จำนวนแถบ ความกว้าง ระยะดอก และการมีเชิงผ้า ไม่ตายตัว
 */
export function buildLocalDesign(selected: Pattern[]): ChartDesign {
  const specs = selected.map((pattern) => patternMotifs[pattern.id]).filter(Boolean);
  const main: MotifId = specs[0]?.main ?? "kaew";
  const pool = Array.from(
    new Set([...specs.slice(1).map((s) => s.main), ...specs.map((s) => s.filler)])
  ).filter((m) => m !== main);
  const side: MotifId = pool[0] ?? specs[0]?.filler ?? "kho";
  const accent: MotifId = pool[1] ?? side;
  const bandMotif: MotifId = specs[0]?.band ?? "khit";

  const size = pick([128, 160, 160]);
  const half = size / 2;

  const motifs: Record<string, string[]> = {};
  const bands: Band[] = [];
  let used = 0;

  const addWarp = (width: number) => {
    bands.push({
      kind: "warp",
      width,
      sequence: pick([
        [1, 5, 0, 0],
        [1, 0, 5, 0, 1, 0, 0],
        [5, 1, 0, 2, 0],
        [1, 0, 0, 2, 0, 0],
      ]),
    });
    used += width;
  };

  /**
   * แถบลาย: ความสูงของดอกผูกกับความกว้างแถบ ลายจึงไม่ถูกยืดจนแบนหรือผอม
   * และ step ตั้งให้ดอกเกือบชนกัน ผืนผ้าจะได้แน่นแบบผ้าจริง
   */
  const addMotif = (
    key: string,
    motif: MotifId,
    width: number,
    ground: number,
    ratio: number,
    filler?: MotifId
  ) => {
    const height = Math.max(8, Math.round(width * ratio));
    let rows = trimRows(motifToRows(motif, width, height));
    if (filler) {
      const size = Math.max(4, Math.round(width * 0.3));
      rows = fillGaps(rows, trimRows(motifToRows(filler, size, Math.round(size * 1.3))));
    }
    motifs[key] = rows;
    bands.push({
      kind: "motif",
      width,
      ground,
      motif: key,
      step: rows.length + randInt(1, 3),
      alternate: Math.random() < 0.75,
    });
    used += width;
  };

  // ริมผ้า
  addWarp(randInt(3, 6));

  // แถบรองหลายชั้น ไล่กว้างขึ้นเข้าหากลาง ผืนผ้าจะได้มีจังหวะ
  const centreW = randInt(Math.round(half * 0.42), Math.round(half * 0.56));
  const layers = randInt(2, 3);
  for (let i = 0; i < layers; i += 1) {
    const remaining = half - used - centreW;
    if (remaining < 10) break;
    const width = Math.min(remaining - 4, randInt(8, 16));
    if (width < 6) break;
    addMotif(`side${i}`, i % 2 === 0 ? side : accent, width, 0, randInt(12, 16) / 10, bandMotif);
    if (half - used - centreW > 6) addWarp(randInt(2, 5));
  }

  // แถบคั่นลายเล็กติดแถบกลาง
  if (half - used - centreW >= 6) {
    addMotif("band", bandMotif, half - used - centreW, 0, randInt(9, 12) / 10);
  }

  // แถบกลาง กินที่เหลือทั้งหมด
  addMotif("centre", main, Math.max(14, half - used), 4, randInt(11, 14) / 10, accent);

  const design: ChartDesign = {
    title: `ลาย${MOTIFS[main].name}ผสม${MOTIFS[side].name}`,
    size,
    bands,
    motifs,
  };

  if (Math.random() < 0.65) {
    const width = randInt(6, 10);
    const height = randInt(10, Math.round(size / 8));
    motifs.border = motifToRows(pick([bandMotif, accent]), width, height);
    design.border = { height, motif: "border", ground: 4 };
  }

  return normaliseDesign(design) ?? design;
}

/** ลายที่ Gemini วาดมา — ถูกตรวจขนาดมาแล้วฝั่ง API */
export type Drawing = { title: string; motifs: Record<string, string[]> };

/**
 * จัดวางลายที่ Gemini วาดมาลงบนโครงผ้า
 * โครงยังสุ่มทุกครั้ง ส่วนตัวลายมาจากโมเดล ผลจึงไม่ซ้ำทั้งลายและโครง
 */
export function buildDesignFromDrawing(selected: Pattern[], drawing: Drawing): ChartDesign {
  const base = buildLocalDesign(selected);
  const size = base.size;
  const half = size / 2;

  const motifs: Record<string, string[]> = {};
  const bands: Band[] = [];
  let used = 0;

  const fit = (rows: string[], width: number) =>
    rows.map((row) =>
      row.length >= width ? row.slice(0, width) : row + ".".repeat(width - row.length)
    );

  const addWarp = (width: number) => {
    const sequences = [
      [1, 5, 0, 0],
      [1, 0, 5, 0, 1, 0, 0],
      [5, 1, 0, 2, 0],
      [1, 0, 0, 2, 0, 0],
    ];
    bands.push({ kind: "warp", width, sequence: pick(sequences) });
    used += width;
  };

  addWarp(randInt(4, 9));

  const sideRows = drawing.motifs.side;
  if (sideRows) {
    const width = Math.min(sideRows[0].length, randInt(12, 18));
    motifs.side = fit(sideRows, width);
    bands.push({
      kind: "motif",
      width,
      ground: 0,
      motif: "side",
      step: sideRows.length + randInt(4, 10),
      alternate: Math.random() < 0.7,
    });
    used += width;
    addWarp(randInt(3, 6));
  }

  const bandRows = drawing.motifs.band;
  if (bandRows && used < half - 16) {
    const width = Math.min(bandRows[0].length, randInt(6, 9));
    motifs.band = fit(bandRows, width);
    bands.push({
      kind: "motif",
      width,
      ground: 0,
      motif: "band",
      step: bandRows.length + randInt(2, 5),
      alternate: true,
    });
    used += width;
  }

  const centreW = Math.max(14, half - used);
  motifs.centre = fit(drawing.motifs.centre, centreW);
  bands.push({
    kind: "motif",
    width: centreW,
    ground: 4,
    motif: "centre",
    step: drawing.motifs.centre.length + randInt(6, 14),
    alternate: Math.random() < 0.5,
  });

  const design: ChartDesign = {
    title: drawing.title || base.title,
    size,
    bands,
    motifs,
  };

  if (motifs.band && Math.random() < 0.6) {
    const height = motifs.band.length + randInt(2, 6);
    design.border = { height, motif: "band", ground: 4 };
  }

  return normaliseDesign(design) ?? base;
}

export type ComposeResult = { dataUrl: string; recipe: string };

/** เรนเดอร์ผัง (จาก Gemini หรือจากเครื่อง) เป็นภาพผ้า */
export function renderDesign(design: ChartDesign, palette: string[]): string {
  const grid = designToGrid(design);
  return renderChart(grid, design.size, palette).toDataURL("image/png");
}

export function composeMudmee(selected: Pattern[], drawing?: Drawing): ComposeResult {
  const palette = buildPalette(selected);
  const design = drawing?.motifs?.centre
    ? buildDesignFromDrawing(selected, drawing)
    : buildLocalDesign(selected);

  const motifBands = design.bands.filter((band) => band.kind === "motif");
  return {
    dataUrl: renderDesign(design, palette),
    recipe: `${design.title} · ผังทอ ${design.size}×${design.size} ช่อง · ${motifBands.length} แถบลาย${
      design.border ? " · มีเชิงผ้า" : ""
    }`,
  };
}
