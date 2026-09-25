import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import re
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.config.settings import settings

logger = logging.getLogger("arena.main")

app = FastAPI(
    title="ARENA API",
    description="The Operating System for AI Workers - Multi-Agent Orchestration & Evaluation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    raw_msg = str(exc)
    sanitized_msg = raw_msg
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY in sanitized_msg:
        sanitized_msg = sanitized_msg.replace(settings.GROQ_API_KEY, "[REDACTED_API_KEY]")
    if "@" in sanitized_msg and "://" in sanitized_msg:
        sanitized_msg = re.sub(r'://([^:]+):([^@]+)@', r'://\1:[REDACTED_PASSWORD]@', sanitized_msg)
        
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {sanitized_msg}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

from app.api.endpoints import router
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to ARENA API", "version": "1.0.0", "status": "online"}
