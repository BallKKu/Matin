import sharp from "sharp";

type RGB = {
    r: number;
    g: number;
    b: number;
};

export type ProcessedImage = {
    width: number;
    height: number;
    buffer: Buffer;
};

export type PaletteColor = {
    id: string;
    hex: string;
    r: number;
    g: number;
    b: number;
    percentage: number;
};

export type SymmetryResult = {
    axis: "vertical" | "horizontal";
    score: number;
    passed: boolean;
};

export type WeavingGrid = string[][];

export type WeavingChartResult = {
    gridWidth: number;
    gridHeight: number;
    grid: WeavingGrid;
};

export type ImageProcessingResult = {
    originalWidth: number;
    originalHeight: number;

    processedWidth: number;
    processedHeight: number;

    originalColorCount: number;

    palette: PaletteColor[];

    symmetry: SymmetryResult;

    weavingChart: WeavingChartResult;

    processedImage: Buffer;
};

/**
 * Main Image Processing Pipeline
 */
export async function processImage(
    imageBuffer: ArrayBuffer
): Promise<ImageProcessingResult> {

    const inputBuffer = Buffer.from(imageBuffer);

    /*
     * STEP 1
     * Preprocessing
     */
    const inputMetadata =
        await sharp(inputBuffer).metadata();

    const originalWidth =
        inputMetadata.width ?? 0;

    const originalHeight =
        inputMetadata.height ?? 0;

    const processed = await preprocessImage(
        inputBuffer
    );

    console.log(
        "Processed image:",
        processed.width,
        "x",
        processed.height
    );

    /*
     * STEP 2
     * อ่านข้อมูล Pixel
     */
    const {
        data,
        info,
    } = await sharp(processed.buffer)
        .removeAlpha()
        .raw()
        .toBuffer({
            resolveWithObject: true,
        });

    /*
     * STEP 3
     * นับจำนวนสีต้นฉบับ
     */
    const originalColorCount =
        countUniqueColors(
            data,
            info.channels
        );

    console.log(
        "Original color count:",
        originalColorCount
    );

    /*
     * STEP 4
     * Sample pixels
     */
    const sampledPixels =
        samplePixels(
            data,
            info.channels,
            10000
        );

    /*
     * STEP 5
     * Color Quantization
     */
    const targetColors = 6;

    const paletteRGB =
        kMeansColorQuantization(
            sampledPixels,
            targetColors,
            20
        );

    /*
     * STEP 6
     * สร้าง Palette
     */
    const palette =
        createPalette(
            data,
            info.channels,
            paletteRGB
        );

    const symmetry =
        calculateSymmetry(
            data,
            info.channels,
            processed.width,
            processed.height,
            paletteRGB
        );

    const weavingChart =
        createWeavingGrid(
            data,
            info.channels,
            processed.width,
            processed.height,
            paletteRGB,
            32,
            32
        );

    console.log(
        "Symmetry:",
        symmetry
    );

    console.log(
        "Palette:",
        palette
    );

    console.log(
        "Weaving Chart:",
        weavingChart
    );



    return {
        originalWidth,
        originalHeight,

        processedWidth:
            processed.width,

        processedHeight:
            processed.height,

        originalColorCount,

        palette,

        symmetry,

        weavingChart,

        processedImage:
            processed.buffer,
    };
}


/**
 * STEP 1
 *
 * เตรียมภาพก่อนเข้าสู่
 * Image Processing
 */
async function preprocessImage(
    inputBuffer: Buffer
): Promise<ProcessedImage> {

    const image =
        sharp(inputBuffer);

    const metadata =
        await image.metadata();

    const width =
        metadata.width ?? 0;

    const height =
        metadata.height ?? 0;


    /*
     * กำหนดขนาดมาตรฐาน
     *
     * ใช้ 1024 x 1024
     * เพื่อให้ภาพมีขนาดเท่ากัน
     * ก่อนเข้าสู่ขั้นตอนถัดไป
     */
    const size = 1024;

    const buffer =
        await image
            .resize(size, size, {
                fit: "cover",
                position: "centre",
            })
            .removeAlpha()
            .jpeg({
                quality: 95,
            })
            .toBuffer();

    return {
        width: size,
        height: size,
        buffer,
    };
}


