type MudmeePromptData = {
    motif: string[];
    colors: string[];
    style: string[];
    arrangement: string[];
    detail: string[];
};

const mudmeeDictionary = {
    motifs: {
        "ดอกคูน": "Dok Khun flower motif",
        "ดอกไม้": "floral motif",
        "ลายดอกไม้": "floral motif",
        "เสือ": "tiger motif",
        "สิงห์": "lion motif",
        "กระทิง": "bull motif",
        "ช้าง": "elephant motif",
        "นก": "bird motif",
        "ปลา": "fish motif",
        "พญานาค": "Naga serpent motif",
        "ลายเรขาคณิต": "geometric motif",
        "ลายเรขาคณิตแบบดั้งเดิม": "traditional geometric motif",
        "ลายขิด": "traditional Isan geometric motif",
    },

    colors: {
        "สีคราม": "indigo blue",
        "สีน้ำเงิน": "blue",
        "สีฟ้า": "light blue",
        "สีชมพู": "pink",
        "สีแดง": "red",
        "สีเหลือง": "yellow",
        "สีเหลืองทอง": "golden yellow",
        "สีทอง": "gold",
        "สีครีม": "cream",
        "สีขาว": "white",
        "สีดำ": "black",
        "สีเขียว": "green",
        "สีม่วง": "purple",
        "สีส้ม": "orange",
        "สีน้ำตาล": "brown",
    },

    styles: {
        "อีสานร่วมสมัย": "contemporary Isan style",
        "อีสาน": "traditional Isan style",
        "ร่วมสมัย": "contemporary design",
        "ดั้งเดิม": "traditional design",
        "พื้นบ้าน": "folk-inspired style",
        "โมเดิร์น": "modern style",
    },

    arrangements: {
        "สมมาตร": "symmetrical composition",
        "ลายสมมาตร": "symmetrical repeating pattern",
        "ลายซ้ำ": "repeating pattern",
        "เรียงต่อกัน": "repeating motifs arranged continuously",
        "เรียงเป็นแถว": "motifs arranged in rows",
        "กระจายทั่วผืน": "motifs distributed across the fabric",
        "ลายเต็มผืน": "full-width repeating pattern",
        "ลายขอบ": "border pattern",
    },

    details: {
        "ประณีต": "intricate and detailed",
        "ละเอียด": "highly detailed",
        "เรียบง่าย": "simple and clean",
        "ซับซ้อน": "complex and elaborate",
        "ลายเล็ก": "small motifs",
        "ลายใหญ่": "large motifs",
        "หนาแน่น": "dense pattern",
        "โปร่ง": "spacious pattern",
    },
};


// วิเคราะห์คำสำคัญจาก Prompt ภาษาไทย
function findKeywords(thaiPrompt: string): MudmeePromptData {

    const result: MudmeePromptData = {
        motif: [],
        colors: [],
        style: [],
        arrangement: [],
        detail: [],
    };

    const categories = [
        ["motifs", "motif"],
        ["colors", "colors"],
        ["styles", "style"],
        ["arrangements", "arrangement"],
        ["details", "detail"],
    ] as const;


    for (const [dictionaryCategory, resultCategory] of categories) {

        const dictionary = mudmeeDictionary[dictionaryCategory];

        // ตรวจคำที่ยาวก่อน
        // เช่น "สีเหลืองทอง" ก่อน "สีเหลือง"
        const entries = Object.entries(dictionary).sort(
            ([a], [b]) => b.length - a.length
        );

        for (const [thaiKeyword, englishKeyword] of entries) {

            if (thaiPrompt.includes(thaiKeyword)) {

                result[resultCategory].push(englishKeyword);
            }
        }
    }


    // ลบคำที่ซ้ำกัน
    result.motif = [...new Set(result.motif)];
    result.colors = [...new Set(result.colors)];
    result.style = [...new Set(result.style)];
    result.arrangement = [...new Set(result.arrangement)];
    result.detail = [...new Set(result.detail)];


    return result;
}


// แปลง Prompt ภาษาไทย
// ให้เป็น Prompt ที่เหมาะสำหรับ Generative AI
export function processMudmeePrompt(thaiPrompt: string): string {

    const data = findKeywords(thaiPrompt);

    const promptParts = [

        // ประเภทงาน
        "traditional Isan Mudmee silk textile pattern",

        // ลวดลาย
        data.motif.length > 0
            ? data.motif.join(", ")
            : "traditional Isan textile motifs",

        // สี
        data.colors.length > 0
            ? `color palette of ${data.colors.join(" and ")}`
            : "harmonious traditional textile colors",

        // สไตล์
        data.style.length > 0
            ? data.style.join(", ")
            : "authentic Isan textile aesthetic",

        // การจัดวาง
        data.arrangement.length > 0
            ? data.arrangement.join(", ")
            : "balanced repeating composition",

        // รายละเอียด
        data.detail.length > 0
            ? data.detail.join(", ")
            : "intricate woven textile details",

        // ข้อกำหนดเพิ่มเติม
        "flat textile surface",
        "suitable for actual silk weaving",
        "high quality textile design",
    ];


    return promptParts.join(", ");
}