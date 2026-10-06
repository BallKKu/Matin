import { analyzeImage } from "@/lib/imageAnalyzer";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("image");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "กรุณาอัปโหลดรูปภาพ" },
        { status: 400 }
      );
    }

    if (
      file.type !== "image/png" &&
      file.type !== "image/jpeg"
    ) {
      return Response.json(
        { error: "รองรับเฉพาะ JPG, JPEG และ PNG" },
        { status: 400 }
      );
    }

    const imageBuffer = await file.arrayBuffer();

    const analysis = await analyzeImage(imageBuffer);

    return Response.json({
      analysis,
    });

  } catch (error) {
    console.error("Analyze Error:", error);

    return Response.json(
      {
        error: "วิเคราะห์รูปภาพไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}