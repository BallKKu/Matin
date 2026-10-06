import { readFile } from "node:fs/promises";
import path from "node:path";
import { patterns } from "@/lib/silk-patterns";
import { loadAccounts, runWithKeyPool } from "@/lib/geminiKeyPool";

const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType: string; data: string };
};

/** อ่านไฟล์ลายผ้าจาก public/patterns แล้วแปลงเป็น inlineData สำหรับ Gemini */
async function loadPatternPart(id: string): Promise<GeminiPart> {
  const file = path.join(process.cwd(), "public", "silk", `${id}.jpg`);
  const buffer = await readFile(file);
  return { inlineData: { mimeType: "image/jpeg", data: buffer.toString("base64") } };
}

function buildPrompt(selected: typeof patterns, note: string) {
  const list = selected
    .map((item, index) => `${index + 1}. ${item.name} (จ.${item.province}) — ${item.meaning}`)
    .join("\n");

  return [
    "คุณคือช่างออกแบบลายผ้าไหมมัดหมี่อีสาน",
    `สร้างภาพลายผ้าไหมมัดหมี่ผืนใหม่ 1 ภาพ โดยผสมผสานเอกลักษณ์ของลายต้นแบบ ${selected.length} ลายต่อไปนี้เข้าด้วยกัน:`,
    list,
    "",
    "ข้อกำหนด:",
    "- เป็นลายผ้าทอแบบมัดหมี่ที่ต่อเนื่องทั้งผืน มองเห็นเนื้อผ้าและเส้นไหมชัดเจน",
    "- คงโครงสร้างลายและโทนสีที่สืบทอดมาจากลายต้นแบบ แต่จัดองค์ประกอบขึ้นใหม่ให้เป็นลายเดียวกัน",
    "- สมมาตรแบบลายมัดหมี่ดั้งเดิม ไม่มีตัวอักษร ลายน้ำ หรือขอบกรอบ",
    "- ถ่ายตรงหน้าผ้า เต็มเฟรม สัดส่วนจัตุรัส",
    note.trim() ? `\nคำขอเพิ่มเติมจากผู้ใช้: ${note.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ids: unknown = body?.patternIds;
    const note: string = typeof body?.prompt === "string" ? body.prompt : "";

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json(
        { error: "กรุณาเลือกลายผ้าอย่างน้อย 1 ลาย" },
        { status: 400 }
      );
    }

    const selected = patterns.filter((item) => ids.includes(item.id));
    if (selected.length === 0) {
      return Response.json({ error: "ไม่พบลายผ้าที่เลือก" }, { status: 400 });
    }

    const accounts = loadAccounts();
    if (accounts.length === 0) {
      // ยังไม่ได้วางคีย์ — ให้ฝั่งหน้าเว็บผสมลายแบบเดโมแทน
      return Response.json(
        { code: "missing_api_key", error: "ยังไม่ได้ตั้งค่าคีย์ Gemini (โหมดเดโม)" },
        { status: 503 }
      );
    }

    const imageParts = await Promise.all(selected.map((item) => loadPatternPart(item.id)));
    const parts: GeminiPart[] = [{ text: buildPrompt(selected, note) }, ...imageParts];

    const payload = JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        // seed ต่างกันทุกครั้ง เพื่อให้ผลลัพธ์ไม่ซ้ำกัน
        seed: Math.floor(Math.random() * 2 ** 31),
      },
    });

    const result = await runWithKeyPool(accounts, async (key) => {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: payload,
      });

      if (!response.ok) {
        return { ok: false as const, status: response.status, body: await response.text() };
      }

      const data = await response.json();
      const returned: GeminiPart[] = data?.candidates?.[0]?.content?.parts ?? [];
      const image = returned.find((part) => part.inlineData)?.inlineData;

      if (!image) {
        return { ok: false as const, status: 502, body: JSON.stringify(data) };
      }

      return {
        ok: true as const,
        value: {
          image: `data:${image.mimeType};base64,${image.data}`,
          text: returned.find((part) => part.text)?.text ?? null,
        },
      };
    });

    if (!result.ok) {
      console.error("Gemini API Error:", result.status, result.body);
      return Response.json(
        {
          code: "all_keys_failed",
          error: "เรียก Gemini ไม่สำเร็จ (คีย์ทุกบัญชีใช้ไม่ได้หรือเต็มโควตารายวัน)",
          details: result.body.slice(0, 1000),
        },
        { status: result.status === 429 ? 429 : 502 }
      );
    }

    return Response.json({
      image: result.value.image,
      text: result.value.text,
      source: "gemini",
      account: result.account,
    });
  } catch (error) {
    console.error("Mix Patterns Error:", error);
    return Response.json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
