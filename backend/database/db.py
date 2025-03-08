from sqlalchemy import create_engine, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging
from config import DATABASE

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 数据库连接配置
DATABASE_URL = f"postgresql://{DATABASE['username']}:{DATABASE['password']}@{DATABASE['host']}:{DATABASE['port']}/{DATABASE['dbname']}"

# 创建数据库引擎
engine = create_engine(DATABASE_URL)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()

def get_db():
# 获取数据库会话
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 初始化数据库表


def init_db():
    try:
        # 检查数据库连接
        conn = engine.connect()
        conn.close()
        logger.info("数据库连接成功")

        # 创建所有表
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表已创建或已存在")

        return True
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        return False

# 检查表是否存在


def check_table_exists(table_name):
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()
