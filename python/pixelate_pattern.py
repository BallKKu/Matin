import cv2


INPUT_IMAGE = "pattern_repeat.png"

# จำนวน Pixel ที่ต้องการ
RESOLUTIONS = [
    32,
    64,
    128,
    256
]

OUTPUT_SIZE = 1024


image = cv2.imread(
    INPUT_IMAGE,
    cv2.IMREAD_COLOR
)

if image is None:
    print("ไม่พบภาพ:", INPUT_IMAGE)
    exit()


for resolution in RESOLUTIONS:

    # --------------------------------
    # ลดขนาดภาพ
    # --------------------------------

    small = cv2.resize(
        image,
        (resolution, resolution),
        interpolation=cv2.INTER_AREA
    )


    # --------------------------------
    # ขยายกลับ
    # โดยไม่ทำให้ Pixel เบลอ
    # --------------------------------

    pixelated = cv2.resize(
        small,
        (OUTPUT_SIZE, OUTPUT_SIZE),
        interpolation=cv2.INTER_NEAREST
    )


    output = (
        f"pixelated_{resolution}.png"
    )


    cv2.imwrite(
        output,
        pixelated
    )


    print(
        "สร้าง:",
        output
    )