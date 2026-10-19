# เทรน LoRA ลายผ้าไหมมัดหมี่อีสาน

สคริปต์เตรียมข้อมูลและประเมินผลสำหรับเทรน LoRA ให้โมเดลเรียนรู้เอกลักษณ์ลายผ้า

```
preprocess.py   ภาพผ้า → tile + caption → dataset ที่เทรนได้
evaluate.py     ภาพที่ generate → คะแนน → เลือก checkpoint
manifest.json   ระบุว่าใช้ภาพไหน ตระกูลลายอะไร และ caption ว่าอย่างไร
```

---

## ผลที่ได้จากข้อมูลชุดปัจจุบัน

ภาพต้นฉบับ 20 ใบใน `public/silk/` ถูกสกัดจาก PDF จึงผ่าน JPEG มาสองชั้น
และด้านสั้นที่สุดอยู่ที่ 381–507px เท่านั้น

ตารางนี้วัดจากข้อมูลจริง โดยไม่ยอมให้อัปสเกลเกิน 1.15 เท่า
เพราะการขยายภาพเล็กขึ้นไปเป็น tile ใหญ่จะสอนให้โมเดลสร้างภาพเบลอ

| ขนาด tile | จำนวน tile | ภาพที่ยังมีข้อมูลเหลือ |
|---|---|---|
| 320px | 207 | 17/18 |
| **384px** | **148** | **17/18** |
| 448px | 144 | 16/18 |
| 512px | 68 | 16/18 |
| 640px | 23 | 7/18 |
| 768px | 8 | 4/18 |

**ข้อสรุป:** ข้อมูลชุดนี้รองรับได้สูงสุดราว 384px
ซึ่งต่ำกว่า native ของ SDXL (1024px) และต่ำกว่า SD 1.5 (512px) ด้วยซ้ำ

> การหาภาพผ้าความละเอียดสูงกว่านี้ มีผลต่อคุณภาพมากกว่าการจูน hyperparameter ทุกตัวรวมกัน
> ถ้าถ่ายผ้าจริงได้ที่ 2000px+ จะปลดล็อกการเทรนที่ 768–1024px ทันที

ภาพที่ถูกตัดออกและเหตุผล:

| ภาพ | เหตุผล |
|---|---|
| `khon-kaen` | มีดอกไม้และกระสวยทอวางทับผ้า โมเดลจะเรียนพร็อพไปด้วย |
| `nakhon-ratchasima` | ผ้าพื้นเรียบโชว์ความเหลือบ ไม่มีลายให้เรียน |
| `si-sa-ket` | ลายนูนจางมาก ทุก tile ตกเกณฑ์ความหนาแน่นของขอบ |

---

## การใช้งาน

### 1. เตรียม dataset

```bash
python training/preprocess.py --tile-size 384 --scales 1.0,0.8,0.65 --overlap 0.4
```

สคริปต์จะตัด tile จัตุรัสหลายสเกล แล้วคัดออกสามชั้น

| ชั้น | วิธี | เหตุผล |
|---|---|---|
| ภาพเบลอ | Laplacian variance ต่ำกว่า 20% ล่าง **ของภาพนั้นเอง** | ถ้าใช้เกณฑ์รวมทั้งชุด ภาพที่นุ่มกว่าเพื่อนจะถูกลบทั้งใบ |
| พื้นเรียบ | edge density จาก Canny ที่ปรับตามความสว่างภาพ | ผ้าโทนเข้มกับโทนสว่างให้ค่าต่างกันมากถ้าใช้เกณฑ์ตายตัว |
| ภาพซ้ำ | perceptual hash (DCT) hamming ≤ 6 | sliding window ทำให้ได้ tile ที่เกือบเหมือนกัน |

ผลลัพธ์อยู่ที่ `training/dataset/v1/` — ไฟล์ `.png` คู่กับ `.txt` ตามรูปแบบที่ kohya_ss อ่านได้

### 2. หาเกณฑ์จากข้อมูลจริง

```bash
python training/evaluate.py calibrate
```

ทุก threshold มาจาก dataset ไม่ใช่เลขที่ตั้งเอง ค่าที่ได้จากชุดปัจจุบัน:

| เกณฑ์ | ค่า | ที่มา |
|---|---|---|
| `memorization_threshold` | 0.9075 | เปอร์เซ็นไทล์ที่ 95 ของความคล้าย DINOv2 ภายใน dataset |
| `symmetry_min` | 0.7982 | เปอร์เซ็นไทล์ที่ 10 ของความสมมาตรใน dataset |
| `periodicity_min` | 58.78 | เปอร์เซ็นไทล์ที่ 10 ของความเป็นคาบใน dataset |
| `style_tau` | 0.2303 | เปอร์เซ็นไทล์ที่ 75 ของระยะ Gram จากค่ากลาง |
| `color_tau` | 0.0828 | เปอร์เซ็นไทล์ที่ 90 ของระยะสีถึง tile ที่ใกล้ที่สุด |

แนวคิดของเกณฑ์ memorization: ถ้าภาพที่ generate เหมือนภาพ train
**มากกว่าที่ภาพ train สองใบเหมือนกันเอง** แปลว่าลอกมา ไม่ได้สร้างใหม่

### 3. ให้คะแนน checkpoint

```bash
python training/evaluate.py score \
  --generated runs/exp_a/epoch_08 \
  --experiment exp_a --checkpoint epoch_08 --step 400
```

### 4. เลือก checkpoint

```bash
python training/evaluate.py report
```

