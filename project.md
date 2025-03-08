Thought for 2 seconds### 印章识别系统文档

## 目录

- [目录](#目录)
- [项目概述](#项目概述)
- [系统架构](#系统架构)
- [环境搭建](#环境搭建)
  - [Docker环境准备](#docker环境准备)
  - [PostgreSQL数据库部署](#postgresql数据库部署)
  - [MinIO对象存储部署](#minio对象存储部署)
  - [项目部署](#项目部署)
- [API接口文档](#api接口文档)
  - [单文件识别](#单文件识别)
  - [批量处理](#批量处理)
  - [历史记录管理](#历史记录管理)
- [使用示例](#使用示例)
  - [使用curl进行API测试](#使用curl进行api测试)
  - [使用前端界面](#使用前端界面)
- [常见问题与解决方案](#常见问题与解决方案)
  - [数据库连接问题](#数据库连接问题)
  - [MinIO连接问题](#minio连接问题)
  - [API服务启动失败](#api服务启动失败)
  - [数据库表结构不匹配](#数据库表结构不匹配)


## 项目概述

印章识别系统是一个基于FastAPI和深度学习的文档处理系统，主要用于自动识别文档上的印章，验证其真实性，并提取相关信息。系统支持单文件识别和批量处理，并提供完整的历史记录管理功能。

主要功能包括：

- 单文件印章识别
- 批量文件处理
- 历史记录查询与管理
- 识别结果导出


## 系统架构

系统采用前后端分离架构：

- **前端**：基于Next.js和React开发的Web应用
- **后端**：基于FastAPI的RESTful API服务
- **存储**：

- PostgreSQL数据库：存储识别结果和批处理信息
- MinIO对象存储：存储上传的文件和识别结果图像



- **部署**：使用Docker容器化部署各组件


## 环境搭建

### Docker环境准备

1. 安装Docker和Docker Compose


```shellscript
# 安装Docker (Ubuntu)
sudo apt-get update
sudo apt-get install docker.io

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

2. 创建项目目录


```shellscript
mkdir -p seal-recognition-system
cd seal-recognition-system
```

3. 创建docker-compose.yml文件


```shellscript
touch docker-compose.yml
```

将以下内容复制到docker-compose.yml文件中：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: seal-recognition-postgres
    environment:
      POSTGRES_USER: vlou
      POSTGRES_PASSWORD: 97kjhaiuyr
      POSTGRES_DB: detect
    ports:
      - "5014:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    networks:
      - seal-network

  minio:
    image: minio/minio
    container_name: seal-recognition-minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    restart: always
    networks:
      - seal-network

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: seal-recognition-api
    depends_on:
      - postgres
      - minio
    ports:
      - "1111:1111"
    environment:
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_USER=vlou
      - DATABASE_PASSWORD=97kjhaiuyr
      - DATABASE_NAME=detect
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - MINIO_BUCKET_NAME=seal-recognition
    restart: always
    networks:
      - seal-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: seal-recognition-frontend
    depends_on:
      - api
    ports:
      - "3000:3000"
    restart: always
    networks:
      - seal-network

networks:
  seal-network:
    driver: bridge

volumes:
  postgres_data:
  minio_data:
```

### PostgreSQL数据库部署

1. 单独启动PostgreSQL容器


```shellscript
docker run -d \
  --name seal-recognition-postgres \
  -e POSTGRES_USER=vlou \
  -e POSTGRES_PASSWORD=vlou_postgres \
  -e POSTGRES_DB=detect \
  -p 5014:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:14
```

2. 验证PostgreSQL连接


```shellscript
docker exec -it seal-recognition-postgres psql -U vlou -d detect
```

在psql命令行中执行：

```sql
-- 查看数据库版本
SELECT version();

-- 退出
\q
```

### MinIO对象存储部署

1. 单独启动MinIO容器


```shellscript
docker run -d \
  --name seal-recognition-minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -p 9000:9000 \
  -p 9001:9001 \
  -v minio_data:/data \
  minio/minio server /data --console-address ":9001"
```

2. 访问MinIO控制台


在浏览器中打开 [http://localhost:9001，使用以下凭据登录：](http://localhost:9001，使用以下凭据登录：)

- 用户名：minioadmin
- 密码：minioadmin

登录换以后创建 secret_key，填到项目的根目录 config 里配置 minio


1. 创建存储桶


登录后，点击左侧的"Buckets"，然后点击"Create Bucket"按钮，创建名为"seal-recognition"的存储桶。

### 项目部署

1. 克隆项目代码


```shellscript
git clone <项目仓库URL> .
```

2. 创建后端Dockerfile


在backend目录下创建Dockerfile：

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "1111"]
```

3. 创建前端Dockerfile


在frontend目录下创建Dockerfile：

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
```

4. 使用Docker Compose启动所有服务


```shellscript
docker-compose up -d
```

5. 验证服务状态


```shellscript
docker-compose ps
```

## API接口文档

### 单文件识别

**接口**：`POST /api/recognize`

**功能**：上传单个文件进行印章识别

**请求参数**：

- `file`：要上传的文件（支持JPG、PNG、PDF格式）


**响应示例**：

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "合同文件.pdf",
  "imageUrl": "http://localhost:9000/seal-recognition/results/result_550e8400-e29b-41d4-a716-446655440000.pdf?X-Amz-Algorithm=...",
  "sealCount": 1,
  "sealType": "公司公章",
  "sealText": "XX科技有限公司",
  "confidence": 98.0,
  "status": "有效"
}
```

### 批量处理

**接口**：`POST /api/batch-process`

**功能**：上传多个文件进行批量印章识别

**请求参数**：

- `files`：要上传的文件列表（支持JPG、PNG、PDF格式）


**响应示例**：

```json
{
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "批处理已开始"
}
```

**获取批处理状态**：

**接口**：`GET /api/batch-process?batchId={batchId}`

**功能**：获取批处理作业的状态和进度

**请求参数**：

- `batchId`：批处理作业ID


**响应示例**：

```json
{
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 50.0,
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "合同文件1.pdf",
      "size": 1048576,
      "status": "complete",
      "result": "有效",
      "confidence": 98.0,
      "progress": 100
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "合同文件2.pdf",
      "size": 1048576,
      "status": "processing",
      "result": "处理中",
      "confidence": 0,
      "progress": 45
    }
  ]
}
```

**暂停批处理**：

**接口**：`POST /api/batch-process/{batchId}/pause`

**功能**：暂停正在进行的批处理作业

**请求参数**：

- `batchId`：批处理作业ID


**响应示例**：

```json
{
  "message": "批处理已暂停"
}
```

### 历史记录管理

**获取历史记录**：

**接口**：`GET /api/history?page={page}&limit={limit}&search={search}`

**功能**：获取印章识别历史记录

**请求参数**：

- `page`：页码，默认为1
- `limit`：每页记录数，默认为10
- `search`：搜索关键词，可选


**响应示例**：

```json
{
  "records": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "合同文件.pdf",
      "date": "2025-03-08 14:25",
      "seals": 1,
      "status": "有效",
      "confidence": 98.0,
      "imageUrl": "http://localhost:9000/seal-recognition/results/result_550e8400-e29b-41d4-a716-446655440000.pdf?X-Amz-Algorithm=..."
    }
  ],
  "totalPages": 1,
  "totalRecords": 1,
  "currentPage": 1
}
```

**删除历史记录**：

**接口**：`DELETE /api/history/{id}`

**功能**：删除指定的历史记录

**请求参数**：

- `id`：历史记录ID


**响应示例**：

```json
{
  "message": "记录已删除"
}
```

**下载历史记录报告**：

**接口**：`GET /api/history/{id}/download`

**功能**：下载识别结果报告

**请求参数**：

- `id`：历史记录ID


**响应**：文件下载（重定向到MinIO预签名URL）

## 使用示例

### 使用curl进行API测试

1. 单文件识别


```shellscript
curl -X POST http://localhost:1111/api/recognize \
  -F "file=@/path/to/your/file.pdf" \
  -H "Accept: application/json"
```

2. 批量处理


```shellscript
curl -X POST http://localhost:1111/api/batch-process \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.pdf" \
  -H "Accept: application/json"
```

3. 获取历史记录


```shellscript
curl -X GET "http://localhost:1111/api/history?page=1&limit=10" \
  -H "Accept: application/json"
```

### 使用前端界面

1. 访问前端应用


在浏览器中打开 [http://localhost:3000](http://localhost:3000)

2. 单文件识别

1. 点击"文档识别"选项卡
2. 上传文件并点击"开始识别"按钮
3. 查看识别结果



3. 批量处理

1. 点击"批量处理"选项卡
2. 添加多个文件并点击"开始处理"按钮
3. 查看处理进度和结果



4. 历史记录

1. 点击"历史记录"选项卡
2. 浏览、搜索和管理历史识别记录





## 常见问题与解决方案

### 数据库连接问题

**问题**：无法连接到PostgreSQL数据库

**解决方案**：

1. 检查PostgreSQL容器是否正常运行：

```shellscript
docker ps | grep postgres
```


2. 检查数据库连接配置是否正确：

```shellscript
cat config.py
```


3. 尝试手动连接数据库：

```shellscript
docker exec -it seal-recognition-postgres psql -U vlou -d detect
```




### MinIO连接问题

**问题**：无法上传文件到MinIO或获取文件URL

**解决方案**：

1. 检查MinIO容器是否正常运行：

```shellscript
docker ps | grep minio
```


2. 检查MinIO连接配置是否正确：

```shellscript
cat config.py
```


3. 通过MinIO控制台检查存储桶是否存在：

1. 访问 [http://localhost:9001](http://localhost:9001)
2. 登录并检查"seal-recognition"存储桶





### API服务启动失败

**问题**：API服务无法启动或频繁崩溃

**解决方案**：

1. 检查日志：

```shellscript
docker logs seal-recognition-api
```


2. 确保数据库表已正确创建：

```shellscript
docker exec -it seal-recognition-postgres psql -U vlou -d detect -c "\dt"
```


3. 检查依赖项是否正确安装：

```shellscript
docker exec -it seal-recognition-api pip list
```




### 数据库表结构不匹配

**问题**：代码与数据库表结构不匹配，导致查询错误

**解决方案**：

1. 检查数据库表结构：

```shellscript
docker exec -it seal-recognition-postgres psql -U vlou -d detect -c "\d seal_recognitions"
```


2. 确保模型定义与数据库表结构一致：

```python
# 检查 models.py 中的定义
class SealRecognition(Base):
    __tablename__ = "seal_recognitions"
    # 列定义应与数据库表结构匹配
```


3. 如需重建表，可以执行：

```shellscript
docker exec -it seal-recognition-api python -c "from backend.database.db import Base, engine; Base.metadata.drop_all(engine); Base.metadata.create_all(engine)"
```




---

本文档提供了印章识别系统的完整部署和使用指南。如有其他问题，请联系系统管理员或开发团队。