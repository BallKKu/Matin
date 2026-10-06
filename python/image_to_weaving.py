import cv2
import numpy as np
import json


INPUT_IMAGE = "python/input.png"
EDGE_IMAGE = "symmetric_edge.png"

OUTPUT_32 = "weaving_chart_32.png"
OUTPUT_64 = "weaving_chart_64.png"
OUTPUT_128 = "weaving_chart_128.png"
OUTPUT_256 = "weaving_chart_256.png"
OUTPUT_JSON = "weaving_chart.json"


# -------------------------
# อ่านภาพ
# -------------------------

image = cv2.imread(
    INPUT_IMAGE,
    cv2.IMREAD_COLOR
)

edges = cv2.imread(
    EDGE_IMAGE,
    cv2.IMREAD_GRAYSCALE
)

if image is None:
    print("ไม่พบภาพ:", INPUT_IMAGE)
    exit()

if edges is None:
    print("ไม่พบภาพ:", EDGE_IMAGE)
    exit()


# -------------------------
# ปรับขนาดให้ตรงกัน
# -------------------------

image = cv2.resize(
    image,
    (1024, 1024)
)

edges = cv2.resize(
    edges,
    (1024, 1024)
)


# -------------------------
# ลดสีของภาพ
# -------------------------

data = image.reshape(
    (-1, 3)
).astype(np.float32)


criteria = (
    cv2.TERM_CRITERIA_EPS +
    cv2.TERM_CRITERIA_MAX_ITER,
    20,
    1.0
)

K = 6

_, labels, centers = cv2.kmeans(
    data,
    K,
    None,
    criteria,
    10,
    cv2.KMEANS_PP_CENTERS
)


centers = np.uint8(centers)

quantized = centers[
    labels.flatten()
]

quantized = quantized.reshape(
    image.shape
)


# -------------------------
# ฟังก์ชันสร้าง Grid
# -------------------------

def create_grid(grid_width, grid_height):

    cell_width = 1024 / grid_width
    cell_height = 1024 / grid_height

    grid = []

    for gy in range(grid_height):

        row = []

        for gx in range(grid_width):

            start_x = int(
                gx * cell_width
            )

            end_x = int(
                (gx + 1) * cell_width
            )

            start_y = int(
                gy * cell_height
            )

            end_y = int(
                (gy + 1) * cell_height
            )


            color_cell = quantized[
                start_y:end_y,
                start_x:end_x
            ]

            edge_cell = edges[
                start_y:end_y,
                start_x:end_x
            ]


            # -------------------------
            # หาสีหลักในช่อง
            # -------------------------

            pixels = color_cell.reshape(
                (-1, 3)
            )

            distances = np.linalg.norm(
                pixels[:, None, :].astype(float)
                -
                centers[None, :, :].astype(float),
                axis=2
            )

            nearest = np.argmin(
                distances,
                axis=1
            )

            color_counts = np.bincount(
                nearest,
                minlength=K
            )

            dominant_color = int(
                np.argmax(color_counts)
            )


            # -------------------------
            # ดูว่าช่องนี้มีเส้นไหม
            # -------------------------

            edge_ratio = np.mean(
                edge_cell > 0
            )


            # -------------------------
            # ถ้ามีโครงสร้างเส้น
            # ให้ใช้สีของบริเวณนั้น
            # -------------------------

            if edge_ratio > 0.08:

                row.append(
                    dominant_color
                )

            else:

                # ช่องที่ไม่มีเส้น
                # ใช้สีหลักของบริเวณนั้นเหมือนกัน
                row.append(
                    dominant_color
                )


        grid.append(row)

    return grid


# -------------------------
# สร้างภาพจาก Grid
# -------------------------

def create_chart(
    grid,
    cell_size
):

    grid_height = len(grid)
    grid_width = len(grid[0])

    chart = np.zeros(
        (
            grid_height * cell_size,
            grid_width * cell_size,
            3
        ),
        dtype=np.uint8
    )


    for gy in range(grid_height):

        for gx in range(grid_width):

            color_index = grid[gy][gx]

            color = centers[
                color_index
            ]

            x1 = gx * cell_size
            y1 = gy * cell_size

            x2 = x1 + cell_size
            y2 = y1 + cell_size


            cv2.rectangle(
                chart,
                (x1, y1),
                (x2, y2),
                color.tolist(),
                -1
            )


            # เส้น Grid
            cv2.rectangle(
                chart,
                (x1, y1),
                (x2, y2),
                (100, 100, 100),
                1
            )


    return chart


# -------------------------
# 32 × 32
# -------------------------

grid_32 = create_grid(
    32,
    32
)

chart_32 = create_chart(
    grid_32,
    20
)

cv2.imwrite(
    OUTPUT_32,
    chart_32
)


# -------------------------
# 64 × 64
# -------------------------

grid_64 = create_grid(
    64,
    64
)

chart_64 = create_chart(
    grid_64,
    12
)

cv2.imwrite(
    OUTPUT_64,
    chart_64
)

# -------------------------
# 128 × 128
# -------------------------

grid_128 = create_grid(128, 128)

chart_128 = create_chart(
    grid_128,
    6
)

cv2.imwrite(
    OUTPUT_128,
    chart_128
)


# -------------------------
# 256 × 256
# -------------------------

grid_256 = create_grid(256, 256)

chart_256 = create_chart(
    grid_256,
    3
)

cv2.imwrite(
    OUTPUT_256,
    chart_256
)


# -------------------------
# JSON
# -------------------------

result = {
    "grid32": {
        "width": 32,
        "height": 32,
        "grid": grid_32
    },

    "grid64": {
        "width": 64,
        "height": 64,
        "grid": grid_64
    }
}


with open(
    OUTPUT_JSON,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        result,
        file,
        ensure_ascii=False,
        indent=2
    )


print()
print("สร้างสำเร็จ")
print("-", OUTPUT_32)
print("-", OUTPUT_64)
print("-", OUTPUT_128)
print("-", OUTPUT_256)
print("-", OUTPUT_JSON)