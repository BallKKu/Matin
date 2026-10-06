"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { saveDemoDesign } from "@/lib/demo-designs";

// =========================================================
// TYPES
// =========================================================

type PaletteColor = {
    id: string;
    r: number;
    g: number;
    b: number;
};

type PatternFiles = {
    tile: string;
    tilePixel: string;
    master: string;
    masterPixel: string;
    json: string;
};

type AnalysisResult = {
    tileWidth: number;
    tileHeight: number;

    gridWidth: number;
    gridHeight: number;

    repeatWidth: number;
    repeatHeight: number;

    palette: PaletteColor[];

    grid: string[][];
    repeatGrid: string[][];

    files: PatternFiles;
};

// =========================================================
// RGB → HEX
// =========================================================

function rgbToHex(
    r: number,
    g: number,
    b: number
) {
    return (
        "#" +
        [r, g, b]
            .map((value) =>
                value
                    .toString(16)
                    .padStart(2, "0")
            )
            .join("")
    );
}

const keywordGroups = [
    { title: "ลวดลาย", items: ["ดอกคูน", "ดอกไม้", "ลายขิด", "พญานาค", "ช้าง", "นก", "ลายเรขาคณิต"] },
    { title: "สี", items: ["สีคราม", "สีน้ำเงิน", "สีแดง", "สีเหลืองทอง", "สีครีม", "สีเขียว", "สีม่วง"] },
    { title: "สไตล์", items: ["อีสานดั้งเดิม", "อีสานร่วมสมัย", "พื้นบ้าน", "โมเดิร์น"] },
    { title: "การจัดวาง", items: ["สมมาตร", "ลายซ้ำ", "เรียงเป็นแถว", "ลายเต็มผืน", "ลายขอบ"] },
    { title: "รายละเอียด", items: ["ประณีต", "เรียบง่าย", "ซับซ้อน", "ลายเล็ก", "ลายใหญ่", "โปร่ง"] },
];

const silkColors = [
    { name: "คราม", hex: "#263b74" },
    { name: "น้ำเงิน", hex: "#2563a6" },
    { name: "แดงชาด", hex: "#b83232" },
    { name: "เหลืองทอง", hex: "#d6a62e" },
    { name: "ครีม", hex: "#eadbb9" },
    { name: "เขียวใบไม้", hex: "#47734c" },
    { name: "ม่วง", hex: "#76518e" },
    { name: "ดำ", hex: "#28231f" },
];
type DesignMode = "text" | "keywords" | "upload";

// =========================================================
// PAGE
// =========================================================

