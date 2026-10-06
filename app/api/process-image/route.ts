import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";

export async function POST(
  request: Request
) {
  let workDir: string | undefined;
  try {

    // ============================================
    // รับรูปจาก page.tsx
    // ============================================

    const formData = await request.formData();

    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          error: "ไม่พบรูปภาพ"
        },
        {
          status: 400
        }
      );
    }


    // ============================================
    // Path
    // ============================================

    const projectRoot = process.cwd();

    if (image.size === 0 || image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ภาพต้องมีขนาดไม่เกิน 10 MB" },
        { status: 400 }
      );
    }

    if (image.type !== "image/png" && image.type !== "image/jpeg") {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ PNG และ JPEG" },
        { status: 400 }
      );
    }

    const requestId = randomUUID();
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), "mudmee-"));
    const inputPath = path.join(workDir, "input.png");
    const outputDir = path.join(projectRoot, "public", "output", requestId);


    // ============================================
    // สร้าง output
    // ============================================

    await fs.mkdir(outputDir, { recursive: true });


    // ============================================
    // บันทึกรูปที่ upload
    // ============================================

    const arrayBuffer =
      await image.arrayBuffer();

    const buffer =
      Buffer.from(arrayBuffer);

    await fs.writeFile(inputPath, buffer);


    // ============================================
    // รัน Python
    // ============================================

    console.log(
      "กำลังรัน Python..."
    );


    const uvCommand =
      process.platform === "win32"
        ? "uv.exe"
        : "uv";


    const result =
      await execFileAsync(
        uvCommand,
        [
          "run",
          "python",
          "python/pattern_tile.py",
          inputPath,
          outputDir
        ],
        {
          cwd: projectRoot
        }
      );


    console.log(
      result.stdout
    );

    if (result.stderr) {
      console.log(
        result.stderr
      );
    }


    // ============================================
    // อ่าน JSON ที่ Python สร้าง
    // ============================================

    const jsonPath = path.join(outputDir, "pattern_master_2x2.json");


    const jsonText = await fs.readFile(jsonPath, "utf-8");


    const analysis = JSON.parse(jsonText);


    // ============================================
    // ส่งข้อมูลกลับ page.tsx
    // ============================================

    return NextResponse.json({

      success: true,

      ...analysis,

      files: {

        tile:
          `/output/${requestId}/pattern_tile.png`,

        tilePixel:
          `/output/${requestId}/pattern_tile_pixel.png`,

        master:
          `/output/${requestId}/pattern_master_2x2.png`,

        masterPixel:
          `/output/${requestId}/pattern_master_2x2_pixel.png`,

        json:
          `/output/${requestId}/pattern_master_2x2.json`

      }

    });

  } catch (error) {

    console.error(
      error
    );


    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการประมวลผล"
      },
      {
        status: 500
      }
    );
  } finally {
    if (workDir) {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  }
}
