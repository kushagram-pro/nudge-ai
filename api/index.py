from fastapi import FastAPI

from app.main import app as backend_app
from app.config.init_db import init_db

init_db()

app = FastAPI()
app.mount("/api", backend_app)
