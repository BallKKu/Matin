"""
เจนลายผ้าจาก LoRA ที่เทรนเสร็จแล้ว

ต้องรันบนเครื่องที่มี GPU (หรือบน Colab) เพราะ SDXL รันบน CPU ช้าเกินใช้งานจริง
ภาพละหลายสิบนาที

INPUT
    ข้อความบอกลายที่ต้องการ ขึ้นต้นด้วย trigger token เสมอ
        isaanmudmee, <ลายหลัก>, <การจัดวาง>, <โทนสี>
    ใส่ภาพผ้าต้นแบบด้วยก็ได้ (--init) โมเดลจะยึดโครงจากภาพนั้น

OUTPUT
    ไฟล์ PNG 1024x1024 ต่อหนึ่ง prompt ต่อหนึ่ง seed
    ชื่อไฟล์คือ <ชื่อ prompt>_<seed>.png วางในโฟลเดอร์ที่ระบุ
    รูปแบบนี้ป้อนเข้า evaluate.py ได้ทันที

ตัวอย่าง
    # เจนจากข้อความอย่างเดียว
    python training/generate.py --lora lora_out --prompt "naga motif with flame crest, indigo ground"

    # เจนทั้งชุดทดสอบ 10 prompts เพื่อเอาไปให้คะแนน
    python training/generate.py --lora lora_out --preset test --out samples/final

    # ยึดโครงจากผ้าจริงผืนหนึ่ง
    python training/generate.py --lora lora_out --preset test --init training/source/sakon-nakhon.png
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
TRIGGER = "isaanmudmee"

NEGATIVE = "photograph of a person, text, watermark, blurry, frame, border, signature"

# ชุด prompt มาตรฐานสำหรับให้คะแนน ต้องเหมือนกันทุก checkpoint ถึงจะเทียบกันได้
# แบ่งสามกลุ่ม: เรียนสำเร็จไหม / ผสมลายใหม่ได้ไหม / จำภาพหรือเปล่า
TEST_PROMPTS = {
    "A": "naga motif with flame crest, burnt orange ground, cream figures",
    "B": "tiered offering motif with finial, violet ground, white figures",
    "C": "concentric lozenge lattice with floral centre, indigo ground",
    "D": "S-hook motif between warp bands, dark maroon ground, cream figures",
    "E": "naga motif inside lozenge lattice, indigo ground, three tones of blue",
    "F": "tiered offering motif with hook filler, green ground, gold figures",
    "G": "spiral and scroll motif, two tone gold and black",
    "H": "lotus motif, pink ground, white figures",
    "I": "horizontal banded repeat, teal ground",
    "J": "",
}

DEFAULT_SEEDS = [1337, 2024, 7777, 42242]


def build_prompt(body: str) -> str:
    """trigger token ต้องมาก่อนเสมอ ไม่งั้น LoRA แทบไม่ทำงาน"""
    return f"{TRIGGER}, {body}" if body.strip() else TRIGGER


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lora", required=True, help="โฟลเดอร์ LoRA หรือไฟล์ .safetensors")
    parser.add_argument("--prompt", help="ข้อความบอกลาย (ไม่ต้องใส่ trigger token)")
    parser.add_argument("--preset", choices=["test"], help="ใช้ชุด prompt มาตรฐาน 10 ชุด")
    parser.add_argument("--init", help="ภาพผ้าต้นแบบ ถ้าอยากให้ยึดโครงจากของจริง")
    parser.add_argument("--strength", type=float, default=0.7, help="ใช้คู่กับ --init 0=เหมือนเดิม 1=อิสระเต็มที่")
    parser.add_argument("--out", default=str(HERE / "generated"))
    parser.add_argument("--seeds", default=",".join(str(s) for s in DEFAULT_SEEDS))
    parser.add_argument("--steps", type=int, default=28)
    parser.add_argument("--cfg", type=float, default=6.0)
    parser.add_argument("--size", type=int, default=1024)
    parser.add_argument("--lora-scale", type=float, default=1.0, help="ลดลงถ้าลายแข็งเกินหรือจำภาพ")
    parser.add_argument(
        "--base", default="stabilityai/stable-diffusion-xl-base-1.0", help="โมเดลฐาน"
    )
    args = parser.parse_args()

    if not args.prompt and not args.preset:
        parser.error("ต้องระบุ --prompt หรือ --preset อย่างใดอย่างหนึ่ง")

    try:
        import torch
    except ImportError:
        print("ต้องติดตั้ง torch ก่อน")
        return

    if not torch.cuda.is_available():
        print("! ไม่พบ GPU — SDXL บน CPU ใช้เวลาหลายสิบนาทีต่อภาพ")
        print("  ให้รันบน Colab หรือเครื่องที่มี GPU แทน")
        return

    from diffusers import StableDiffusionXLImg2ImgPipeline, StableDiffusionXLPipeline

    jobs = (
        {key: build_prompt(body) for key, body in TEST_PROMPTS.items()}
        if args.preset
        else {"out": build_prompt(args.prompt)}
    )
    seeds = [int(s) for s in args.seeds.split(",") if s.strip()]

    common = dict(torch_dtype=torch.float16, variant="fp16", use_safetensors=True)
    if args.init:
        pipe = StableDiffusionXLImg2ImgPipeline.from_pretrained(args.base, **common)
    else:
        pipe = StableDiffusionXLPipeline.from_pretrained(args.base, **common)
    pipe = pipe.to("cuda")
    pipe.set_progress_bar_config(disable=True)
    pipe.load_lora_weights(args.lora)

    init_image = None
    if args.init:
        from PIL import Image

        init_image = Image.open(args.init).convert("RGB").resize((args.size, args.size))

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    written = []
    for key, prompt in jobs.items():
        for seed in seeds:
            generator = torch.Generator("cuda").manual_seed(seed)
            call = dict(
                prompt=prompt,
                negative_prompt=NEGATIVE,
                num_inference_steps=args.steps,
                guidance_scale=args.cfg,
                generator=generator,
                cross_attention_kwargs={"scale": args.lora_scale},
            )
            if init_image is not None:
                call.update(image=init_image, strength=args.strength)
            else:
                call.update(width=args.size, height=args.size)

            image = pipe(**call).images[0]
            path = out_dir / f"{key}_{seed}.png"
            image.save(path)
            written.append({"file": path.name, "prompt": prompt, "seed": seed})
            print(f"  {path.name}  ←  {prompt[:70]}")

    (out_dir / "prompts.json").write_text(
        json.dumps(
            {
                "lora": args.lora,
                "base": args.base,
                "lora_scale": args.lora_scale,
                "steps": args.steps,
                "cfg": args.cfg,
                "size": args.size,
                "init": args.init,
                "strength": args.strength if args.init else None,
                "images": written,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"\nเขียน {len(written)} ภาพลง {out_dir}")
    print("ให้คะแนนต่อด้วย:")
    print(f"  python training/evaluate.py score --generated {out_dir} \\")
    print("      --experiment exp_a --checkpoint final --step 860")


if __name__ == "__main__":
    main()
