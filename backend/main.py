from dotenv import load_dotenv
import os
from fastapi import FastAPI

load_dotenv()  
app = FastAPI()

#API_KEY = os.getenv("API_KEY")

@app.get("/")
def read_root():
    return {"message": "Backend is running"}
