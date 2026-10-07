import { patterns } from "@/lib/silk-patterns";
import { loadAccounts, runWithKeyPool } from "@/lib/geminiKeyPool";


/**
 * ให้ Gemini ออกแบบ "ผังทอ" ของลายผสม แล้วส่งผังกลับไปให้หน้าเว็บเรนเดอร์
 *
 * free tier ของ Gemini ไม่เปิดให้สร้างภาพ (ทุกโมเดลภาพคืน limit: 0)
 * แต่โมเดลข้อความใช้ได้ จึงให้มันทำงานที่ยากกว่าแทน คือออกแบบลายเอง
 * ผลที่ได้จึงไม่ซ้ำและไม่ติดกรอบโครงที่เราฟิกไว้
 */

const TEXT_MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash"];

/** โมเดลข้อความฝั่ง free tier ล่มเป็นช่วง ๆ จึงกันเวลารวมไว้ ไม่ให้ผู้ใช้รอนาน */
const DEADLINE_MS = 32_000;
const REQUEST_TIMEOUT_MS = 22_000;

const endpoint = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/** ขนาดลายที่ขอจากโมเดล — ต้องตรงกับที่ composer ใช้จัดวาง */
export const MOTIF_SPECS = {
  centre: { width: 26, height: 34, label: "ลายกลางผืน ดอกใหญ่ที่สุด ต้องอลังการและเต็มกรอบ" },
  side: { width: 14, height: 20, label: "ลายแถบข้าง ขนาดกลาง" },
  band: { width: 7, height: 9, label: "ลายคั่นเล็ก ๆ ที่ซ้ำถี่" },
} as const;

function buildPrompt(selected: typeof patterns, note: string) {
  const sources = selected
    .map(
      (item, index) =>
        `${index + 1}. ${item.name} (จ.${item.province}) — ${item.meaning.slice(0, 150)}`
    )
    .join("\n");

  const specs = Object.entries(MOTIF_SPECS)
    .map(
      ([key, spec]) =>
        `  "${key}": ${spec.height} สตริง สตริงละ ${spec.width} ตัวอักษร — ${spec.label}`
    )
    .join("\n");

  return `คุณคือช่างออกแบบลายผ้าไหมมัดหมี่อีสาน กำลังเขียนลายลงกระดาษกราฟให้ช่างทอ

ผ้าต้นแบบที่ต้องนำเอกลักษณ์มาผสมกัน:
${sources}
${note.trim() ? `
คำขอเพิ่มเติมจากผู้ใช้: ${note.trim()}
` : ""}
วาดลายใหม่ 3 ชิ้นที่ผสมเอกลักษณ์ข้างบน ตอบ JSON:
{"title":"ชื่อลายไทยสั้น ๆ","motifs":{
${specs}
}}

กติกา: ใช้อักขระ "." พื้น "1" สีลาย "2" สีรอง "3" ไฮไลต์
วาดครึ่งซ้ายของลาย (แกนกลางอยู่ขอบขวาสุด ระบบสะท้อนให้เอง)
ลายต้องเต็มกรอบ มีชั้นรายละเอียด และต่างจากแบบเดิมทุกครั้ง
จำนวนแถวและความยาวสตริงต้องตรงเป๊ะ ตอบ JSON อย่างเดียว`;
}

const VALID_CHARS = new Set([".", "1", "2", "3"]);

export type Drawing = { title: string; motifs: Record<string, string[]> };

/**
 * ตรวจและซ่อมลายที่โมเดลวาดมา
 * บังคับขนาดให้ตรงสเปก ตัดอักขระแปลกปลอม และทิ้งลายที่ว่างเปล่า
 */
