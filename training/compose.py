"""
แปลงสิ่งที่ผู้ใช้จินตนาการ ให้เป็น prompt สำหรับ LoRA ลายผ้ามัดหมี่

เจตนา
    ไม่มีคลังคำ ไม่มีช่องให้เติม ไม่มีโครงประโยคตายตัว
    ผู้ใช้พิมพ์อะไรก็ได้เป็นภาษาไทย แล้วโมเดลภาษาเป็นคนแปลงเป็นคำสั่งภาพ
    สิ่งเดียวที่บังคับคือ trigger token ซึ่งเป็นกุญแจเรียก LoRA
    ที่เหลือปล่อยอิสระทั้งหมด

    เหตุผลที่ต้องแปลง ไม่ใช่ส่งข้อความไทยตรง ๆ
    SDXL เข้าใจภาษาไทยแทบไม่ได้ และ caption ที่ใช้เทรนเป็นภาษาอังกฤษ
    ถ้าส่งไทยไปตรง ๆ LoRA จะแทบไม่ทำงาน

ถ้าเรียกโมเดลไม่ได้
    จะถอยไปใช้พจนานุกรมคำลายผ้าแบบง่าย ซึ่งครอบคลุมน้อยกว่ามาก
    และจะบอกให้รู้ว่ากำลังใช้ทางสำรองอยู่ ไม่กลบเงียบ

การใช้งาน
    python training/compose.py --text "นาคพันกันเป็นเกลียว พื้นเขียวมรกต มีดอกไม้เล็ก ๆ โรยรอบ"
    python training/compose.py --text "ลายที่ดูเหมือนคลื่นน้ำโขงตอนพระอาทิตย์ตก" --count 3
    python training/compose.py --surprise --count 5
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
TRIGGER = "isaanmudmee"

TEXT_MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash"]
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent"


def load_keys() -> list[list[str]]:
    """อ่านคีย์จาก .env.local แยกเป็นบัญชี เรียงตามลำดับที่ตั้งไว้"""
    env = ROOT / ".env.local"
    accounts: list[list[str]] = []
    if not env.exists():
        return accounts
    for line in env.read_text(encoding="utf-8").splitlines():
        if not line.startswith("GEMINI_API_KEYS_ACCOUNT_"):
            continue
        _, _, value = line.partition("=")
        keys = [k.strip() for k in value.split(",") if k.strip()]
        if keys:
            accounts.append(keys)
    single = os.environ.get("GEMINI_API_KEY", "").strip()
    if single:
        accounts.append([single])
    return accounts


def ask_model(prompt: str, timeout: int = 25) -> str | None:
    """
    ถามโมเดลภาษา ไล่คีย์ทีละบัญชีและโมเดลทีละรุ่น

    free tier ล่มเป็นช่วง ๆ และโควตาแยกกันรายรุ่น จึงต้องลองหลายทาง
    แต่ไม่ไล่จนครบทุกคีย์ เพราะจะช้าเกินกว่าที่ผู้ใช้จะรอ
    """
    body = json.dumps(
        {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 1.3,
                "maxOutputTokens": 2048,
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }
    ).encode()

    for keys in load_keys():
        for model in TEXT_MODELS:
            request = urllib.request.Request(
                ENDPOINT.format(model),
                data=body,
                headers={"Content-Type": "application/json", "x-goog-api-key": keys[0]},
            )
            try:
                with urllib.request.urlopen(request, timeout=timeout) as response:
                    payload = json.loads(response.read())
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
                continue
            parts = payload.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            text = "".join(part.get("text", "") for part in parts)
            if text.strip():
                return text
    return None


# พจนานุกรมสำรอง ใช้เฉพาะตอนเรียกโมเดลไม่ได้
# ตั้งใจให้สั้น เพราะนี่ไม่ใช่ทางหลัก ไม่ใช่คลังคำที่ผู้ใช้ต้องเลือกจากมัน
FALLBACK_TERMS = {
    "นาค": "naga serpent motif", "พญานาค": "naga serpent motif",
    "หมากเบ็ง": "tiered offering motif", "บายศรี": "tiered offering motif",
    "ขอ": "hook motif", "ตะขอ": "hook motif",
    "ดอกไม้": "floral motif", "ดอก": "floral motif", "บัว": "lotus motif",
    "ฝ้าย": "cotton flower motif", "ก้นหอย": "spiral motif",
    "ข้าวหลามตัด": "lozenge lattice", "ลูกแก้ว": "lozenge motif",
    "เกลียว": "twisted", "คลื่น": "wave", "น้ำ": "water", "เปลว": "flame",
    "แดง": "red", "ส้ม": "orange", "เหลือง": "yellow", "ทอง": "gold",
    "เขียว": "green", "ฟ้า": "sky blue", "น้ำเงิน": "blue", "คราม": "indigo",
    "ม่วง": "violet", "ชมพู": "pink", "ดำ": "black", "ขาว": "white",
    "ครีม": "cream", "น้ำตาล": "brown", "มรกต": "emerald", "เงิน": "silver",
    "เข้ม": "deep", "อ่อน": "pale", "สด": "vivid",
    "แนวตั้ง": "vertical bands", "แนวนอน": "horizontal bands",
    "เชิงผ้า": "border along one edge", "ริ้ว": "stripes", "ถี่": "dense",
}


def fallback_prompt(text: str, rng: random.Random) -> str:
    """แปลงแบบหยาบด้วยพจนานุกรม ใช้เมื่อโมเดลภาษาใช้ไม่ได้"""
    found = [english for thai, english in FALLBACK_TERMS.items() if thai in text]
    # เก็บคำอังกฤษที่ผู้ใช้พิมพ์มาเองไว้ด้วย เผื่อเขาเขียนอังกฤษปนมา
    english_words = re.findall(r"[A-Za-z][A-Za-z\- ]{2,}", text)
    found.extend(w.strip() for w in english_words)
    if not found:
        found = ["geometric ikat motif"]
    seen: list[str] = []
    for item in found:
        if item not in seen:
            seen.append(item)
    return ", ".join([TRIGGER, *seen])


def build_instruction(text: str, sources: list[dict], count: int, surprise: bool) -> str:
    reference = ""
    if sources:
        lines = "\n".join(
            f"- {s['motif']} ({s['composition']}, {s['colors']})" for s in sources
        )
        reference = (
            "\nผ้าต้นแบบที่ผู้ใช้เลือกไว้ ให้ใช้เป็นแรงบันดาลใจ "
            f"แต่ไม่ต้องลอกตรง ๆ:\n{lines}\n"
        )

    task = (
        "ผู้ใช้ไม่ได้บอกอะไรมา ให้คุณคิดลายผ้ามัดหมี่ขึ้นใหม่เองล้วน ๆ "
        "กล้าแปลก กล้าต่างจากลายที่เคยเห็น"
        if surprise
        else f'ผู้ใช้จินตนาการไว้ว่า: "{text}"'
    )

    return f"""คุณคือช่างออกแบบลายผ้าไหมมัดหมี่อีสานที่เข้าใจทั้งงานผ้าและการสั่งงานโมเดลสร้างภาพ

