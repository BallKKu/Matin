/**
 * ผังทอผ้ามัดหมี่ (weaving chart)
 *
 * ทุกอย่างในผืนผ้าอยู่บน "ตารางเดียวกัน" ขนาด size x size ช่อง
 * หนึ่งช่อง = เส้นไหมหนึ่งเส้น และถูกวาดเป็นสี่เหลี่ยมขนาดเท่ากันหมด
 * ช่างทอจึงนับช่องจากภาพไปทอได้ตรง ๆ
 *
 * ผังถูกอธิบายด้วยข้อมูลล้วน ๆ จะมาจาก Gemini หรือจากตัวประกอบลายในเครื่องก็ได้
 * แล้วใช้ตัวเรนเดอร์ตัวเดียวกัน กริดจึงตรงกันเสมอ
 */

export const CHART_SIZES = [64, 96, 128, 160] as const;

/** อักขระที่ใช้เขียนผัง: . = พื้นของแถบนั้น, 1-3 = สีลาย */
const VALID_CHARS = new Set([".", "1", "2", "3"]);

export type Band =
  | {
      kind: "warp";
      width: number;
      /** ลำดับสีของเส้นยืน วนซ้ำตลอดความกว้างแถบ (0 = พื้น) */
      sequence: number[];
    }
  | {
      kind: "motif";
      width: number;
      /** ดัชนีสีพื้นของแถบนี้ */
      ground: number;
      /** ชื่อลายใน motifs */
      motif: string;
      /** ระยะห่างแนวตั้งระหว่างดอก (จำนวนช่อง) */
      step: number;
      /** สลับสี 1 กับ 2 ทุกดอกเว้นดอก */
      alternate?: boolean;
    };

export type ChartDesign = {
  title: string;
  size: number;
  /** แถบจากริมซ้ายเข้าหาแกนกลาง ตัวสุดท้ายคือแถบกลาง (จะถูกสะท้อนเป็นครึ่งขวา) */
  bands: Band[];
  /** ผังลายแต่ละชนิด เขียนเป็นแถวอักขระ (ครึ่งซ้าย ระบบจะสะท้อนให้) */
  motifs: Record<string, string[]>;
  border?: { height: number; motif: string; ground: number };
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(value)));

/** สะท้อนครึ่งซ้ายเป็นลายเต็มใบ ลายมัดหมี่สมมาตรซ้ายขวาเสมอ */
export function mirrorRows(rows: string[]): string[] {
  return rows.map((row) => row + [...row].reverse().join(""));
}

/**
 * ตรวจและซ่อมผังที่ได้มา ให้อยู่ในรูปที่เรนเดอร์ได้แน่นอน
 * ตัดอักขระแปลกปลอม เติมความกว้างให้เท่ากัน และบีบผลรวมความกว้างให้พอดีครึ่งผืน
 */
export function normaliseDesign(raw: unknown): ChartDesign | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;

  const size = CHART_SIZES.includes(input.size as (typeof CHART_SIZES)[number])
    ? (input.size as number)
    : 128;
  const halfWidth = size / 2;

  const motifs: Record<string, string[]> = {};
  const rawMotifs = (input.motifs ?? {}) as Record<string, unknown>;
  for (const [name, value] of Object.entries(rawMotifs)) {
    if (!Array.isArray(value)) continue;
    const rows = value
      .filter((row): row is string => typeof row === "string")
      .map((row) => [...row].map((ch) => (VALID_CHARS.has(ch) ? ch : ".")).join(""));
    if (rows.length) motifs[name] = rows;
  }

  const rawBands = Array.isArray(input.bands) ? input.bands : [];
  const bands: Band[] = [];
  for (const entry of rawBands) {
    if (!entry || typeof entry !== "object") continue;
    const band = entry as Record<string, unknown>;
    const width = clamp(Number(band.width) || 0, 2, halfWidth);
    if (band.kind === "warp") {
      const sequence = Array.isArray(band.sequence)
        ? band.sequence.map((v) => clamp(Number(v) || 0, 0, 5))
        : [1, 0];
      bands.push({ kind: "warp", width, sequence: sequence.length ? sequence : [1, 0] });
    } else {
      const motif = typeof band.motif === "string" ? band.motif : "";
      if (!motifs[motif]) continue;
      bands.push({
        kind: "motif",
        width,
        ground: clamp(Number(band.ground) || 0, 0, 5),
        motif,
        step: clamp(Number(band.step) || motifs[motif].length + 2, 6, size),
        alternate: Boolean(band.alternate),
      });
    }
  }
  if (!bands.length) return null;

  // บีบผลรวมความกว้างให้พอดีครึ่งผืนเป๊ะ กริดจะได้ไม่เหลื่อม
  let total = bands.reduce((sum, band) => sum + band.width, 0);
  while (total > halfWidth) {
    const widest = bands.reduce((a, b) => (b.width > a.width ? b : a));
    widest.width -= 1;
    total -= 1;
    if (widest.width <= 2) break;
  }
  if (total < halfWidth) bands[bands.length - 1].width += halfWidth - total;

  // ปรับความกว้างผังลายให้พอดีกับแถบของมัน
  for (const band of bands) {
    if (band.kind !== "motif") continue;
    const rows = motifs[band.motif];
    const target = band.width;
    motifs[band.motif] = rows.map((row) =>
      row.length >= target ? row.slice(0, target) : row + ".".repeat(target - row.length)
    );
  }

  let border: ChartDesign["border"];
  const rawBorder = input.border as Record<string, unknown> | undefined;
  if (rawBorder && typeof rawBorder.motif === "string" && motifs[rawBorder.motif]) {
    border = {
      height: clamp(Number(rawBorder.height) || 16, 6, Math.round(size / 3)),
      motif: rawBorder.motif,
      ground: clamp(Number(rawBorder.ground) || 0, 0, 5),
    };
  }

  return {
    title: typeof input.title === "string" && input.title.trim() ? input.title.trim() : "ลายผสม",
    size,
    bands,
    motifs,
    border,
  };
}

