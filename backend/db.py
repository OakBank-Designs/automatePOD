# backend/db.py

import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session
from typing         import Generator

# Load environment variables from .env
load_dotenv()

# Configure your database URL (falls back to a local SQLite file)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

# Create the SQLModel engine with SQL echo enabled for debugging
engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    """Recreate all tables (drops existing schema)."""
    # Drop all existing tables
    #SQLModel.metadata.drop_all(engine)
    # Create tables based on your SQLModel models
    SQLModel.metadata.create_all(engine)

def get_session():
    """Yield a new database session for dependency injection."""
    with Session(engine) as session:
        yield session