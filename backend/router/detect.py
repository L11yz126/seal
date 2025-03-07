from fastapi import APIRouter, FastAPI, File, UploadFile, Form, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid
from datetime import datetime

from backend.database.db import get_db
from backend.database.models import SealRecognition, BatchProcess
from backend.tools.detect import detect
from backend.schemas.recognition import RecognitionResponse, BatchStatusResponse, HistoryPaginationResponse


def detect_routers(app: FastAPI):
    router = APIRouter(
        prefix='/api',
        tags=['api'],
        dependencies=[]
    )

    # 单文件识别接口
    @router.post('/recognize')
    async def recognize_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
        """
        处理单个文件的印章识别
        """
        return await detect(file, db)

    # 批量处理接口
    @router.post('/batch-process')
    async def batch_process(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
        """
        批量处理多个文件的印章识别
        """
        try:
            # 创建批处理作业
            batch_id = str(uuid.uuid4())
            batch = BatchProcess(
                id=batch_id,
                name=f"批处理作业 {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                status="processing",
                total_files=len(files)
            )
            db.add(batch)
            db.commit()

            # 异步处理文件（在实际应用中，这应该是一个后台任务）
            # 这里简化为同步处理
            for file in files:
                # 调用识别函数处理每个文件
                result = await detect(file, db)

                # 更新批处理关联
                recognition = db.query(SealRecognition).filter(
                    SealRecognition.id == result["id"]).first()
                if recognition:
                    recognition.batch_id = batch_id
                    db.commit()

            # 更新批处理状态
            batch.processed_files = len(files)
            batch.status = "completed"
            db.commit()

            return {"batchId": batch_id, "message": "批处理已开始"}

        except Exception as e:
            # 记录错误并返回错误响应
            print(f"批处理过程中出错: {str(e)}")
            raise HTTPException(status_code=500, detail=f"批处理失败: {str(e)}")

    # 获取批处理状态
    @router.get('/batch-process')
    async def get_batch_status(batchId: str = Query(...), db: Session = Depends(get_db)):
        """
        获取批处理作业的状态
        """
        try:
            # 查询批处理作业
            batch = db.query(BatchProcess).filter(
                BatchProcess.id == batchId).first()
            if not batch:
                raise HTTPException(status_code=404, detail="批处理作业不存在")

            # 查询关联的识别结果
            recognitions = db.query(SealRecognition).filter(
                SealRecognition.batch_id == batchId).all()

            # 计算进度
            progress = 0
            if batch.total_files > 0:
                progress = (batch.processed_files / batch.total_files) * 100

            # 构建文件状态列表
            files = []
            for rec in recognitions:
                files.append({
                    "id": rec.id,
                    "name": rec.original_filename,
                    "size": os.path.getsize(rec.file_path) if os.path.exists(rec.file_path) else 0,
                    "status": "complete" if rec.status in ["有效", "无效", "无印章"] else "processing",
                    "result": rec.status,
                    "confidence": rec.confidence,
                    "progress": 100 if rec.status in ["有效", "无效", "无印章"] else 45
                })

            return {
                "batchId": batch.id,
                "status": batch.status,
                "progress": progress,
                "files": files
            }

        except HTTPException:
            raise
        except Exception as e:
            # 记录错误并返回错误响应
            print(f"获取批处理状态时出错: {str(e)}")
            raise HTTPException(status_code=500, detail=f"获取批处理状态失败: {str(e)}")

    # 暂停批处理
    @router.post('/batch-process/{batchId}/pause')
    async def pause_batch_process(batchId: str, db: Session = Depends(get_db)):
        """
        暂停批处理作业
        """
        try:
            # 查询批处理作业
            batch = db.query(BatchProcess).filter(
                BatchProcess.id == batchId).first()
            if not batch:
                raise HTTPException(status_code=404, detail="批处理作业不存在")

            # 更新状态
            batch.status = "paused"
            db.commit()

            return {"message": "批处理已暂停"}

        except HTTPException:
            raise
        except Exception as e:
            # 记录错误并返回错误响应
            print(f"暂停批处理时出错: {str(e)}")
            raise HTTPException(status_code=500, detail=f"暂停批处理失败: {str(e)}")

    # 获取历史记录
    @router.get('/history')
    async def get_history(
        page: int = Query(1, ge=1),
        limit: int = Query(10, ge=1, le=100),
        search: Optional[str] = Query(None),
        db: Session = Depends(get_db)
    ):
        """
        获取印章识别历史记录
        """
        try:
            # 构建查询
            query = db.query(SealRecognition)

            # 应用搜索过滤
            if search:
                query = query.filter(
                    SealRecognition.filename.ilike(f"%{search}%"))

            # 计算总记录数
            total_records = query.count()

            # 计算总页数
            total_pages = (total_records + limit - 1) // limit

            # 应用分页
            records = query.order_by(SealRecognition.created_at.desc()).offset(
                (page - 1) * limit).limit(limit).all()

            # 构建响应
            result = []
            for rec in records:
                result.append({
                    "id": rec.id,
                    "filename": rec.filename,
                    "date": rec.created_at.strftime("%Y-%m-%d %H:%M"),
                    "seals": rec.seal_count,
                    "status": rec.status,
                    "confidence": rec.confidence,
                    "imageUrl": f"/api/files/{os.path.basename(rec.result_path)}" if rec.result_path else None
                })

            return {
                "records": result,
                "totalPages": total_pages,
                "totalRecords": total_records,
                "currentPage": page
            }

        except Exception as e:
            # 记录错误并返回错误响应
            print(f"获取历史记录时出错: {str(e)}")
            raise HTTPException(status_code=500, detail=f"获取历史记录失败: {str(e)}")

    # 删除历史记录
    @router.delete('/history/{id}')
    async def delete_history(id: str, db: Session = Depends(get_db)):
        """
        删除印章识别历史记录
        """
        try:
            # 查询记录
            record = db.query(SealRecognition).filter(
                SealRecognition.id == id).first()
            if not record:
                raise HTTPException(status_code=404, detail="记录不存在")

            # 删除文件
            if record.file_path and os.path.exists(record.file_path):
                os.remove(record.file_path)

            if record.result_path and os.path.exists(record.result_path):
                os.remove(record.result_path)

            # 删除数据库记录
            db.delete(record)
            db.commit()

            return {"message": "记录已删除"}

        except HTTPException:
            raise
        except Exception as e:
            # 记录错误并返回错误响应
            print(f"删除历史记录时出错: {str(e)}")
            raise HTTPException(status_code=500, detail=f"删除历史记录失败: {str(e)}")

    # 下载历史记录报告
    @router.get('/history/{id}/download')
    async def download_history(id: str, db: Session = Depends(get_db)):
        """
        下载印章识别历史记录报告
        """
        try:
            # 查询记录
            record = db.query(SealRecognition).filter(
                SealRecognition.id == id).first()
            if not record:
                raise HTTPException(status_code=404, detail="记录不存在")

            # 检查结果文件是否存在
            if not record.result_path or not os.path.exists(record.result_path):
                raise HTTPException(status_code=404, detail="结果文件不存在")

            # 返回文件
            return FileResponse(
                path=record.result_path,
                filename=f"识别结果_{record.filename}",
                media_type="application/octet-stream"
            )

        except HTTPException:
            raise
        except Exception as e:
            # 记录错误并返回错误响应
            print(f"下载历史记录时出错: {str(e)}")
            raise HTTPException(status_code=500, detail=f"下载历史记录失败: {str(e)}")

    # 静态文件服务
    @router.get('/files/{filename}')
    async def get_file(filename: str):
        """
        获取静态文件
        """
        try:
            # 检查文件是否存在
            file_path = os.path.join(os.getcwd(), "results", filename)
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail="文件不存在")

            # 返回文件
            return FileResponse(path=file_path)

        except HTTPException:
            raise
        except Exception as e:
            # 记录错误并返回错误响应
            print(f"获取文件时出错: {str(e)}")
            raise HTTPException(status_code=500, detail=f"获取文件失败: {str(e)}")

    return app.include_router(router=router)
