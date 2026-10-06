import sharp from "sharp";

type RGB = {
    r: number;
    g: number;
    b: number;
};

export type PaletteColor = {
    id: string;
    hex: string;
    r: number;
    g: number;
    b: number;
    percentage: number;
};

export type WeavingGrid = string[][];

export type SymmetryResult = {
    score: number;
    passed: boolean;
};

export type ValidationResult = {
    passed: boolean;
    reasons: string[];
    warnings: string[];
    symmetry: SymmetryResult;
};

export type ImageAnalysisResult = {
    width: number;
    height: number;

    originalColorCount: number;

    palette: PaletteColor[];

    grid: WeavingGrid;

    gridSize: {
        rows: number;
        columns: number;
    };

    validation: ValidationResult;
};


/**
 * วิเคราะห์ภาพลายผ้าไหมมัดหมี่
 */
export async function analyzeImage(
    imageBuffer: ArrayBuffer
): Promise<ImageAnalysisResult> {

    const buffer = Buffer.from(imageBuffer);

    const image = sharp(buffer);

    const metadata = await image.metadata();

    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    console.log("Image size:", width, "x", height);


    // =====================================================
    // 1. อ่าน Pixel ของภาพ
    // =====================================================

    const { data, info } = await image
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });


    // =====================================================
    // 2. เก็บสีทั้งหมด
    // =====================================================

    const colors = new Set<string>();

    for (let i = 0; i < data.length; i += info.channels) {

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        colors.add(rgbToHex(r, g, b));
    }

    const originalColorCount = colors.size;

    console.log(
        "Original color count:",
        originalColorCount
    );


    // =====================================================
    // 3. Color Quantization
    // =====================================================

    const targetColors = 6;

    const sampledPixels = samplePixels(
        data,
        info.channels,
        5000
    );

    const paletteRGB = kMeansColorQuantization(
        sampledPixels,
        targetColors,
        10
    );


    // =====================================================
    // 4. สร้าง Color Palette
    // =====================================================

    const palette = createPalette(
        data,
        info.channels,
        paletteRGB
    );

    console.log("Color Palette:", palette);


    // =====================================================
    // 5. สร้าง Grid
    // =====================================================

    const rows = 32;
    const columns = 32;

    const grid = createGrid(
        data,
        info.channels,
        width,
        height,
        paletteRGB,
        rows,
        columns
    );


    console.log(
        "Grid:",
        rows,
        "x",
        columns
    );


    // =====================================================
    // 6. Validation
    // =====================================================

    const validation = validatePattern(
        palette,
        grid,
    );

    console.log(
        "Validation:",
        validation
    );


    return {
        width,
        height,

        originalColorCount,

        palette,

        grid,

        gridSize: {
            rows,
            columns,
        },

        validation,
    };
}


/* =========================================================
   Color Quantization
========================================================= */


/**
 * สุ่มตัวอย่าง Pixel จากภาพ
 * เพื่อไม่ต้องเอา Pixel ทั้งล้านจุดเข้า Algorithm
 */
function samplePixels(
    data: Buffer,
    channels: number,
    maxSamples: number
): RGB[] {

    const pixels: RGB[] = [];

    const totalPixels = Math.floor(
        data.length / channels
    );

    const step = Math.max(
        1,
        Math.floor(totalPixels / maxSamples)
    );


    for (
        let pixelIndex = 0;
        pixelIndex < totalPixels;
        pixelIndex += step
    ) {

        const index = pixelIndex * channels;

        pixels.push({
            r: data[index],
            g: data[index + 1],
            b: data[index + 2],
        });
    }

    return pixels;
}


/**
 * K-Means Color Quantization
 */
