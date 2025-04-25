from dotenv import load_dotenv
import os
from fastapi import FastAPI

from backend.api.printify_routes import router as printify_router

load_dotenv()  
app = FastAPI()

#API_KEY = os.getenv("API_KEY")

@app.get("/")
def read_root():
    return {"message": "Backend is running"}

app.include_router(printify_router)