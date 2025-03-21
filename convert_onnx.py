from ultralytics import YOLO
import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
# Load the YOLO11 model
model = YOLO(r"E:\beshe\yinzhang\ultralytics\runs\train\train3\weights\best.pt")

# Export the model to ONNX format
model.export(format="onnx", device='cpu',dynamic=True)  # creates 'yolo11n.onnx'
