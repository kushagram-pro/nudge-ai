from fastapi import FastAPI
from app.api.routes import events, notify, users, analytics

def create_app() ->FastAPI:
    app = FastAPI(
        title = "NudgeAI",
        description = "Context-aware Notification Engine",
        version = "1.0.0"
    )

    app.include_router(events.router, prefix="/events", tags=["Events"])
    app.include_router(notify.router, prefix="/notify", tags=["Notify"])
    app.include_router(users.router, prefix="/users", tags=["Users"]);
    app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

    @app.get("/")
    def root():
        return {"message": "Nudge AI is running"}
    
    return app

app = create_app()