/**
 * นับจำนวนสีที่แตกต่างกัน
 */
function countUniqueColors(
    data: Buffer,
    channels: number
): number {

    const colors =
        new Set<string>();

    for (
        let i = 0;
        i < data.length;
        i += channels
    ) {

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        colors.add(
            rgbToHex(r, g, b)
        );
    }

    return colors.size;
}


/**
 * สุ่ม Pixel
 *
 * ใช้ลดจำนวนข้อมูล
 * ก่อนเข้า K-Means
 */
function samplePixels(
    data: Buffer,
    channels: number,
    maxSamples: number
): RGB[] {

    const pixels: RGB[] = [];

    const totalPixels =
        Math.floor(
            data.length / channels
        );

    const step =
        Math.max(
            1,
            Math.floor(
                totalPixels / maxSamples
            )
        );

    for (
        let pixelIndex = 0;
        pixelIndex < totalPixels;
        pixelIndex += step
    ) {

        const index =
            pixelIndex * channels;

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

    /*
     * Initial Centroids
     */
    const centroids: RGB[] = [];

    for (
        let i = 0;
        i < k;
        i++
    ) {

        const index =
            Math.floor(
                (i / k) *
                pixels.length
            );

        centroids.push({
            ...pixels[
            Math.min(
                index,
                pixels.length - 1
            )
            ],
        });
    }

    /*
     * Iteration
     */
    for (
        let iteration = 0;
        iteration < maxIterations;
        iteration++
    ) {

        const groups: RGB[][] =
            Array.from(
                { length: k },
                () => []
            );

        /*
         * Assign Pixel
         * ให้กับ Centroid ที่ใกล้ที่สุด
         */
        for (const pixel of pixels) {

            let nearestIndex = 0;

            let nearestDistance =
                Infinity;

            for (
                let i = 0;
                i < centroids.length;
                i++
            ) {

                const distance =
                    colorDistance(
                        pixel,
                        centroids[i]
                    );

                if (
                    distance <
                    nearestDistance
                ) {

                    nearestDistance =
                        distance;

                    nearestIndex =
                        i;
                }
            }

            groups[
                nearestIndex
            ].push(pixel);
        }

        /*
         * คำนวณ Centroid ใหม่
         */
        for (
            let i = 0;
            i < k;
            i++
        ) {

            if (
                groups[i].length === 0
            ) {
                continue;
            }

            let r = 0;
            let g = 0;
            let b = 0;

            for (
                const pixel
                of groups[i]
            ) {

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
 * Euclidean Color Distance
 */
function colorDistance(
    color1: RGB,
    color2: RGB
): number {

    const r =
        color1.r - color2.r;

    const g =
        color1.g - color2.g;

    const b =
        color1.b - color2.b;

    return Math.sqrt(
        r * r +
        g * g +
        b * b
    );
}


/**
 * สร้าง Palette
 */
function createPalette(
    data: Buffer,
    channels: number,
    paletteRGB: RGB[]
): PaletteColor[] {

    const counts =
        new Array(
            paletteRGB.length
        ).fill(0);

    const totalPixels =
        Math.floor(
            data.length / channels
        );

    /*
     * Map Pixel → Palette
     */
    for (
        let pixelIndex = 0;
        pixelIndex < totalPixels;
        pixelIndex++
    ) {

        const index =
            pixelIndex * channels;

        const pixel: RGB = {
            r: data[index],
            g: data[index + 1],
            b: data[index + 2],
        };

        let nearestIndex = 0;

        let nearestDistance =
            Infinity;

        for (
            let paletteIndex = 0;
            paletteIndex <
            paletteRGB.length;
            paletteIndex++
        ) {

            const distance =
                colorDistance(
                    pixel,
                    paletteRGB[
                    paletteIndex
                    ]
                );

            if (
                distance <
                nearestDistance
            ) {

                nearestDistance =
                    distance;

                nearestIndex =
                    paletteIndex;
            }
        }

        counts[
            nearestIndex
        ]++;
    }

    /*
     * สร้างข้อมูล Palette
     */
    return paletteRGB.map(
        (color, index) => {

            const percentage =
                (
                    counts[index] /
                    totalPixels
                ) * 100;

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

                percentage:
                    Number(
                        percentage.toFixed(2)
                    ),
            };
        }
    );
}


function calculateSymmetry(
    data: Buffer,
    channels: number,
    width: number,
    height: number,
    palette: RGB[]
): SymmetryResult {

    let matchingPixels = 0;
    let totalPixels = 0;

    /*
     * ตรวจสอบความสมมาตรแนวตั้ง
     *
     * ซ้าย ↔ ขวา
     */

    for (let y = 0; y < height; y++) {

        for (
            let x = 0;
            x < Math.floor(width / 2);
            x++
        ) {

            const mirrorX =
                width - 1 - x;

            const index1 =
                (y * width + x) *
                channels;

            const index2 =
                (y * width + mirrorX) *
                channels;

            const pixel1: RGB = {
                r: data[index1],
                g: data[index1 + 1],
                b: data[index1 + 2],
            };

            const pixel2: RGB = {
                r: data[index2],
                g: data[index2 + 1],
                b: data[index2 + 2],
            };

            const color1 =
                findNearestPaletteColor(
                    pixel1,
                    palette
                );

            const color2 =
                findNearestPaletteColor(
                    pixel2,
                    palette
                );

            if (color1 === color2) {
                matchingPixels++;
            }

            totalPixels++;
        }
    }

    const score =
        totalPixels === 0
            ? 0
            : (matchingPixels / totalPixels) * 100;

    return {
        axis: "vertical",

        score:
            Number(score.toFixed(2)),

        passed:
            score >= 90,
    };
}


function findNearestPaletteColor(
    pixel: RGB,
    palette: RGB[]
): number {

    let nearestIndex = 0;

    let nearestDistance =
        Infinity;

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

            nearestDistance =
                distance;

            nearestIndex =
                i;
        }
    }

    return nearestIndex;
}


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
            .map(
                (value) =>
                    value
                        .toString(16)
                        .padStart(2, "0")
            )
            .join("")
    );
}

