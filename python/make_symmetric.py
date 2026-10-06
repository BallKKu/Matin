import cv2
import numpy as np

input_path = "clean_edge.png"
output_path = "symmetric_edge.png"


# -------------------------
# อ่านภาพ
# -------------------------

image = cv2.imread(
    input_path,
    cv2.IMREAD_GRAYSCALE
)

if image is None:
    print("ไม่พบรูปภาพ:", input_path)
    exit()


height, width = image.shape


# -------------------------
# ทำให้ภาพเป็นขาว-ดำชัดเจน
# -------------------------

_, image = cv2.threshold(
    image,
    127,
    255,
    cv2.THRESH_BINARY
)


# -------------------------
# แบ่งภาพซ้าย / ขวา
# -------------------------

center = width // 2

left = image[:, :center]


# -------------------------
# Mirror ฝั่งซ้าย
# -------------------------

right = cv2.flip(
    left,
    1
)


# -------------------------
# รวมซ้าย + ขวา
# -------------------------

if width % 2 == 0:

    symmetric = np.hstack(
        [left, right]
    )

else:

    center_column = image[:, center:center + 1]

    symmetric = np.hstack(
        [
            left,
            center_column,
            right
        ]
    )


# -------------------------
# บันทึกภาพ
# -------------------------

cv2.imwrite(
    output_path,
    symmetric
)

print(
    "สร้าง symmetric_edge.png สำเร็จ"
)

print(
    "ขนาด:",
    symmetric.shape[1],
    "x",
    symmetric.shape[0]
)