function kMeansColorQuantization(
    pixels: RGB[],
    k: number,
    maxIterations: number
): RGB[] {

    if (pixels.length === 0) {
        return [];
    }


    // เลือกสีเริ่มต้นจาก Pixel ที่กระจายกัน
    const centroids: RGB[] = [];

    for (let i = 0; i < k; i++) {

        const index = Math.floor(
            (i / k) * pixels.length
        );

        centroids.push({
            ...pixels[
            Math.min(index, pixels.length - 1)
            ],
        });
    }


    for (
        let iteration = 0;
        iteration < maxIterations;
        iteration++
    ) {

        const groups: RGB[][] = Array.from(
            { length: k },
            () => []
        );


        // ---------------------------------------------
        // จัด Pixel แต่ละจุดเข้า Cluster ที่สีใกล้ที่สุด
        // ---------------------------------------------

        for (const pixel of pixels) {

            let nearestIndex = 0;
            let nearestDistance = Infinity;


            for (let i = 0; i < centroids.length; i++) {

                const distance = colorDistance(
                    pixel,
                    centroids[i]
                );


                if (distance < nearestDistance) {

                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }


            groups[nearestIndex].push(pixel);
        }


        // ---------------------------------------------
        // คำนวณ Centroid ใหม่
        // ---------------------------------------------

        for (let i = 0; i < k; i++) {

            if (groups[i].length === 0) {
                continue;
            }


            let r = 0;
            let g = 0;
            let b = 0;


            for (const pixel of groups[i]) {

                r += pixel.r;
                g += pixel.g;
                b += pixel.b;
            }


            centroids[i] = {
                r: Math.round(
                    r / groups[i].length
                ),

                g: Math.round(
                    g / groups[i].length
                ),

                b: Math.round(
                    b / groups[i].length
                ),
            };
        }
    }


    return centroids;
}


/**
 * คำนวณระยะห่างระหว่างสี 2 สี
 */
function colorDistance(
    color1: RGB,
    color2: RGB
): number {

    const r = color1.r - color2.r;
    const g = color1.g - color2.g;
    const b = color1.b - color2.b;

    return Math.sqrt(
        r * r +
        g * g +
        b * b
    );
}


/* =========================================================
   Color Palette
========================================================= */


/**
 * สร้าง Palette พร้อมคำนวณสัดส่วนของแต่ละสี
 */
function createPalette(
    data: Buffer,
    channels: number,
    paletteRGB: RGB[]
): PaletteColor[] {

    const counts = new Array(
        paletteRGB.length
    ).fill(0);


    const totalPixels = Math.floor(
        data.length / channels
    );


    for (
        let pixelIndex = 0;
        pixelIndex < totalPixels;
        pixelIndex++
    ) {

        const index = pixelIndex * channels;

        const pixel: RGB = {
            r: data[index],
            g: data[index + 1],
            b: data[index + 2],
        };


        let nearestIndex = 0;
        let nearestDistance = Infinity;


        for (
            let paletteIndex = 0;
            paletteIndex < paletteRGB.length;
            paletteIndex++
        ) {

            const distance = colorDistance(
                pixel,
                paletteRGB[paletteIndex]
            );


            if (distance < nearestDistance) {

                nearestDistance = distance;
                nearestIndex = paletteIndex;
            }
        }


        counts[nearestIndex]++;
    }


    const total = totalPixels;


    return paletteRGB.map(
        (color, index) => {

            const percentage =
                (counts[index] / total) * 100;


            return {
                id: String.fromCharCode(
                    65 + index
                ),

                hex: rgbToHex(
                    color.r,
                    color.g,
                    color.b
                ),

                r: color.r,
                g: color.g,
                b: color.b,

                percentage: Number(
                    percentage.toFixed(2)
                ),
            };
        }
    );
}


/* =========================================================
   Grid
========================================================= */


/**
 * แปลงภาพเป็น Grid สำหรับสร้างผังลายทอ
 */
function createGrid(
    data: Buffer,
    channels: number,
    width: number,
    height: number,
    palette: RGB[],
    rows: number,
    columns: number
): WeavingGrid {

    const grid: WeavingGrid = [];


    for (let row = 0; row < rows; row++) {

        const gridRow: string[] = [];


        for (
            let column = 0;
            column < columns;
            column++
        ) {

            // หาจุดกึ่งกลางของ Cell
            const x = Math.floor(
                ((column + 0.5) / columns) * width
            );

            const y = Math.floor(
                ((row + 0.5) / rows) * height
            );


            const safeX = Math.min(
                x,
                width - 1
            );

            const safeY = Math.min(
                y,
                height - 1
            );


            const pixelIndex =
                (safeY * width + safeX)
                * channels;


            const pixel: RGB = {
                r: data[pixelIndex],
                g: data[pixelIndex + 1],
                b: data[pixelIndex + 2],
            };


            // หา Palette สีที่ใกล้ที่สุด
            let nearestIndex = 0;
            let nearestDistance = Infinity;


            for (
                let i = 0;
                i < palette.length;
                i++
            ) {

                const distance =
                    colorDistance(
                        pixel,
                        palette[i]
                    );


                if (
                    distance <
                    nearestDistance
                ) {

                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }


            // A, B, C, D, E, F
            const colorId =
                String.fromCharCode(
                    65 + nearestIndex
                );


            gridRow.push(colorId);
        }


        grid.push(gridRow);
    }


    return grid;
}

//เช็คความสมมาตรของลวดลาย
function calculateSymmetry(
    grid: WeavingGrid
): SymmetryResult {
    const rows = grid.length;

    if (rows === 0) {
        return {
            score: 0,
            passed: false,
        };
    }

    const columns = grid[0].length;

    if (columns === 0) {
        return {
            score: 0,
            passed: false,
        };
    }

    let totalCells = 0;
    let matchingCells = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {

            const mirrorCol =
                columns - 1 - col;

            const current =
                grid[row][col];

            const mirror =
                grid[row][mirrorCol];

            if (current === mirror) {
                matchingCells++;
            }

            totalCells++;
        }
    }

    const score =
        totalCells === 0
            ? 0
            : (matchingCells / totalCells) * 100;

    return {
        score: Number(score.toFixed(2)),
        passed: score >= 80,
    };
}

/* =========================================================
   Validation
========================================================= */


/**
 * ตรวจสอบความเหมาะสมของ Pattern
 */
function validatePattern(
    palette: PaletteColor[],
    grid: WeavingGrid
): ValidationResult {

    const reasons: string[] = [];
    const warnings: string[] = [];
    const symmetry = calculateSymmetry(grid);

    // ---------------------------------------------
    // ตรวจจำนวนสี
    // ---------------------------------------------

    if (palette.length > 8) {

        reasons.push(
            "จำนวนสีมากเกินไป"
        );
    }

    //ตรวจความสมมาตรของลวดลาย

    if (!symmetry.passed) {
        warnings.push(
            `ลายมีความสมมาตรเพียง ${symmetry.score}%`
        );
    }


    // ---------------------------------------------
    // ตรวจสีที่มีสัดส่วนน้อยมาก
    // ---------------------------------------------

    const minorColors =
        palette.filter(
            (color) =>
                color.percentage < 1
        );


    if (minorColors.length > 0) {

        warnings.push(
            "มีสีบางสีปรากฏในสัดส่วนต่ำกว่า 1%"
        );
    }


    // ---------------------------------------------
    // ตรวจขนาด Grid
    // ---------------------------------------------

    if (
        grid.length === 0 ||
        grid[0].length === 0
    ) {

        reasons.push(
            "ไม่สามารถสร้าง Grid ได้"
        );
    }


    // ---------------------------------------------
    // ตรวจความซ้ำของ Pattern
    // ---------------------------------------------

    const uniqueRows = new Set(
        grid.map((row) => row.join(""))
    );


    const rowVariation =
        uniqueRows.size / grid.length;


    if (rowVariation > 0.9) {

        warnings.push(
            "ลวดลายมีความหลากหลายของแถวสูง อาจต้องตรวจสอบก่อนนำไปสร้างผังลายทอ"
        );
    }


    // ---------------------------------------------
    // สรุปผล
    // ---------------------------------------------

    const passed =
        reasons.length === 0;


    return {
        passed,
        reasons,
        warnings,
        symmetry,
    };
}


/* =========================================================
   Utility
========================================================= */


/**
 * RGB → HEX
 */
function rgbToHex(
    r: number,
    g: number,
    b: number
): string {

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