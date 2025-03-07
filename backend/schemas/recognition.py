from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime



class RecognitionRequest(BaseModel):
# 印章识别请求模型
    file_path: str



class RecognitionResponse(BaseModel):
# 印章识别结果模型
    id: str
    filename: str
    imageUrl: Optional[str] = None
    sealCount: int
    sealType: Optional[str] = None
    sealText: Optional[str] = None
    confidence: float
    status: str
    date: datetime

    class Config:
        orm_mode = True



class BatchFileSchema(BaseModel):
# 批处理文件模型
    id: str
    name: str
    size: int
    status: str
    result: str
    confidence: float
    progress: Optional[float] = None



class BatchStatusResponse(BaseModel):
# 批处理状态响应模型
    batchId: str
    status: str
    progress: float
    files: List[BatchFileSchema]

    class Config:
        orm_mode = True



class HistoryPaginationResponse(BaseModel):
# 历史记录分页响应模型
    records: List[RecognitionResponse]
    totalPages: int
    totalRecords: int
    currentPage: int

    class Config:
        orm_mode = True
