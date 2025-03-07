from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .db import Base



def generate_uuid():
# 生成唯一ID
    return str(uuid.uuid4())

class SealRecognition(Base):
# 印章识别结果模型
    __tablename__ = "seal_recognitions"

    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    result_path = Column(String, nullable=True)
    seal_count = Column(Integer, default=0)
    seal_type = Column(String, nullable=True)
    seal_text = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    status = Column(String, default="处理中")  # 处理中, 有效, 无效, 无印章
    created_at = Column(DateTime, default=datetime.now)
    batch_id = Column(String, nullable=True)

    # 关联到批处理作业
    batch = relationship(
        "BatchProcess", back_populates="recognitions", foreign_keys=[batch_id])


class BatchProcess(Base):
# 批处理作业模型
    __tablename__ = "batch_processes"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    # waiting, processing, completed, paused, error
    status = Column(String, default="waiting")
    total_files = Column(Integer, default=0)
    processed_files = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # 关联到识别结果
    recognitions = relationship(
        "SealRecognition", back_populates="batch", foreign_keys=[SealRecognition.batch_id])