{task}
{reference}
แปลงเป็นคำสั่งภาษาอังกฤษสำหรับ Stable Diffusion จำนวน {count} แบบที่ต่างกันชัดเจน

กติกา
- ขึ้นต้นทุกคำสั่งด้วย "{TRIGGER}," เสมอ นี่คือกุญแจเรียกสไตล์ผ้ามัดหมี่ที่เทรนไว้
- ที่เหลือเขียนอิสระเต็มที่ ไม่มีโครงประโยคบังคับ ไม่ต้องมีครบทุกหัวข้อ
  ถ้าผู้ใช้ไม่ได้พูดถึงสี ก็ไม่ต้องใส่สี ปล่อยให้โมเดลตัดสินใจเอง
- บรรยายสิ่งที่ "มองเห็น" ในผืนผ้า ไม่ใช่ความรู้สึกหรือเรื่องเล่า
  เช่น แทนที่จะเขียน "สื่อถึงความอุดมสมบูรณ์" ให้เขียนว่าเห็นรูปอะไร วางยังไง
- แต่ละแบบต้องต่างกันจริง ไม่ใช่สลับคำ
- ห้ามใส่คำว่า photo, realistic, 3d render เพราะนี่คือผ้าทอแบน

ตอบเป็น JSON เท่านั้น: {{"prompts": ["...", "..."]}}"""


def load_sources(pattern_ids: list[str]) -> list[dict]:
    manifest = HERE / "manifest.json"
    if not manifest.exists():
        return []
    data = json.loads(manifest.read_text(encoding="utf-8"))
    by_id = {e["id"]: e for e in data["images"]}
    return [by_id[p] for p in pattern_ids if p in by_id]


def compose(
    text: str = "",
    patterns: list[str] | None = None,
    count: int = 1,
    surprise: bool = False,
    rng: random.Random | None = None,
) -> dict:
    rng = rng or random.Random()
    sources = load_sources(patterns or [])

    raw = ask_model(build_instruction(text, sources, count, surprise or not text.strip()))
    prompts: list[str] = []
    source = "gemini"

    if raw:
        try:
            parsed = json.loads(raw)
            prompts = [p.strip() for p in parsed.get("prompts", []) if isinstance(p, str) and p.strip()]
        except json.JSONDecodeError:
            prompts = []

    if not prompts:
        source = "fallback"
        prompts = [fallback_prompt(text, rng) for _ in range(count)]

    # บังคับ trigger token เสมอ โมเดลลืมได้
    prompts = [p if p.lower().startswith(TRIGGER) else f"{TRIGGER}, {p}" for p in prompts]

    return {
        "source": source,
        "items": [{"prompt": p, "seed": rng.randrange(2**31)} for p in prompts[:count]],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--text", default="", help="พิมพ์อะไรก็ได้ ภาษาไทยได้")
    parser.add_argument("--patterns", help="รหัสผ้าต้นแบบ คั่นด้วยจุลภาค ใช้เป็นแรงบันดาลใจ")
    parser.add_argument("--count", type=int, default=3)
    parser.add_argument("--surprise", action="store_true", help="ให้โมเดลคิดเองล้วน ๆ")
    parser.add_argument("--seed", type=int)
    args = parser.parse_args()

    result = compose(
        text=args.text,
        patterns=args.patterns.split(",") if args.patterns else None,
        count=args.count,
        surprise=args.surprise,
        rng=random.Random(args.seed),
    )

    if result["source"] == "fallback":
        print("! เรียกโมเดลภาษาไม่ได้ ใช้พจนานุกรมสำรองซึ่งแปลงได้หยาบกว่ามาก\n")

    for index, item in enumerate(result["items"], 1):
        print(f"{index}. seed {item['seed']}")
        print(f"   {item['prompt']}\n")


if __name__ == "__main__":
    main()
