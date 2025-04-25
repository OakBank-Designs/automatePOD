from dotenv import load_dotenv
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import init_db, get_session
from sqlmodel import Session
from api.product_routes  import router as product_router

#from backend.api.printify_routes import router as printify_router
from api.printify_routes import router as printify_router
from api.niche_routes import router as niche_router

load_dotenv()  
app = FastAPI()

@app.on_event("startup")
def on_startup():
   init_db()

# (Optional) Example dependency you can use in routers:
def get_db():
    yield from get_session()

# 🔐 CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:5173"] for stricter access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(printify_router)
app.include_router(niche_router)
app.include_router(product_router)