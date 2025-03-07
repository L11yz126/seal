from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.router.detect import detect_routers

def server() -> FastAPI:
    fast = FastAPI()

    # CORS
    fast.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    detect_routers(fast)

    return fast


if __name__ == "__main__":
    app = server()
    import uvicorn

    uvicorn.run('server:server', host='0.0.0.0', port=1111, reload=True)
