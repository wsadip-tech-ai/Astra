import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import InternalSecretMiddleware

app = FastAPI(title="Astra Astrology Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(InternalSecretMiddleware)


@app.get("/health")
async def health():
    return {"status": "ok"}
