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


from app.routes.western import router as western_router
from app.routes.vedic import router as vedic_router

app.include_router(western_router)
app.include_router(vedic_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
