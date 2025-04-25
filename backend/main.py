from dotenv import load_dotenv
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

#from backend.api.printify_routes import router as printify_router
from api.printify_routes import router as printify_router

load_dotenv()  
app = FastAPI()

#API_KEY = os.getenv("API_KEY")

@app.get("/")
def read_root():
    return {"message": "Backend is running"}

# 🔐 CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:5173"] for stricter access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(printify_router)