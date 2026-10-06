import { processMudmeePrompt } from "@/lib/promptProcessor";

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get("content-type") ?? "";
        let prompt: unknown;
        let sourceImage: File | null = null;

        if (contentType.includes("multipart/form-data")) {
            const form = await request.formData();
            prompt = form.get("prompt");
            const image = form.get("image");
            if (image instanceof File) sourceImage = image;
        } else {
            const body = await request.json();
            prompt = body.prompt;
        }

        // ตรวจสอบว่ามี Prompt หรือไม่
        if (typeof prompt !== "string" || prompt.trim() === "") {
            return Response.json(
                { error: "กรุณาระบุคำอธิบายลายผ้า" },
                { status: 400 }
            );
        }

        if (sourceImage && (!["image/png", "image/jpeg"].includes(sourceImage.type) || sourceImage.size === 0 || sourceImage.size > 8 * 1024 * 1024)) {
            return Response.json(
                { error: "ภาพตั้งต้นต้องเป็น PNG หรือ JPEG และมีขนาดไม่เกิน 8 MB" },
                { status: 400 }
            );
        }

        // ประมวลผล Prompt ภาษาไทย
        const processedPrompt = processMudmeePrompt(prompt);

        console.log("Thai Prompt:", prompt);
        console.log("Processed Prompt:", processedPrompt);

        // ดึง API Key
        const apiKey = process.env.STABILITY_API_KEY;

        if (!apiKey) {
            return Response.json(
                { error: "ไม่พบ Stability API Key" },
                { status: 500 }
            );
        }

        // สร้าง FormData
        const formData = new FormData();

        formData.append("prompt", processedPrompt);

        if (sourceImage) {
            formData.append("image", sourceImage);
            formData.append("mode", "image-to-image");
            formData.append("strength", "0.65");
        }

        // เปลี่ยนจาก Medium เป็น Flash
        formData.append("model", "sd3.5-flash");

        formData.append("output_format", "jpeg");
        formData.append("aspect_ratio", "1:1");

        // เรียก Stability AI
        const response = await fetch(
            "https://api.stability.ai/v2beta/stable-image/generate/sd3",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    Accept: "image/*",
                },
                body: formData,
            }
        );

        // ตรวจสอบผลลัพธ์จาก Stability
        if (!response.ok) {
            const errorText = await response.text();

            console.error("Stability API Error:", errorText);

            return Response.json(
                {
                    error: "สร้างภาพไม่สำเร็จ",
                    details: errorText,
                },
                { status: response.status }
            );
        }

        const imageBuffer = await response.arrayBuffer();

        const base64Image =
            Buffer.from(imageBuffer).toString("base64");

        return Response.json({
            image: `data:image/jpeg;base64,${base64Image}`,
        });

    } catch (error) {
        console.error("Server Error:", error);

        return Response.json(
            {
                error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์",
            },
            { status: 500 }
        );
    }
}
