# -*- coding: utf-8 -*-

from ultralytics import YOLO

if __name__ == '__main__':

    model = YOLO(model=r"E:\毕设\yinzhang\ultralytics\runs\train\train3\weights\best.pt")
    results = model.predict(source=r"D:\image\1.png",
                            save=True,
                            show=False,
                            )
    print(model.names)
    for result in results:
        # 获取检测到的边界框信息
        boxes = result.boxes
        for box in boxes:
            # 获取边界框的坐标 (x1, y1, x2, y2)
            x1, y1, x2, y2 = box.xyxy[0]
            print(f"Bounding box coordinates: ({x1}, {y1}) - ({x2}, {y2})")
