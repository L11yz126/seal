import multiprocessing
from ultralytics import YOLO
import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
# 设置多进程启动方法为 'spawn'（适用于 Windows）
multiprocessing.set_start_method('spawn', force=True)

if __name__ == "__main__":
    # 加载模型权重
    model = YOLO("yolov11n.pt")

    # 开始训练
    model.train(
        # 指定 .yaml 配置文件
        data="ultralytics/cfg/datasets/VOC.yaml",
        # 训练轮次
        epochs=100,
        batch=8,
        imgsz=640,
        # 保存训练结果路径
        project='runs/train',
        # 指定使用的设备（'0'代表第一张GPU，如果没有GPU使用'cpu'）
        device='cpu',
        single_cls=True
    )
