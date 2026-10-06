import cv2
import numpy as np

# =========================
# ตั้งค่า
# =========================

input_path = "python/input.png"
output_path = "pattern_structure.png"

# =========================
# อ่านรูป
# =========================

image = cv2.imread(input_path)

if image is None:
    print("ไม่พบรูปภาพ:", input_path)
    exit()

# Resize
image = cv2.resize(image, (1024, 1024))

# =========================
# ลดจำนวนสี
# =========================

data = image.reshape((-1, 3))
data = np.float32(data)

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
quantized = centers[labels.flatten()]
quantized = quantized.reshape(image.shape)

# =========================
# สร้าง Mask ของแต่ละสี
# =========================

structure = np.zeros(
    (1024, 1024),
    dtype=np.uint8
)

kernel = cv2.getStructuringElement(
    cv2.MORPH_ELLIPSE,
    (5, 5)
)

for color_index in range(K):

    # Mask สีนี้
    mask = np.all(
        quantized == centers[color_index],
        axis=2
    ).astype(np.uint8) * 255

    # ทำความสะอาดพื้นที่
    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_OPEN,
        kernel
    )

    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_CLOSE,
        kernel
    )

    # หาเส้นขอบของพื้นที่สี
    contours, _ = cv2.findContours(
        mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    # วาดเส้นขอบลงบนภาพโครงสร้าง
    cv2.drawContours(
        structure,
        contours,
        -1,
        255,
        1
    )

# =========================
# บันทึกผล
# =========================

cv2.imwrite(
    output_path,
    structure
)

print("สร้าง pattern_structure.png สำเร็จ")