export default function Home() {

    const router = useRouter();

    const supabase = createClient();

    // =======================================================
    // STATES
    // =======================================================

    const [prompt, setPrompt] =
        useState("");

    const [mode, setMode] = useState<DesignMode>("text");

    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

    const [selectedColors, setSelectedColors] = useState<string[]>([]);

    const [colorDraft, setColorDraft] = useState("#263b74");

    const [customColors, setCustomColors] = useState<{ name: string; hex: string }[]>([]);

    useEffect(() => {
        const search = new URLSearchParams(window.location.search);
        const requestedMode = search.get("mode");
        const requestedPrompt = search.get("prompt");
        if (requestedPrompt) window.requestAnimationFrame(() => setPrompt(requestedPrompt));
        if (requestedMode === "text" || requestedMode === "keywords" || requestedMode === "upload") {
            const frame = window.requestAnimationFrame(() => setMode(requestedMode));
            return () => window.cancelAnimationFrame(frame);
        }
    }, []);

    const [imageUrl, setImageUrl] =
        useState("");

    const [analysis, setAnalysis] =
        useState<AnalysisResult | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [uploadPreview, setUploadPreview] =
        useState("");
    const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState("");
    const [savedMessage, setSavedMessage] = useState("");


    // =======================================================
    // FILE CHANGE
    // =======================================================

    function handleFileChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setSelectedFile(
            file
        );

        const previewUrl =
            URL.createObjectURL(
                file
            );

        setUploadPreview(
            previewUrl
        );

        setImageUrl(
            previewUrl
        );

        setAnalysis(
            null
        );

        setError(
            ""
        );
    }


    // =======================================================
    // GENERATE AI
    // =======================================================

    async function handleGenerate() {

        const basePrompt = mode === "keywords"
            ? selectedKeywords.join(" ")
            : mode === "upload"
                ? prompt.trim() || "ลายผ้าไหมมัดหมี่อีสาน ลวดลายประณีต สีสันกลมกลืน เหมาะสำหรับการทอผ้าไหม"
                : prompt;

        if (selectedColors.length !== 3) {
            setError("กรุณาเลือกสีให้ครบ 3 สีพอดีก่อนสร้างลาย");
            return;
        }

        const generationPrompt = `${basePrompt}. Use exactly these three colors as the silk thread palette: ${selectedColors.join(", ")}. Keep these colors visually faithful.`;

        if (mode !== "upload" && basePrompt.trim() === "") {

            setError(
                mode === "keywords"
                    ? "กรุณาเลือกคีย์เวิร์ดอย่างน้อยหนึ่งรายการ"
                    : "กรุณาอธิบายลายผ้าที่ต้องการ"
            );

            return;
        }

        if (mode === "upload" && !selectedFile) {
            setError("กรุณาเลือกรูปภาพก่อนสร้างลาย");
            return;
        }

        setLoading(
            true
        );

        setError(
            ""
        );

        setImageUrl(
            ""
        );

        setAnalysis(
            null
        );

        try {

            // ---------------------------------------------------
            // สร้างภาพด้วย AI
            // ---------------------------------------------------

            const requestBody = mode === "upload"
                ? (() => {
                    const body = new FormData();
                    body.append("prompt", generationPrompt);
                    if (selectedFile) body.append("image", selectedFile);
                    return body;
                })()
                : JSON.stringify({ prompt: generationPrompt });

            const response = await fetch("/api/generate", {
                method: "POST",
                ...(mode !== "upload" && { headers: { "Content-Type": "application/json" } }),
                body: requestBody,
            });


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "สร้างภาพไม่สำเร็จ"
                );
            }


            // ---------------------------------------------------
            // แสดงภาพ AI
            // ---------------------------------------------------

            setImageUrl(
                data.image
            );
            setLastGeneratedPrompt(generationPrompt);


            // ---------------------------------------------------
            // ส่งภาพ AI ไปให้ Python วิเคราะห์ต่อ
            // ---------------------------------------------------

            const blob =
                await fetch(data.image)
                    .then((res) =>
                        res.blob()
                    );


            const generatedFile =
                new File(
                    [blob],
                    "generated-pattern.jpg",
                    {
                        type: "image/jpeg",
                    }
                );


            const formData =
                new FormData();


            formData.append(
                "image",
                generatedFile
            );


            // ---------------------------------------------------
            // ส่งเข้า Python Image Processing
            // ---------------------------------------------------

            const processResponse =
                await fetch(
                    "/api/process-image",
                    {
                        method: "POST",
                        body: formData,
                    }
                );


            const processData =
                await processResponse.json();


            if (!processResponse.ok) {

                throw new Error(
                    processData.error ||
                    "วิเคราะห์ภาพไม่สำเร็จ"
                );
            }


            // ---------------------------------------------------
            // เก็บผลการวิเคราะห์
            // ---------------------------------------------------

            console.log(
                "AI Python Result:",
                processData
            );


            setAnalysis(
                processData
            );


        } catch (error) {

            console.error(
                error
            );


            setError(
                error instanceof Error
                    ? error.message
                    : "เกิดข้อผิดพลาด"
            );


        } finally {

            setLoading(
                false
            );
        }
    }


    // =======================================================
    // ANALYZE UPLOADED IMAGE
    // =======================================================

    async function handleAnalyze() {

        if (!selectedFile) {

            setError(
                "กรุณาเลือกรูปภาพ"
            );

            return;
        }


        setLoading(
            true
        );

        setError(
            ""
        );

        setAnalysis(
            null
        );


        try {

            // ---------------------------------------------------
            // FormData
            // ---------------------------------------------------

            const formData =
                new FormData();


            formData.append(
                "image",
                selectedFile
            );


            // ---------------------------------------------------
            // ส่งไป Next.js API
            // ---------------------------------------------------

            const response =
                await fetch(
                    "/api/process-image",
                    {
                        method: "POST",
                        body: formData,
                    }
                );


            const data =
                await response.json();


            // ---------------------------------------------------
            // Error
            // ---------------------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "ประมวลผลรูปภาพไม่สำเร็จ"
                );
            }


            // ---------------------------------------------------
            // ดูข้อมูลใน Console
            // ---------------------------------------------------

            console.log(
                "Python Result:",
                data
            );


            // ---------------------------------------------------
            // เก็บผลลัพธ์
            // ---------------------------------------------------

            setAnalysis(
                data
            );


            // แสดงรูปที่ Upload
            setImageUrl(
                uploadPreview
            );


        } catch (error) {

            console.error(
                error
            );


            setError(
                error instanceof Error
                    ? error.message
                    : "เกิดข้อผิดพลาด"
            );


        } finally {

            setLoading(
                false
            );
        }
    }


    // =======================================================
    // LOGOUT
    // =======================================================

    async function handleLogout() {

        await supabase.auth.signOut();

        router.push(
            "/login"
        );

        router.refresh();
    }


    // =======================================================
    // RETURN
    // =======================================================

    return (

        <main className="min-h-screen bg-orange-50 text-stone-800">

            <div className="mx-auto max-w-6xl">

                {/* =================================================
                    CONTENT
                ================================================= */}

                <div className="px-6 py-10">

                    <div className="mx-auto max-w-6xl">


                        {/* =================================================
                            HEADER
                        ================================================= */}

                        <header className="mb-10 text-center">

                            <p className="mb-2 text-sm font-medium tracking-widest text-orange-700">
                                MUDMEE AI STUDIO
                            </p>


                            <h1 className="text-4xl font-bold">
                                ออกแบบลายผ้าไหมมัดหมี่
                            </h1>


                            <p className="mt-3 text-stone-600">
                                สร้างสรรค์ลวดลายผ้าไหมด้วย Generative AI
                            </p>

                        </header>


                        <div id="design-tools" className="mb-6 grid grid-cols-1 gap-3 rounded-2xl bg-orange-100/70 p-2 sm:grid-cols-3" role="tablist" aria-label="วิธีออกแบบลายผ้า">
                            {([
                                ["text", "✎", "ข้อความ"],
                                ["keywords", "✿", "คีย์เวิร์ด"],
                                ["upload", "↑", "อัปโหลดรูป"],
                            ] as const).map(([value, icon, label]) => (
                                <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => { setMode(value); setError(""); }} className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === value ? "bg-white text-orange-900 shadow-sm" : "text-stone-600 hover:bg-white/60"}`}>
                                    <span className="mr-2">{icon}</span>{label}
                                </button>
                            ))}
                        </div>

                        {/* =================================================
                            PROMPT
                        ================================================= */}

                        {mode === "text" && <section id="prompt-mode" className="rounded-2xl bg-white p-6 shadow-lg">

                            <h2 className="mb-3 text-xl font-semibold">
                                อธิบายลายผ้าที่ต้องการ
                            </h2>


                            <textarea
                                value={prompt}
                                onChange={(e) =>
                                    setPrompt(
                                        e.target.value
                                    )
                                }
                                placeholder="เช่น ลายดอกคูน สีครามและสีเหลืองทอง สไตล์อีสานร่วมสมัย"
                                className="h-32 w-full rounded-xl border border-orange-200 p-4 outline-none focus:ring-2 focus:ring-orange-300"
                            />


                        </section>}

                        {mode === "keywords" && <section id="keywords-mode" className="space-y-4 rounded-2xl bg-white p-6 shadow-lg">
                            <div>
                                <h2 className="text-xl font-semibold">สร้างลายจากคีย์เวิร์ด</h2>
                                <p className="mt-1 text-sm text-stone-500">เลือกได้หลายคำ ระบบจะนำทุกตัวเลือกไปประกอบเป็นคำสั่งสร้างภาพ</p>
                            </div>
                            {keywordGroups.map((group) => <div key={group.title}>
                                <h3 className="mb-2 text-sm font-semibold text-stone-700">{group.title}</h3>
                                <div className="flex flex-wrap gap-2">{group.items.map((keyword) => {
                                    const active = selectedKeywords.includes(keyword);
                                    return <button key={keyword} type="button" aria-pressed={active} onClick={() => setSelectedKeywords((items) => active ? items.filter((item) => item !== keyword) : [...items, keyword])} className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-orange-800 bg-orange-800 text-white" : "border-stone-200 bg-[#fcfbf8] text-stone-700 hover:border-orange-300 hover:bg-orange-50"}`}>{keyword}</button>;
                                })}</div>
                            </div>)}
                            <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
                                <span className="mr-1 text-sm font-medium">เลือกแล้ว:</span>
                                {selectedKeywords.length ? selectedKeywords.map((keyword) => <button key={keyword} type="button" onClick={() => setSelectedKeywords((items) => items.filter((item) => item !== keyword))} className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-900">{keyword} ×</button>) : <span className="text-sm text-stone-400">ยังไม่ได้เลือกคีย์เวิร์ด</span>}
                                <button type="button" onClick={() => setSelectedKeywords(keywordGroups.map((group) => group.items[Math.floor(Math.random() * group.items.length)]))} className="ml-auto text-sm font-medium text-orange-800 hover:text-orange-950">⤨ สุ่มไอเดีย</button>
                            </div>
                        </section>}


                        {/* =================================================
                            UPLOAD IMAGE
                        ================================================= */}

                        {mode === "upload" && <section id="upload-mode" className="mt-6 rounded-2xl bg-white p-6 shadow-lg">

                            <h2 className="mb-3 text-xl font-semibold">
                                อัปโหลดรูปตั้งต้นเพื่อสร้างลายใหม่
                            </h2>


                            <label
                                htmlFor="image-upload"
                                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-8 text-center transition hover:bg-orange-100"
                            >

                                <div className="text-4xl">
                                    📁
                                </div>


                                <p className="mt-3 font-semibold">
                                    คลิกเพื่อเลือกรูปภาพ
                                </p>


                                <p className="mt-1 text-sm text-stone-500">
                                    รองรับ JPG, JPEG และ PNG ขนาดไม่เกิน 8 MB
                                </p>


                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    onChange={
                                        handleFileChange
                                    }
                                    className="hidden"
                                />

                            </label>


                            {/* -------------------------------------------------
                                Selected File
                            ------------------------------------------------- */}

                            {selectedFile && (

                                <div className="mt-4">

                                    <p className="text-sm font-medium">
                                        ไฟล์ที่เลือก:
                                    </p>


                                    <p className="mt-1 text-sm text-stone-500">
                                        {selectedFile.name}
                                    </p>


                                    {uploadPreview && (

                                        <img
                                            src={
                                                uploadPreview
                                            }
                                            alt="ตัวอย่างรูปที่อัปโหลด"
                                            className="mx-auto mt-4 max-h-80 rounded-xl object-contain shadow"
                                        />

                                    )}


                                </div>

                            )}

                        </section>}

                        {mode === "upload" && <section className="mt-4 rounded-2xl bg-white p-6 shadow-lg">
                            <label htmlFor="image-prompt" className="mb-2 block text-sm font-semibold">คำอธิบายเพิ่มเติม <span className="font-normal text-stone-500">(ไม่บังคับ)</span></label>
                            <textarea id="image-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="เช่น เปลี่ยนเป็นโทนสีคราม เพิ่มลายดอกคูนแบบสมมาตร" className="h-24 w-full rounded-xl border border-orange-200 p-4 outline-none focus:ring-2 focus:ring-orange-300" />
                        </section>}

                        <section className="mt-4 rounded-2xl bg-white p-6 shadow-lg">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold">เลือกสีไหม</h2>
                                    <p className="mt-1 text-sm text-stone-500">แตะสีที่ชอบ เลือกให้ครบ 3 สี สีแรกจะเป็นสีพื้น</p>
                                </div>
                                <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${selectedColors.length === 3 ? "bg-emerald-50 text-emerald-800" : "bg-orange-50 text-orange-900"}`}>เลือกแล้ว {selectedColors.length}/3</span>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {[...silkColors, ...customColors].map((color) => {
                                    const selectedIndex = selectedColors.indexOf(color.hex);
                                    const isSelected = selectedIndex !== -1;
                                    const isFull = selectedColors.length === 3;
                                    const isCustom = customColors.some((customColor) => customColor.hex === color.hex);
                                    return <div key={color.hex} className="relative">
                                        <button type="button" aria-pressed={isSelected} disabled={!isSelected && isFull} onClick={() => setSelectedColors((current) => isSelected ? current.filter((item) => item !== color.hex) : current.length < 3 ? [...current, color.hex] : current)} className={`flex w-full items-center gap-2 rounded-xl border p-2 text-left text-sm transition ${isSelected ? "border-orange-800 bg-orange-50 ring-1 ring-orange-800" : "border-stone-200 hover:border-orange-400"} disabled:cursor-not-allowed disabled:opacity-40`}>
                                            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-black/10" style={{ backgroundColor: color.hex }}>{isSelected && <span className="font-bold text-white drop-shadow">✓</span>}</span>
                                            <span className="min-w-0"><span className="block font-medium">{color.name}</span><span className="text-[10px] text-stone-500">{isSelected ? `สีลำดับ ${selectedIndex + 1}` : "แตะเพื่อเลือก"}</span></span>
                                        </button>
                                        {isCustom && <button type="button" onClick={() => { setCustomColors((current) => current.filter((item) => item.hex !== color.hex)); setSelectedColors((current) => current.filter((item) => item !== color.hex)); }} aria-label={`ลบสีที่เพิ่ม ${color.name}`} className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full border border-stone-200 bg-white text-sm text-stone-500 shadow-sm hover:text-red-700">×</button>}
                                    </div>;
                                })}
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
                                <span className="text-sm font-medium">เพิ่มสี</span>
                                <label className="flex items-center gap-2 text-xs text-stone-600">เลือกสีใหม่<input type="color" value={colorDraft} onChange={(event) => setColorDraft(event.target.value)} className="size-9 cursor-pointer rounded-lg border border-stone-200 bg-white p-1" /></label>
                                <button type="button" onClick={() => { if ([...silkColors, ...customColors].some((color) => color.hex.toLowerCase() === colorDraft.toLowerCase())) return; setCustomColors((current) => [...current, { name: `สีใหม่ ${colorDraft.toUpperCase()}`, hex: colorDraft }]); }} className="inline-flex items-center gap-1 rounded-full border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-900 transition hover:bg-orange-50"><span aria-hidden="true" className="text-lg leading-none">+</span> เพิ่มสีนี้</button>
                                <span className="text-xs text-stone-500">สีเดิมยังอยู่ และกด × บนสีที่เพิ่มเพื่อลบได้</span>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
                                <span className="text-xs text-stone-500">สีที่เลือก:</span>
                                {selectedColors.length ? selectedColors.map((hex, index) => <span key={hex} className="inline-flex items-center gap-2 rounded-full bg-stone-100 py-1 pl-2 pr-1 text-xs text-stone-700"><span className="size-5 rounded-full border border-black/10" style={{ backgroundColor: hex }} />{index + 1}. {[...silkColors, ...customColors].find((color) => color.hex === hex)?.name ?? hex}<button type="button" onClick={() => setSelectedColors((current) => current.filter((color) => color !== hex))} className="ml-1 grid size-5 place-items-center rounded-full text-stone-500 hover:bg-white hover:text-red-700" aria-label={`ลบสี ${hex}`}>×</button></span>) : <span className="text-xs text-stone-500">แตะเลือกสีจากตัวเลือกด้านบนได้เลย</span>}
                            </div>
                        </section>
<button type="button" onClick={handleGenerate} disabled={loading} className="mt-4 w-full rounded-xl bg-orange-700 py-3 font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50">
                            {loading ? "กำลังสร้างและวิเคราะห์ลายผ้า..." : mode === "upload" ? "✦ สร้างลายใหม่จากรูป" : "✨ สร้างลายผ้าด้วย AI"}
                        </button>

                        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}


                        {/* =================================================
                            RESULT
                        ================================================= */}

                        <section id="weaving-chart" className="mt-6 rounded-2xl bg-white p-6 shadow-lg">


                            {/* =================================================
                                LOADING
                            ================================================= */}

                            {loading ? (

                                <div className="flex min-h-96 items-center justify-center text-center">

                                    <div>

                                        <div className="text-4xl">
                                            ✨
                                        </div>


                                        <p className="mt-4 font-semibold">
                                            กำลังประมวลผล...
                                        </p>


                                        <p className="mt-2 text-sm text-stone-500">
                                            กำลังสร้างและวิเคราะห์ลวดลาย
                                        </p>

                                    </div>

                                </div>


                            ) : error ? (

                                /* =================================================
                                   ERROR
                                ================================================= */

                                <div className="flex min-h-96 items-center justify-center text-center">

                                    <div>

                                        <p className="font-semibold text-red-600">
                                            เกิดข้อผิดพลาด
                                        </p>


                                        <p className="mt-2 text-sm text-stone-600">
                                            {error}
                                        </p>

                                    </div>

                                </div>


                            ) : imageUrl ? (

                                /* =================================================
                                   RESULT CONTENT
                                ================================================= */

                                <div>


                                    {/* =================================================
                                        ORIGINAL IMAGE
                                    ================================================= */}

                                    <div className="text-center">

                                        <h2 className="mb-4 text-2xl font-bold">
                                            ภาพต้นแบบ
                                        </h2>


                                        <img
                                            src={
                                                imageUrl
                                            }
                                            alt="ลายผ้าไหมมัดหมี่"
                                            className="mx-auto max-h-[500px] rounded-xl object-contain shadow"
                                        />

                                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                                            <button type="button" onClick={async () => {
                                                try {
                                                    saveDemoDesign({ image: imageUrl, prompt: lastGeneratedPrompt, colors: selectedColors });
                                                    setSavedMessage("บันทึกลายไว้ในผลงานเดโมแล้ว");
                                                    window.setTimeout(() => setSavedMessage(""), 3000);
                                                } catch (saveError) {
                                                    setSavedMessage(saveError instanceof Error ? saveError.message : "บันทึกไม่สำเร็จ");
                                                }
                                            }} className="rounded-full bg-orange-800 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-900">♡ บันทึกลายนี้</button>
                                            <a href="/my-designs" className="rounded-full border border-orange-300 px-5 py-3 text-sm font-semibold text-orange-900 hover:bg-orange-50">ดูผลงานที่บันทึก</a>
                                        </div>
                                        {savedMessage && <p role="status" className="mt-2 text-sm text-emerald-700">{savedMessage}</p>}

                                    </div>


                                    {/* =================================================
                                        ANALYSIS
                                    ================================================= */}

                                    {analysis && (

                                        <div className="mt-10 space-y-8">


                                            {/* =================================================
                                                PATTERN INFORMATION
                                            ================================================= */}

                                            <section>

                                                <h2 className="mb-4 text-xl font-bold">
                                                    📊 ข้อมูล Pattern
                                                </h2>


                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">


                                                    {/* Tile */}

                                                    <div className="rounded-xl bg-orange-50 p-4">

                                                        <p className="text-sm text-stone-500">
                                                            ขนาดภาพต้นแบบ
                                                        </p>


                                                        <p className="mt-1 text-lg font-bold">

                                                            {analysis.tileWidth}
                                                            {" × "}
                                                            {analysis.tileHeight}

                                                        </p>

                                                    </div>


                                                    {/* Grid */}

                                                    <div className="rounded-xl bg-orange-50 p-4">

                                                        <p className="text-sm text-stone-500">
                                                            Grid
                                                        </p>


                                                        <p className="mt-1 text-lg font-bold">

                                                            {analysis.gridHeight}
                                                            {" × "}
                                                            {analysis.gridWidth}

                                                        </p>

                                                    </div>


                                                    {/* Repeat */}

                                                    <div className="rounded-xl bg-orange-50 p-4">

                                                        <p className="text-sm text-stone-500">
                                                            Grid หลัง Repeat
                                                        </p>


                                                        <p className="mt-1 text-lg font-bold">

                                                            {analysis.repeatHeight}
                                                            {" × "}
                                                            {analysis.repeatWidth}

                                                        </p>

                                                    </div>

                                                </div>

                                            </section>


                                            {/* =================================================
                                                COLOR PALETTE
                                            ================================================= */}

                                            <section>

                                                <h2 className="mb-4 text-xl font-bold">
                                                    🎨 Color Palette
                                                </h2>


                                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

                                                    {analysis.palette.map(
                                                        (color) => {

                                                            const hex =
                                                                rgbToHex(
                                                                    color.r,
                                                                    color.g,
                                                                    color.b
                                                                );


                                                            return (

                                                                <div
                                                                    key={
                                                                        color.id
                                                                    }
                                                                    className="overflow-hidden rounded-xl border bg-white"
                                                                >

                                                                    <div
                                                                        className="h-20"
                                                                        style={{
                                                                            backgroundColor:
                                                                                hex
                                                                        }}
                                                                    />


                                                                    <div className="p-3">

                                                                        <p className="font-bold">
                                                                            สี{" "}
                                                                            {color.id}
                                                                        </p>


                                                                        <p className="text-sm text-stone-500">
                                                                            {hex}
                                                                        </p>

                                                                    </div>

                                                                </div>

                                                            );

                                                        }
                                                    )}

                                                </div>

                                            </section>


                                            {/* =================================================
                                                PYTHON OUTPUT IMAGES
                                            ================================================= */}

                                            <section>

                                                <h2 className="mb-4 text-xl font-bold">
                                                    🖼️ ผลลัพธ์จาก Image Processing
                                                </h2>


                                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">


                                                    {/* Tile */}

                                                    <div>

                                                        <h3 className="mb-3 font-semibold">
                                                            Pattern Tile
                                                        </h3>


                                                        <img
                                                            src={
                                                                analysis.files.tile
                                                            }
                                                            alt="Pattern Tile"
                                                            className="w-full rounded-xl border shadow"
                                                        />

                                                    </div>


                                                    {/* Tile Grid */}

                                                    <div>

                                                        <h3 className="mb-3 font-semibold">
                                                            Pattern Tile Grid
                                                        </h3>


                                                        <img
                                                            src={
                                                                analysis.files.tilePixel
                                                            }
                                                            alt="Pattern Tile Grid"
                                                            className="w-full rounded-xl border shadow"
                                                        />

                                                    </div>


                                                    {/* Master */}

                                                    <div>

                                                        <h3 className="mb-3 font-semibold">
                                                            Master Pattern 2×2
                                                        </h3>


                                                        <img
                                                            src={
                                                                analysis.files.master
                                                            }
                                                            alt="Master Pattern"
                                                            className="w-full rounded-xl border shadow"
                                                        />

                                                    </div>


                                                    {/* Master Grid */}

                                                    <div>

                                                        <h3 className="mb-3 font-semibold">
                                                            Master Pattern Grid
                                                        </h3>


                                                        <img
                                                            src={
                                                                analysis.files.masterPixel
                                                            }
                                                            alt="Master Pattern Grid"
                                                            className="w-full rounded-xl border shadow"
                                                        />

                                                    </div>

                                                </div>

                                            </section>


                                            {/* =================================================
                                                WEAVING CHART
                                            ================================================= */}

                                            <section>

                                                <h2 className="mb-4 text-xl font-bold">
                                                    🧵 Weaving Chart
                                                </h2>


                                                <p className="mb-4 text-sm text-stone-500">

                                                    ผังลายทอที่สร้างจากการแปลงโครงสร้างลวดลายเป็น Grid{" "}

                                                    {analysis.gridHeight}
                                                    {" × "}
                                                    {analysis.gridWidth}

                                                </p>


                                                <div className="overflow-auto rounded-xl border bg-stone-50 p-4">


                                                    <div
                                                        className="mx-auto grid"
                                                        style={{

                                                            gridTemplateColumns:
                                                                `repeat(${analysis.gridWidth}, minmax(6px, 1fr))`,

                                                            maxWidth:
                                                                "1000px",

                                                        }}
                                                    >

                                                        {analysis.grid.flatMap(
                                                            (
                                                                row,
                                                                rowIndex
                                                            ) =>

                                                                row.map(
                                                                    (
                                                                        cell,
                                                                        columnIndex
                                                                    ) => {

                                                                        const color =
                                                                            analysis.palette.find(
                                                                                (item) =>
                                                                                    item.id ===
                                                                                    cell
                                                                            );


                                                                        return (

                                                                            <div
                                                                                key={`${rowIndex}-${columnIndex}`}
                                                                                title={`สี ${cell}`}
                                                                                className="aspect-square border-[0.5px] border-white/40"
                                                                                style={{
                                                                                    backgroundColor:
                                                                                        color
                                                                                            ? rgbToHex(
                                                                                                color.r,
                                                                                                color.g,
                                                                                                color.b
                                                                                            )
                                                                                            : "#ffffff",
                                                                                }}
                                                                            />

                                                                        );

                                                                    }
                                                                )
                                                        )}

                                                    </div>

                                                </div>


                                                {/* =================================================
                                                    GRID LEGEND
                                                ================================================= */}

                                                <div className="mt-4 flex flex-wrap justify-center gap-4">

                                                    {analysis.palette.map(
                                                        (color) => (

                                                            <div
                                                                key={
                                                                    color.id
                                                                }
                                                                className="flex items-center gap-2"
                                                            >

                                                                <span
                                                                    className="h-5 w-5 rounded border"
                                                                    style={{
                                                                        backgroundColor:
                                                                            rgbToHex(
                                                                                color.r,
                                                                                color.g,
                                                                                color.b
                                                                            ),
                                                                    }}
                                                                />


                                                                <span className="text-sm">
                                                                    {color.id}
                                                                </span>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            </section>

                                        </div>

                                    )}

                                </div>


                            ) : (

                                /* =================================================
                                   EMPTY
                                ================================================= */

                                <div className="flex min-h-96 items-center justify-center">

                                    <p className="text-stone-400">
                                        ภาพลายผ้าที่สร้างโดย AI จะแสดงตรงนี้
                                    </p>

                                </div>

                            )}

                        </section>

                    </div>

                </div>

            </div>

        </main>
    );
}
