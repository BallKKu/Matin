import cv2
import numpy as np
import json

input_path = "symmetric_edge.png"

output_image = "weaving_chart.png"
output_json = "weaving_chart.json"


# =========================
# ตั้งค่าผังลายทอ
# =========================

GRID_WIDTH = 32
GRID_HEIGHT = 32

CELL_SIZE = 20

# ถ้าในช่องมีเส้นเกิน % นี้
# ให้ถือว่าช่องนั้นเป็นลาย
EDGE_THRESHOLD = 12


# =========================
# อ่านภาพ
# =========================

image = cv2.imread(
    input_path,
    cv2.IMREAD_GRAYSCALE
)

if image is None:
    print("ไม่พบรูปภาพ:", input_path)
    exit()


height, width = image.shape


# =========================
# แบ่งภาพเป็น Grid
# =========================

cell_width = width / GRID_WIDTH
cell_height = height / GRID_HEIGHT

grid = []


for gy in range(GRID_HEIGHT):

    row = []

    for gx in range(GRID_WIDTH):

        start_x = int(gx * cell_width)
        end_x = int((gx + 1) * cell_width)

        start_y = int(gy * cell_height)
        end_y = int((gy + 1) * cell_height)

        cell = image[
            start_y:end_y,
            start_x:end_x
        ]

        # จำนวน pixel ที่เป็นเส้น
        edge_pixels = np.sum(cell > 0)

        total_pixels = cell.size

        edge_percentage = (
            edge_pixels / total_pixels
        ) * 100


        # -------------------------
        # ตัดสินว่าช่องนี้มีลายไหม
        # -------------------------

        if edge_percentage >= EDGE_THRESHOLD:
            row.append(1)
        else:
            row.append(0)


    grid.append(row)


# =========================
# แสดง Grid ใน Terminal
# =========================

print()
print("========== WEAVING CHART ==========")
print()

for row in grid:

    line = ""

    for cell in row:

        if cell == 1:
            line += "■"
        else:
            line += "□"

    print(line)


# =========================
# สร้างภาพผังลายทอ
# =========================

chart = np.ones(
    (
        GRID_HEIGHT * CELL_SIZE,
        GRID_WIDTH * CELL_SIZE
    ),
    dtype=np.uint8
) * 255


for gy in range(GRID_HEIGHT):

    for gx in range(GRID_WIDTH):

        x1 = gx * CELL_SIZE
        y1 = gy * CELL_SIZE

        x2 = x1 + CELL_SIZE
        y2 = y1 + CELL_SIZE


        if grid[gy][gx] == 1:

            # ช่องที่มีลาย
            cv2.rectangle(
                chart,
                (x1, y1),
                (x2, y2),
                0,
                -1
            )

        else:

            # ช่องว่าง
            cv2.rectangle(
                chart,
                (x1, y1),
                (x2, y2),
                180,
                1
            )


# =========================
# บันทึกภาพ
# =========================

cv2.imwrite(
    output_image,
    chart
)


# =========================
# บันทึก JSON
# =========================

result = {
    "gridWidth": GRID_WIDTH,
    "gridHeight": GRID_HEIGHT,
    "grid": grid
}

with open(
    output_json,
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
print("สร้างไฟล์สำเร็จ:")
print("-", output_image)
print("-", output_json)