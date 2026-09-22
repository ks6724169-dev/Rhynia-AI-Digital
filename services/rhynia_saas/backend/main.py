"""
Rhynia Intelligence SaaS — Main Application Entrypoint
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from services.rhynia_saas.backend.config import settings
from services.rhynia_saas.backend.database import init_db
from services.rhynia_saas.backend.routers import auth, chat, feedback, files, profile, sessions


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Ensure database tables exist on startup
    init_db()
    yield


# Initialize FastAPI application
app = FastAPI(
    title="Rhynia Intelligence API",
    description="Rhynia Intelligence SaaS Platform Core API",
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url=None,
    lifespan=lifespan,
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Ensure strict branding and security headers on every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Server"] = "Rhynia"
    return response


# Include Modular Routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(sessions.router)
app.include_router(files.router)
app.include_router(profile.router)
app.include_router(feedback.router)

from pathlib import Path
from fastapi.staticfiles import StaticFiles

# Mount Frontend Web Application
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/app", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


@app.get("/", tags=["General"])
async def root():
    """Root platform status check."""
    return JSONResponse(
        status_code=200,
        content={
            "status": "online",
            "platform": "Rhynia Intelligence",
            "version": settings.APP_VERSION,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """System health inspection endpoint."""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "version": settings.APP_VERSION,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "services.rhynia_saas.backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