---

## ระบบให้คะแนน

ใช้ **gate ก่อน แล้วค่อยถ่วงน้ำหนัก** ไม่ใช่คะแนนรวมล้วน ๆ
เพราะคะแนนรวมล้วนทำให้ภาพ "สวยแต่ผิดสไตล์" ชนะได้

```
ตกข้อใดข้อหนึ่ง = ตัดทิ้งทันที ไม่ว่าคะแนนอื่นดีแค่ไหน
  memorization > เกณฑ์        ลอกภาพ train
  symmetry     < เกณฑ์        ไม่ใช่ลายมัดหมี่
  periodicity  < เกณฑ์        ลายไม่ซ้ำเป็นคาบ ไม่เหมือนผ้าทอ
  diversity    < 0.15         mode collapse

คะแนนรวมของตัวที่ผ่าน gate
  style_similarity  0.25    Gabor correlation (แนวคิดเดียวกับ Gram matrix)
  motif_fidelity    0.20    คนหรือ LLM pairwise ← ไม่ใช่คะแนนอัตโนมัติ
  textile_realism   0.15    FFT periodicity เทียบ dataset
  composition       0.12    symmetry เทียบ dataset
  novelty           0.10    1 − ความคล้ายเฉลี่ยกับ train
  color_harmony     0.10    ระยะสีถึง tile ที่โทนใกล้ที่สุด
  diversity         0.08    ความต่างกันเองของภาพที่ generate
```

`visual quality` ไม่อยู่ในสูตรโดยตั้งใจ — มันถูกคุมด้วย gate แล้ว
ถ้าใส่เข้าไปจะกลายเป็นการให้รางวัลกับภาพสวยที่ไม่ใช่ลายผ้า

### ใครวัดอะไร

| งาน | เครื่องมือ | มีสิทธิ์ veto |
|---|---|---|
| memorization, novelty, diversity | DINOv2 | ใช่ |
| symmetry, periodicity, sharpness | OpenCV | ใช่ |
| style, color | Gabor + Lab histogram | ไม่ |
| motif, composition | คน หรือ LLM pairwise | ไม่ |

**ไม่ใช้ CLIP วัด style หรือ memorization** — CLIP จับความหมายเชิงภาษา
ผ้าสองผืนที่ลายคนละแบบสิ้นเชิงจะได้ CLIP similarity สูงทั้งคู่
เพราะมันเห็นแค่ว่า "เป็นผ้าลายเรขาคณิตเหมือนกัน"

---

## การตรวจสอบตัวประเมิน

ทดสอบด้วยสองกรณีควบคุมเพื่อยืนยันว่ามันแยกแยะได้จริง

| ชุดทดสอบ | color | ผลที่ควรได้ | ผลจริง |
|---|---|---|---|
| คัดลอก tile จาก train มาตรง ๆ | 1.000 | ตกเกณฑ์ memorization | ตก (sim 1.0 > 0.9075) และระบุไฟล์ที่ใกล้ที่สุดได้ |
| noise / ไล่เฉด / สีพื้น | 0.000 | ตกเกณฑ์ว่าไม่ใช่ผ้า | ตก (symmetry 0.729 < 0.798) |

ควรรันซ้ำทุกครั้งที่แก้สูตรคะแนน ถ้าสองกรณีนี้ไม่ตก แปลว่าสูตรพัง

---

## ข้อจำกัดที่รู้อยู่

- **periodicity สูงได้จาก noise** — สเปกตรัมของ noise มี peak/mean สูงเช่นกัน
  ลำพัง metric นี้ไม่พอ ต้องใช้คู่กับ symmetry ซึ่งเป็นตัวที่จับ noise ได้จริง
- **motif_fidelity ยังไม่อัตโนมัติ** — ตั้งใจให้เป็นแบบนั้น
  ถ้าไม่ใส่ค่า จะถือว่ายังไม่ประเมินและ final score เป็น 0
- **ตระกูล `spiral` กับ `phum` มี tile น้อย** (9 และ 8) จากภาพต้นฉบับละ 1 ใบ
  สองตระกูลนี้จะถูกกลบตอนเทรน ต้องหาภาพเพิ่ม

---

## สิ่งที่ยังไม่ได้ทำ

สคริปต์เทรนจริงยังไม่มีในโฟลเดอร์นี้ เพราะต้องรันบน GPU
`dataset/v1` อยู่ในรูปแบบที่ kohya_ss อ่านได้ทันที (`.png` + `.txt` ชื่อเดียวกัน)

ค่าตั้งต้นที่แนะนำสำหรับ dataset ขนาดนี้:

```yaml
network_dim: 16
network_alpha: 8
network_dropout: 0.1
unet_lr: 1.0e-4
text_encoder_lr: 5.0e-5
optimizer: AdamW8bit
lr_scheduler: cosine_with_restarts
resolution: 384          # ตามเพดานของข้อมูล ไม่ใช่ตามที่โมเดลอยากได้
train_batch_size: 2
gradient_accumulation_steps: 2
max_train_epochs: 12     # 148 tiles / 4 = 37 steps ต่อ epoch → ~440 steps
save_every_n_epochs: 1
noise_offset: 0.05
min_snr_gamma: 5
caption_dropout_rate: 0.05
```

บันทึก checkpoint ทุก epoch ไม่ใช่ทุกจำนวน step คงที่
เพราะ step ต่อ epoch เปลี่ยนตามขนาด dataset ถ้าตรึงที่ step จะเทียบข้าม experiment ไม่ได้