function createWeavingGrid(
    data: Buffer,
    channels: number,
    width: number,
    height: number,
    palette: RGB[],
    gridWidth: number,
    gridHeight: number
): WeavingChartResult {

    const grid: WeavingGrid = [];

    const cellWidth = width / gridWidth;
    const cellHeight = height / gridHeight;

    for (let gy = 0; gy < gridHeight; gy++) {

        const row: string[] = [];

        for (let gx = 0; gx < gridWidth; gx++) {

            const startX = Math.floor(
                gx * cellWidth
            );

            const endX = Math.min(
                Math.floor((gx + 1) * cellWidth),
                width
            );

            const startY = Math.floor(
                gy * cellHeight
            );

            const endY = Math.min(
                Math.floor((gy + 1) * cellHeight),
                height
            );

            // นับจำนวน Pixel ของแต่ละสีใน Palette
            const colorCounts =
                new Array(palette.length).fill(0);

            for (
                let y = startY;
                y < endY;
                y++
            ) {

                for (
                    let x = startX;
                    x < endX;
                    x++
                ) {

                    const index =
                        (y * width + x) * channels;

                    const pixel: RGB = {
                        r: data[index],
                        g: data[index + 1],
                        b: data[index + 2],
                    };

                    const paletteIndex =
                        findNearestPaletteColor(
                            pixel,
                            palette
                        );

                    colorCounts[
                        paletteIndex
                    ]++;
                }
            }

            // หาสีที่มีจำนวน Pixel มากที่สุด
            let dominantColorIndex = 0;

            for (
                let i = 1;
                i < colorCounts.length;
                i++
            ) {

                if (
                    colorCounts[i] >
                    colorCounts[dominantColorIndex]
                ) {

                    dominantColorIndex = i;
                }
            }

            const symbol =
                String.fromCharCode(
                    65 + dominantColorIndex
                );

            row.push(symbol);
        }

        grid.push(row);
    }

    return {
        gridWidth,
        gridHeight,
        grid,
    };
}