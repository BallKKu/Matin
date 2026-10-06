import cv2
import numpy as np
import json
import os
import sys

sys.stdout.reconfigure(
    encoding="utf-8"
)

sys.stderr.reconfigure(
    encoding="utf-8"
)

# =========================================================
# SETTINGS
# =========================================================

INPUT_IMAGE = sys.argv[1] if len(sys.argv) > 1 else "python/input9.png"

OUTPUT_DIR = sys.argv[2] if len(sys.argv) > 2 else "public/output"

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

# ---------------------------------------------------------
# OUTPUT FILES
# ---------------------------------------------------------

TILE_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "pattern_tile.png"
)

PIXEL_TILE_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "pattern_tile_pixel.png"
)

MASTER_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "pattern_master_2x2.png"
)

MASTER_PIXEL_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "pattern_master_2x2_pixel.png"
)

MASTER_JSON_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "pattern_master_2x2.json"
)


# =========================================================
# SETTINGS
# =========================================================

# Grid ของ Tile เดียว
GRID_SIZE = 64

# ขนาดของแต่ละช่องตอนวาดเป็นภาพ
CELL_SIZE = 16

# จำนวนสี
K = 3

# ขนาดภาพต้นฉบับที่ใช้ประมวลผล
IMAGE_SIZE = 1024


# =========================================================
# LOAD IMAGE
# =========================================================

print("กำลังโหลดภาพ...")


image = cv2.imread(
    INPUT_IMAGE,
    cv2.IMREAD_COLOR
)


if image is None:

    print(
        "ไม่พบภาพ:",
        INPUT_IMAGE
    )

    exit()


# ปรับขนาดภาพให้เท่ากัน
image = cv2.resize(
    image,
    (
        IMAGE_SIZE,
        IMAGE_SIZE
    )
)


# =========================================================
# COLOR QUANTIZATION
# =========================================================

print("กำลังลดสี...")


data = image.reshape(
    (-1, 3)
).astype(
    np.float32
)


criteria = (
    cv2.TERM_CRITERIA_EPS +
    cv2.TERM_CRITERIA_MAX_ITER,
    30,
    1.0
)


_, labels, centers = cv2.kmeans(
    data,
    K,
    None,
    criteria,
    10,
    cv2.KMEANS_PP_CENTERS
)


centers = np.uint8(
    centers
)


quantized = centers[
    labels.flatten()
]


quantized = quantized.reshape(
    image.shape
)


# =========================================================
# CREATE COLOR MAP
# =========================================================

color_map = []


for i in range(K):

    b, g, r = centers[i]

    color_map.append({

        "id": chr(
            65 + i
        ),

        "r": int(r),

        "g": int(g),

        "b": int(b)

    })


# =========================================================
# CREATE PATTERN TILE
# =========================================================

print("กำลังสร้าง Pattern Tile...")


# ภาพทั้งหมด = 1 หน่วยลาย
tile = quantized.copy()


cv2.imwrite(
    TILE_OUTPUT,
    tile
)


# =========================================================
# CREATE GRID FROM QUANTIZED LABELS
# =========================================================

print("กำลังแปลง Tile เป็น Grid 64×64...")


label_image = labels.reshape(
    IMAGE_SIZE,
    IMAGE_SIZE
)


def create_grid(
    label_image,
    grid_size
):

    height, width = label_image.shape

    cell_height = height // grid_size
    cell_width = width // grid_size

    grid = []

    for gy in range(
        grid_size
    ):

        row = []

        for gx in range(
            grid_size
        ):

            y1 = gy * cell_height
            y2 = (gy + 1) * cell_height

            x1 = gx * cell_width
            x2 = (gx + 1) * cell_width

            # สีของพิกเซลทั้งหมดในช่อง
            cell = label_image[
                y1:y2,
                x1:x2
            ]

            # นับจำนวนแต่ละสี
            counts = np.bincount(
                cell.flatten(),
                minlength=K
            )

            # เลือกสีที่มีจำนวนมากที่สุด
            color_index = int(
                np.argmax(
                    counts
                )
            )

            row.append(
                chr(
                    65 +
                    color_index
                )
            )

        grid.append(
            row
        )

    return grid


tile_grid = create_grid(
    label_image,
    GRID_SIZE
)


