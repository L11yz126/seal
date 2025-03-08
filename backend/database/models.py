from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from datetime import datetime
import uuid
import logging

from .db import Base, check_table_exists

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_uuid():
# 生成唯一ID
    return str(uuid.uuid4())


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

    # 不再使用relationship


class SealRecognition(Base):
# 印章识别结果模型
    __tablename__ = "seal_recognitions"

    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    # 存储MinIO对象名称，而不是本地文件路径
    file_object = Column(String, nullable=False)
    result_object = Column(String, nullable=True)
    seal_count = Column(Integer, default=0)
    seal_type = Column(String, nullable=True)
    seal_text = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    status = Column(String, default="处理中")  # 处理中, 有效, 无效, 无印章
    created_at = Column(DateTime, default=datetime.now)
    # 仍然保留外键ID，但不使用relationship
    batch_id = Column(String, nullable=True)



def check_tables():
# 检查并记录表是否存在
    tables = ["seal_recognitions", "batch_processes"]
    for table in tables:
        exists = check_table_exists(table)
        if exists:
            logger.info(f"表 {table} 已存在")
        else:
            logger.warning(f"表 {table} 不存在，将在应用启动时创建")
