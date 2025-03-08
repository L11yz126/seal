import logging
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile
import io
from datetime import datetime

from config import MINIO

logger = logging.getLogger(__name__)


class MinioHandler:
    def __init__(self):
        self.client = None
        self.init_minio()

    def init_minio(self):
        try:
            self.client = Minio(
                endpoint=MINIO['endpoint'],
                access_key=MINIO['access_key'],
                secret_key=MINIO['secret_key'],
                secure=False  # 如果使用 HTTPS，设置为 True
            )
            logger.info("MinIO 客户端初始化成功")
        except Exception as e:
            logger.error(f'MinIO 初始化失败: {str(e)}')

    async def upload_file(self, file: UploadFile, bucket_name: str = MINIO['bucket_name'], object_name: str = None):
        if not self.client:
            logger.error("MinIO 客户端未初始化")
            self.init_minio()
            return False, None

        try:
            # 如果没有提供 object_name，使用时间戳和原始文件扩展名
            if not object_name:
                file_extension = file.filename.split(
                    '.')[-1] if '.' in file.filename else ''
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                object_name = f"{timestamp}.{file_extension}" if file_extension else timestamp

            # 读取文件内容
            content = await file.read()
            content_size = len(content)
            content_stream = io.BytesIO(content)

            # 检查 bucket 是否存在，不存在则创建
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)

            # 直接上传文件内容
            self.client.put_object(
                bucket_name,
                object_name,
                content_stream,
                content_size,
            )
            logger.info(
                f"文件 '{file.filename}' 已成功上传到 '{bucket_name}/{object_name}'")

            return True, object_name
        except S3Error as e:
            logger.error(f"上传失败: {e}")
            return False, None

    def get_file_url(self, object_name: str, bucket_name: str = MINIO['bucket_name']):
        if not self.client:
            logger.error("MinIO 客户端未初始化")
            return None

        try:
            # 获取文件的预签名URL，有效期为7天
            url = self.client.presigned_get_object(
                bucket_name, object_name)
            return url
        except S3Error as e:
            logger.error(f"获取文件地址失败: {e}")
            return None
    
    def get_object(self, object_name: str, bucket_name: str = MINIO['bucket_name']):
        if not self.client:
            logger.error("MinIO 客户端未初始化")
            return None

        try:
            object = self.client.get_object(
                bucket_name, object_name)
            return object
        except S3Error as e:
            logger.error(f"获取文件object失败: {e}")
            return None
    
    def put_buffer(self, object_name, buffer: io.BytesIO, content_type: str, bucket_name: str = MINIO['bucket_name']):
        buffer.seek(0)
        self.client.put_object(bucket_name, object_name, data=buffer,
                               length=len(buffer.getvalue()),
                               content_type=content_type)


# 创建 MinioHandler 实例
minio_handler = MinioHandler()