function normaliseDrawing(raw: unknown): Drawing | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const rawMotifs = (input.motifs ?? {}) as Record<string, unknown>;

  const motifs: Record<string, string[]> = {};
  for (const [key, spec] of Object.entries(MOTIF_SPECS)) {
    const value = rawMotifs[key];
    if (!Array.isArray(value)) continue;

    const rows = value
      .filter((row): row is string => typeof row === "string")
      .map((row) => {
        const clean = [...row].map((ch) => (VALID_CHARS.has(ch) ? ch : ".")).join("");
        return clean.length >= spec.width
          ? clean.slice(0, spec.width)
          : clean + ".".repeat(spec.width - clean.length);
      })
      .slice(0, spec.height);

    while (rows.length < spec.height) rows.push(".".repeat(spec.width));

    // ลายที่แทบไม่มีเนื้อ ถือว่าใช้ไม่ได้
    const filled = rows.join("").split("").filter((ch) => ch !== ".").length;
    if (filled < rows.length * spec.width * 0.08) continue;

    motifs[key] = rows;
  }

  if (!motifs.centre) return null;

  const title =
    typeof input.title === "string" && input.title.trim() ? input.title.trim().slice(0, 60) : "";
  return { title, motifs };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ids: unknown = body?.patternIds;
    const note: string = typeof body?.prompt === "string" ? body.prompt : "";

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: "กรุณาเลือกลายผ้าอย่างน้อย 1 ลาย" }, { status: 400 });
    }

    const selected = patterns.filter((item) => ids.includes(item.id));
    if (selected.length === 0) {
      return Response.json({ error: "ไม่พบลายผ้าที่เลือก" }, { status: 400 });
    }

    const accounts = loadAccounts();
    if (accounts.length === 0) {
      return Response.json(
        { code: "missing_api_key", error: "ยังไม่ได้ตั้งค่าคีย์ Gemini" },
        { status: 503 }
      );
    }

    const payload = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(selected, note) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        // อุณหภูมิสูง เพื่อให้ผังต่างกันทุกครั้ง
        temperature: 1.25,
        topP: 0.95,
        maxOutputTokens: 6144,
        // ไม่ต้องให้โมเดลคิดยาว งานนี้ต้องการความไวมากกว่า
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const startedAt = Date.now();

    const result = await runWithKeyPool(accounts, async (key) => {
      let lastStatus = 503;
      let lastBody = "หมดเวลารอ Gemini";
      // นับว่าเจอ 429 ครบทุกรุ่นไหม ถ้าครบจึงถือว่าบัญชีนี้เต็มโควตาจริง
      let attempted = 0;
      let quotaHits = 0;

      // โมเดลข้อความที่ใช้ได้ต่างกันไปตามบัญชี จึงไล่ลองตามลำดับ
      for (const model of TEXT_MODELS) {
        if (Date.now() - startedAt > DEADLINE_MS) break;
        attempted += 1;

        let response: Response;
        try {
          response = await fetch(endpoint(model), {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: payload,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          });
        } catch {
          lastStatus = 504;
          lastBody = `${model} ไม่ตอบในเวลาที่กำหนด`;
          continue;
        }

        if (!response.ok) {
          lastStatus = response.status;
          lastBody = await response.text();
          // โมเดลข้อความแต่ละรุ่นมีโควตาแยกกัน และบางรุ่นบัญชีนี้ไม่มี
          // จึงต้องลองให้ครบทุกรุ่นก่อน ค่อยสรุปว่าคีย์นี้ใช้ไม่ได้
          // (404 ไม่มีรุ่นนี้ · 429 รุ่นนี้เต็มโควตา · 500/503 ฝั่งโมเดลล่ม)
          if (response.status === 429) quotaHits += 1;
          if ([404, 429, 500, 503].includes(response.status)) continue;
          return { ok: false as const, status: lastStatus, body: lastBody };
        }

        const data = await response.json();
        const text: string =
          data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";

        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          lastStatus = 502;
          lastBody = `โมเดลตอบไม่เป็น JSON: ${text.slice(0, 200)}`;
          continue;
        }

        const drawing = normaliseDrawing(parsed);
        if (!drawing) {
          lastStatus = 502;
          lastBody = "ลายที่ได้ไม่ครบหรือว่างเปล่า";
          continue;
        }

        return { ok: true as const, value: { drawing, model } };
      }

      // บอก key pool ว่าเป็น "เต็มโควตา" ก็ต่อเมื่อทุกรุ่นตอบ 429
      // ถ้าเป็นเพราะโมเดลล่มหรือหมดเวลา ให้ถือเป็นแค่ลองใหม่ บัญชีจะได้ไม่ถูกตัดทิ้งทั้งวัน
      const quotaExhausted = attempted > 0 && quotaHits === attempted;
      return { ok: false as const, status: quotaExhausted ? 429 : 503, body: lastBody };
    });

    if (!result.ok) {
      console.error("Gemini design error:", result.status, result.body.slice(0, 400));
      return Response.json(
        {
          code: "all_keys_failed",
          error: "Gemini ออกแบบผังไม่สำเร็จ",
          details: result.body.slice(0, 500),
        },
        { status: result.status === 429 ? 429 : 502 }
      );
    }

    return Response.json({
      drawing: result.value.drawing,
      model: result.value.model,
      account: result.account,
      source: "gemini",
    });
  } catch (error) {
    console.error("Mix Patterns Error:", error);
    return Response.json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
