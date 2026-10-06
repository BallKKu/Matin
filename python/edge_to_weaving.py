import cv2
import numpy as np

input_path = "edge.png"
output_path = "weaving_chart.png"

# -------------------------
# ตั้งค่าผัง
# -------------------------

GRID_WIDTH = 32
GRID_HEIGHT = 32

# ช่องหนึ่งต้องมีเส้นอย่างน้อยกี่ %
# ถึงจะถือว่าเป็นช่องที่มีลาย
EDGE_THRESHOLD = 15


# -------------------------
# อ่านภาพเส้น
# -------------------------

image = cv2.imread(
    input_path,
    cv2.IMREAD_GRAYSCALE
)

if image is None:
    print("ไม่พบรูปภาพ:", input_path)
    exit()


height, width = image.shape

cell_width = width / GRID_WIDTH
cell_height = height / GRID_HEIGHT


# -------------------------
# สร้าง Grid
# -------------------------

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

        if edge_percentage >= EDGE_THRESHOLD:
            row.append(1)
        else:
            row.append(0)

    grid.append(row)


# -------------------------
# แสดง Grid ใน Terminal
# -------------------------

print("\nWeaving Chart\n")

for row in grid:

    line = ""

    for cell in row:

        if cell == 1:
            line += "■"
        else:
            line += "□"

    print(line)


# -------------------------
# สร้างภาพผังลายทอ
# -------------------------

CELL_SIZE = 20

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

            cv2.rectangle(
                chart,
                (x1, y1),
                (x2, y2),
                0,
                -1
            )

        else:

            cv2.rectangle(
                chart,
                (x1, y1),
                (x2, y2),
                180,
                1
            )


cv2.imwrite(
    output_path,
    chart
)

print("\nสร้าง weaving_chart.png สำเร็จ")