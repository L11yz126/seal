import os
import shutil
import uuid
import cv2
import io
import traceback
import numpy as np
from datetime import datetime
from fastapi import UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from backend.database.db import get_db
from backend.database.models import SealRecognition, BatchProcess
from backend.minio.index import minio_handler
from seal_Detect import YOLO11

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 确保tmp文件夹存在
tmp_folder = os.path.join(os.getcwd(), 'tmp')
os.makedirs(tmp_folder, exist_ok=True)

def get_onnx_path():
    # 获取当前文件的绝对路径
    current_file_path = os.path.abspath(__file__)

    # 获取当前文件所在目录的父目录，即项目根目录
    project_root = os.path.dirname(current_file_path)
    # 回退两层目录
    project_root = os.path.dirname(project_root)
    project_root = os.path.dirname(project_root)

    # 构建ONNX模型的路径
    onnx_model_path = os.path.join(
        project_root, 'runs', 'train', 'train4', 'weights', 'best.onnx')

    return onnx_model_path


yolo_model = YOLO11("E:/beshe/yinzhang/ultralytics/runs/train/train3/weights/best.onnx")


def read_image_from_minio(object_name):
    # 读到minio的文件给到 cv2
    data = minio_handler.get_object(object_name)
    image_data = data.data
    image = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)
    return image


def save_image_to_minio(object_name, image):
    format = object_name.split('.')[-1]
    # buffer = numpy_to_buffer(image, object_name.split('.')[-1])
    success, encoded_image = cv2.imencode(
        f'.{format.lower()}', image)
    content_type = f'image/{format.lower()}'
    minio_handler.put_buffer(object_name, io.BytesIO(encoded_image.tobytes()), content_type)


def detect_start(image_path):
    result_bbox = []
    detections, image = yolo_model.detect_objects(image_path)

    num = len(detections)

    has_red_seal = len(detections) > 0

    if not has_red_seal:
        return image, []

    for bbox in detections:
        x_min, y_min, w, h = bbox
        x_max = x_min + w
        y_max = y_min + h
        result_bbox.append([x_min, y_min, x_max, y_max])
        cv2.rectangle(image, (x_min, y_min), (x_max, y_max), (0, 0, 255), 5)
    return image, result_bbox


def save_file_to_tmp(file: UploadFile, file_path: str) -> bool:
    """
    将上传文件保存到指定路径
    
    参数:
        file: UploadFile - FastAPI 文件对象
        file_path: str - 要保存的完整路径
        
    返回:
        bool - 保存是否成功
    """
    try:
        # 创建目标目录（如果不存在）
        directory = os.path.dirname(file_path)
        os.makedirs(directory, exist_ok=True)

        # 重置文件指针到起始位置（确保可以重复读取）
        file.file.seek(0)

        # 使用分块写入方式处理大文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return True
    except Exception as e:
        # 建议替换为你的日志记录方式
        print(f"文件保存失败: {str(e)}")
        return False
    finally:
        # 确保关闭文件处理器（非必须，但推荐）
        file.file.close()

# 印章识别函数
async def detect(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    处理单个文件的印章识别
    """
    try:
        # 生成唯一ID
        file_id = str(uuid.uuid4())

        # 上传原始文件到MinIO
        file_extension = os.path.splitext(
            file.filename)[1] if '.' in file.filename else ''
        object_name = f"uploads/{file_id}{file_extension}"

        success, file_object = await minio_handler.upload_file(file, object_name=object_name)
        if not success:
            raise HTTPException(status_code=500, detail="文件上传失败")

        # 模拟印章识别过程
        # 在实际应用中，这里应该调用真实的印章识别算法
        seal_count = 1
        seal_type = "公司公章"
        seal_text = "XX科技有限公司"
        confidence = 98.0
        status = "有效"

        # 存图片到本地
        local_img_path = os.path.join(tmp_folder, f"{file_id}{file_extension}")
        save_file_to_tmp(file=file, file_path=local_img_path)

        # 使用infer_start函数做印章检测
        processed_image, result_bbox = detect_start(local_img_path)

        # 处理完毕后，可以删除临时文件
        os.remove(local_img_path)

        # result_box是识别到的印章坐标，所以有多少个那么就是多少个印章
        seal_count = len(result_bbox)

        # 生成结果图像对象名称
        result_object = f"results/result_{file_id}{file_extension}"

        # 存识别的结果到 minio
        save_image_to_minio(result_object, processed_image)

        # 创建识别记录
        recognition = SealRecognition(
            id=file_id,
            filename=file.filename,
            original_filename=file.filename,
            file_object=file_object,
            result_object=result_object,
            seal_count=seal_count,
            seal_type=seal_type,
            seal_text=seal_text,
            confidence=confidence,
            status=status
        )

        # 保存到数据库
        db.add(recognition)
        db.commit()
        db.refresh(recognition)

        # 获取文件URL
        result_url = minio_handler.get_file_url(result_object)

        # 构建响应
        return {
            "id": recognition.id,
            "filename": recognition.filename,
            "imageUrl": result_url,
            "sealCount": recognition.seal_count,
            "sealType": recognition.seal_type,
            "sealText": recognition.seal_text,
            "confidence": recognition.confidence,
            "status": recognition.status
        }

    except Exception as e:
        traceback.print_exc()
        # 记录错误并返回错误响应
        logger.error(f"识别过程中出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"文件处理失败: {str(e)}")
