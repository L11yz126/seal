from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging

from backend.router.detect import detect_routers
from backend.database.db import init_db

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def server() -> FastAPI:
    fast = FastAPI(title="印章识别系统API", description="提供印章识别、批量处理和历史记录管理功能")

    # CORS
    fast.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 创建必要的目录
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("results", exist_ok=True)
    logger.info("上传和结果目录已创建")

    # 初始化数据库
    if not init_db():
        logger.error("数据库初始化失败，请检查数据库连接")

    # 添加路由
    detect_routers(fast)

    # 挂载静态文件目录
    # fast.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    # fast.mount("/results", StaticFiles(directory="results"), name="results")

    # @fast.event("startup")
    # async def startup_event():
    #     """
    #     应用启动时执行的事件
    #     """
    #     logger.info("印章识别系统API服务已启动")
    #     # 再次确保数据库表已创建
    #     init_db()

    return fast


if __name__ == "__main__":
    app = server()
    import uvicorn

    uvicorn.run(app, host='0.0.0.0', port=1111, reload=True)