/** แปลงผังเป็นตารางตัวเลขสีขนาด size x size — นี่คือผังทอที่แท้จริง */
export function designToGrid(design: ChartDesign): Uint8Array {
  const { size } = design;
  const grid = new Uint8Array(size * size);
  const set = (x: number, y: number, v: number) => {
    if (x >= 0 && y >= 0 && x < size && y < size) grid[y * size + x] = v;
  };

  // ครึ่งซ้าย: ไล่แถบจากริมเข้าหากลาง แล้วสะท้อนไปครึ่งขวา
  let x0 = 0;
  for (const band of design.bands) {
    for (let i = 0; i < band.width; i += 1) {
      const x = x0 + i;
      if (band.kind === "warp") {
        const value = band.sequence[i % band.sequence.length];
        for (let y = 0; y < size; y += 1) set(x, y, value);
      } else {
        for (let y = 0; y < size; y += 1) set(x, y, band.ground);
      }
    }

    if (band.kind === "motif") {
      const rows = design.motifs[band.motif] ?? [];
      const motifH = rows.length;
      if (motifH) {
        let index = 0;
        for (let top = -Math.floor(band.step / 2); top < size; top += band.step) {
          for (let r = 0; r < motifH; r += 1) {
            const row = rows[r];
            for (let c = 0; c < row.length && c < band.width; c += 1) {
              const ch = row[c];
              if (ch === ".") continue;
              let value = Number(ch);
              if (band.alternate && index % 2 === 1) {
                if (value === 1) value = 2;
                else if (value === 2) value = 1;
              }
              set(x0 + c, top + r, value);
            }
          }
          index += 1;
        }
      }
    }
    x0 += band.width;
  }

  // สะท้อนครึ่งซ้ายไปครึ่งขวา
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size / 2; x += 1) {
      grid[y * size + (size - 1 - x)] = grid[y * size + x];
    }
  }

  // เชิงผ้าด้านล่าง พาดเต็มความกว้าง
  if (design.border) {
    const rows = design.motifs[design.border.motif] ?? [];
    const top = size - design.border.height;
    for (let y = top; y < size; y += 1)
      for (let x = 0; x < size; x += 1) set(x, y, design.border.ground);
    if (rows.length) {
      const unit = mirrorRows(rows.map((row) => row.slice(0, Math.max(2, Math.round(rows[0].length)))));
      const unitW = unit[0]?.length ?? 0;
      if (unitW) {
        for (let x = 0; x < size; x += unitW) {
          for (let r = 0; r < unit.length && top + r < size; r += 1) {
            for (let c = 0; c < unitW; c += 1) {
              const ch = unit[r][c];
              if (ch !== ".") set(x + c, top + r, Number(ch));
            }
          }
        }
      }
    }
  }

  return grid;
}

/**
 * วาดผังลงเป็นภาพ
 * ทุกช่องกว้างเท่ากันเป๊ะ และมีเส้นกริดตรงรอยต่อช่องพอดี
 * ทุก 8 ช่องจะมีเส้นเข้มกว่าไว้ให้นับง่ายเหมือนกระดาษกราฟ
 */
export function renderChart(
  grid: Uint8Array,
  size: number,
  palette: string[],
  options: { cell?: number; gridLines?: boolean; majorEvery?: number } = {}
) {
  const cell = options.cell ?? Math.max(3, Math.floor(768 / size));
  const showGrid = options.gridLines ?? true;
  const major = options.majorEvery ?? 8;

  const canvas = document.createElement("canvas");
  canvas.width = size * cell;
  canvas.height = size * cell;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas not supported");

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      ctx.fillStyle = palette[grid[y * size + x]] ?? palette[0];
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  if (!showGrid || cell < 4) return canvas;

  // เส้นกริดอยู่บนรอยต่อช่องพอดี ความถี่สม่ำเสมอทั้งผืน
  ctx.globalCompositeOperation = "multiply";
  for (let i = 0; i <= size; i += 1) {
    const isMajor = i % major === 0;
    ctx.globalAlpha = isMajor ? 0.3 : 0.14;
    ctx.fillStyle = "#1a1208";
    ctx.fillRect(i * cell, 0, 1, canvas.height);
    ctx.fillRect(0, i * cell, canvas.width, 1);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  return canvas;
}
