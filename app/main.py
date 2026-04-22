from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import analytics, companies, decide, events, feedback, metrics, mock, notify, users
from app.config.init_db import init_db
from app.config.settings import settings

def create_app() ->FastAPI:
    app = FastAPI(
        title = settings.app_name,
        description = "Notification Decision Intelligence API",
        version = settings.app_version
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def startup():
        init_db()

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "message": exc.detail,
                "data": {},
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "status": "error",
                "message": "Validation error",
                "data": {"errors": exc.errors()},
            },
        )

    app.include_router(companies.router, prefix="/companies", tags=["Companies"])
    app.include_router(decide.router, prefix="/decide", tags=["Decision Intelligence"])
    app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])
    app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
    app.include_router(mock.router, prefix="/mock", tags=["Mock Data"])
    app.include_router(events.router, prefix="/events", tags=["Events"])
    app.include_router(notify.router, prefix="/notify", tags=["Notify"])
    app.include_router(users.router, prefix="/users", tags=["Users"])
    app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

    @app.get("/")
    def root():
        return {"message": "Nudge AI is running"}
    
    return app

app = create_app()

