"""
เซิร์ฟเวอร์เจนลายผ้าสด ให้หน้าเว็บเรียก

รันบนเครื่องที่มี GPU หรือบน Colab (ดู colab_serve.ipynb)
ตัวนี้ทำงานเดียวคือ ข้อความอังกฤษ → ภาพ
ส่วนการแปลงจินตนาการภาษาไทยเป็นคำสั่งภาษาอังกฤษ ให้ฝั่งเว็บทำ
เพราะคีย์โมเดลภาษาอยู่ที่นั่น ไม่ต้องยกขึ้น Colab

ทำงานได้แม้ยังไม่มี LoRA — จะใช้ SDXL เปล่า ๆ ไปก่อน
จะได้ทดสอบเส้นทางทั้งหมดก่อนเทรนเสร็จ

    POST /generate   {"prompt": "...", "count": 1}  →  {"images": ["data:image/png;base64,..."]}
    GET  /health     บอกว่าโหลดอะไรอยู่

การใช้งาน
    pip install fastapi uvicorn diffusers transformers accelerate peft safetensors
    python training/serve.py --lora /path/to/lora_out
    python training/serve.py                      # ไม่มี LoRA ใช้ SDXL เปล่า
"""

from __future__ import annotations

import argparse
import base64
import io
import random
import threading
import time

BASE_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
TRIGGER = "isaanmudmee"
NEGATIVE = "photograph of a person, text, watermark, blurry, frame, border, signature, 3d render"

state: dict = {"pipe": None, "lora": None, "lock": threading.Lock(), "count": 0}


def build_app(args: argparse.Namespace):
    import torch
    from diffusers import StableDiffusionXLPipeline
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field

    device = "cuda" if torch.cuda.is_available() else "cpu"
    if device == "cpu":
        print("! ไม่พบ GPU — SDXL บน CPU ใช้เวลาหลายสิบนาทีต่อภาพ ใช้งานจริงไม่ได้")

    print(f"กำลังโหลด {args.base} ...")
    pipe = StableDiffusionXLPipeline.from_pretrained(
        args.base,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        variant="fp16" if device == "cuda" else None,
        use_safetensors=True,
    ).to(device)
    pipe.set_progress_bar_config(disable=True)

    if args.lora:
        pipe.load_lora_weights(args.lora)
        state["lora"] = args.lora
        print(f"โหลด LoRA จาก {args.lora}")
    else:
        print("! ยังไม่ได้ใส่ LoRA — จะเจนด้วย SDXL เปล่า ลายจะไม่ใช่มัดหมี่อีสาน")

    state["pipe"] = pipe

    class Request(BaseModel):
        prompt: str = Field(..., min_length=1, max_length=2000)
        count: int = Field(1, ge=1, le=4)
        steps: int = Field(28, ge=8, le=60)
        cfg: float = Field(6.0, ge=1.0, le=15.0)
        size: int = Field(1024, ge=512, le=1280)
        seed: int | None = None
        lora_scale: float = Field(1.0, ge=0.0, le=1.5)
        negative: str | None = None

    app = FastAPI(title="Mudmee LoRA")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["POST", "GET"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict:
        return {
            "ok": True,
            "device": device,
            "base": args.base,
            "lora": state["lora"],
            "generated": state["count"],
            "trigger": TRIGGER,
        }

    @app.post("/generate")
    def generate(request: Request) -> dict:
        prompt = request.prompt.strip()
        # trigger token ต้องมาก่อนเสมอ ไม่งั้น LoRA แทบไม่ทำงาน
        if state["lora"] and not prompt.lower().startswith(TRIGGER):
            prompt = f"{TRIGGER}, {prompt}"

        # ขนาดต้องหารด้วย 8 ลงตัว ไม่งั้น VAE จะพัง
        size = (request.size // 8) * 8
        started = time.time()
        images, seeds = [], []

        # diffusers pipeline ไม่ปลอดภัยเมื่อเรียกพร้อมกัน จึงล็อกทีละคำขอ
        with state["lock"]:
            for index in range(request.count):
                seed = request.seed + index if request.seed is not None else random.randrange(2**31)
                generator = torch.Generator(device).manual_seed(seed)
                call = dict(
                    prompt=prompt,
                    negative_prompt=request.negative or NEGATIVE,
                    num_inference_steps=request.steps,
                    guidance_scale=request.cfg,
                    width=size,
                    height=size,
                    generator=generator,
                )
                if state["lora"]:
                    call["cross_attention_kwargs"] = {"scale": request.lora_scale}
                try:
                    image = pipe(**call).images[0]
                except torch.cuda.OutOfMemoryError:
                    torch.cuda.empty_cache()
                    raise HTTPException(
                        status_code=507,
                        detail="GPU หน่วยความจำไม่พอ ลองลด size หรือ count",
                    )

                buffer = io.BytesIO()
                image.save(buffer, format="PNG")
                images.append(
                    "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()
                )
                seeds.append(seed)

        state["count"] += len(images)
        return {
            "images": images,
            "prompt": prompt,
            "seeds": seeds,
            "seconds": round(time.time() - started, 1),
            "lora": state["lora"],
        }

    return app


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lora", help="โฟลเดอร์หรือไฟล์ LoRA ไม่ใส่ก็ได้")
    parser.add_argument("--base", default=BASE_MODEL)
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    import uvicorn

    uvicorn.run(build_app(args), host=args.host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
