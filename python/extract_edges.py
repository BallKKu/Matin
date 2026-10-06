import cv2

# รูปต้นฉบับ
input_path = "python/input7.png"

# อ่านรูป
image = cv2.imread(input_path)

if image is None:
    print("ไม่พบรูปภาพ")
    exit()

# Resize ให้ขนาดมาตรฐาน
image = cv2.resize(image, (1024, 1024))

# แปลงเป็น Grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# ลด Noise
blur = cv2.GaussianBlur(gray, (5, 5), 0)

# สกัดเส้น
edges = cv2.Canny(
    blur,
    50,
    150
)

# เชื่อมเส้นที่ขาด
close_kernel = cv2.getStructuringElement(
    cv2.MORPH_ELLIPSE,
    (5, 5)
)

edges = cv2.morphologyEx(
    edges,
    cv2.MORPH_CLOSE,
    close_kernel
)

# ลบจุดรบกวนเล็ก ๆ
open_kernel = cv2.getStructuringElement(
    cv2.MORPH_ELLIPSE,
    (3, 3)
)

edges = cv2.morphologyEx(
    edges,
    cv2.MORPH_OPEN,
    open_kernel
)

cv2.imwrite(
    "clean_edge.png",
    edges
)

# บันทึกผล
cv2.imwrite(
    "edge.png",
    edges
)

print("สร้าง edge.png สำเร็จ")