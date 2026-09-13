from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.fraud import router as fraud_router
from app.api.transactions import router as transaction_router
from app.api.receipts import router as receipt_router

from app.core.config import settings
from app.core.database import Base, engine

from app.models import Transaction, User


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for the AI-Based Financial Fraud Detection System",
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(transaction_router)
app.include_router(fraud_router)
app.include_router(admin_router)
app.include_router(receipt_router)


@app.get("/")
def root():
    return {
        "message": f"{settings.APP_NAME} API is running",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "debug": settings.DEBUG,
    }