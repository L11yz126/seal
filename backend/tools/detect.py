import os
import shutil
import uuid
from datetime import datetime
from fastapi import UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database.db import get_db
from backend.database.models import SealRecognition, BatchProcess

# 文件上传目录
UPLOAD_DIR = "uploads"
RESULT_DIR = "results"

# 确保上传和结果目录存在
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

async def detect(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    # 印章识别函数
    处理单个文件的印章识别
    """
    try:
        # 生成唯一文件名
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        file_name = f"{file_id}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        # 保存上传的文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 模拟印章识别过程
        # 在实际应用中，这里应该调用真实的印章识别算法
        seal_count = 1
        seal_type = "公司公章"
        seal_text = "XX科技有限公司"
        confidence = 98.0
        status = "有效"

        # 生成结果图像路径
        result_path = os.path.join(RESULT_DIR, f"result_{file_name}")

        # 在这里应该生成结果图像，这里简单复制原图作为示例
        shutil.copy(file_path, result_path)

        # 创建识别记录
        recognition = SealRecognition(
            id=file_id,
            filename=file.filename,
            original_filename=file.filename,
            file_path=file_path,
            result_path=result_path,
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

        # 构建响应
        return {
            "id": recognition.id,
            "filename": recognition.filename,
            "imageUrl": f"/api/files/{os.path.basename(result_path)}",
            "sealCount": recognition.seal_count,
            "sealType": recognition.seal_type,
            "sealText": recognition.seal_text,
            "confidence": recognition.confidence,
            "status": recognition.status
        }

    except Exception as e:
        # 记录错误并返回错误响应
        print(f"识别过程中出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"文件处理失败: {str(e)}")