# =========================================================
# DRAW PIXEL TILE
# =========================================================

print("กำลังสร้าง Pixel Tile...")


def draw_grid(
    grid,
    centers,
    cell_size
):

    height = len(
        grid
    )

    width = len(
        grid[0]
    )


    canvas = np.zeros(
        (
            height * cell_size,
            width * cell_size,
            3
        ),
        dtype=np.uint8
    )


    for gy in range(
        height
    ):

        for gx in range(
            width
        ):

            symbol = grid[
                gy
            ][
                gx
            ]


            color_index = (
                ord(symbol) -
                65
            )


            b, g, r = centers[
                color_index
            ]


            x1 = (
                gx *
                cell_size
            )

            y1 = (
                gy *
                cell_size
            )

            x2 = (
                x1 +
                cell_size
            )

            y2 = (
                y1 +
                cell_size
            )


            # สีของช่อง
            cv2.rectangle(
                canvas,

                (
                    x1,
                    y1
                ),

                (
                    x2,
                    y2
                ),

                (
                    int(b),
                    int(g),
                    int(r)
                ),

                -1
            )


            # เส้นช่อง
            cv2.rectangle(
                canvas,

                (
                    x1,
                    y1
                ),

                (
                    x2,
                    y2
                ),

                (
                    50,
                    50,
                    50
                ),

                1
            )


    return canvas


pixel_tile = draw_grid(
    tile_grid,
    centers,
    CELL_SIZE
)


cv2.imwrite(
    PIXEL_TILE_OUTPUT,
    pixel_tile
)


# =========================================================
# CREATE MASTER PATTERN FROM GRID
# =========================================================

print("กำลังสร้าง Master Pattern 2×2...")


# ---------------------------------------------------------
# Mirror ซ้าย → ขวา
# ---------------------------------------------------------

grid_mirror = []


for row in tile_grid:

    mirror_row = (
        row +
        row[::-1]
    )


    grid_mirror.append(
        mirror_row
    )


# ---------------------------------------------------------
# Mirror บน → ล่าง
# ---------------------------------------------------------

master_grid = []


# ส่วนบน
for row in grid_mirror:

    master_grid.append(
        row
    )


# ส่วนล่าง
for row in reversed(
    grid_mirror
):

    master_grid.append(
        row
    )


# =========================================================
# DRAW MASTER PATTERN
# =========================================================

print("กำลังวาด Master Pattern...")


master_pixel = draw_grid(
    master_grid,
    centers,
    CELL_SIZE
)


cv2.imwrite(
    MASTER_PIXEL_OUTPUT,
    master_pixel
)


# =========================================================
# CREATE LARGE MASTER IMAGE
# =========================================================

print("กำลังสร้างภาพ Master Pattern...")


# Master Grid มีขนาด 128×128
# ดังนั้นภาพจะมีขนาด 2048×2048

master_image = master_pixel.copy()


cv2.imwrite(
    MASTER_OUTPUT,
    master_image
)


# =========================================================
# SAVE JSON
# =========================================================

print("กำลังบันทึก JSON...")


result = {

    "tileWidth": tile.shape[1],

    "tileHeight": tile.shape[0],

    "gridWidth": GRID_SIZE,

    "gridHeight": GRID_SIZE,

    "repeatWidth": len(
        master_grid[0]
    ),

    "repeatHeight": len(
        master_grid
    ),

    "palette": color_map,

    "grid": tile_grid,

    "repeatGrid": master_grid

}


with open(
    MASTER_JSON_OUTPUT,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        result,
        file,
        ensure_ascii=False,
        indent=2
    )


# =========================================================
# DONE
# =========================================================

print()
print("================================")
print("สร้าง Pattern สำเร็จ")
print("================================")
print(
    "- pattern_tile.png"
)
print(
    "- pattern_tile_pixel.png"
)
print(
    "- pattern_master_2x2.png"
)
print(
    "- pattern_master_2x2_pixel.png"
)
print(
    "- pattern_master_2x2.json"
)
print()
print(
    "Tile Grid:",
    GRID_SIZE,
    "×",
    GRID_SIZE
)
print(
    "Master Grid:",
    len(master_grid[0]),
    "×",
    len(master_grid)
)
print()
