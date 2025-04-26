# backend/api/niche_routes.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
import httpx
from typing import List, Optional
from sqlmodel import Session, select
from db import get_session
from models import Niche

router = APIRouter(prefix="/niches", tags=["Niches"])

# 1) List all stored niches
@router.get("/", response_model=List[Niche])
def list_niches(*, session: Session = Depends(get_session)):
    niches = session.exec(select(Niche)).all()
    return niches


# 2) AI-powered suggestions
class SuggestRequest(BaseModel):
    product_type: Optional[str] = None

class SuggestResponse(BaseModel):
    suggestions: List[str]

@router.post("/suggest", response_model=SuggestResponse)
async def suggest_niches(request: SuggestRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    prompt = (
        f"Suggest 5 niche or sub-niche categories for print-on-demand products "
        f"in the '{request.product_type}' category."
        if request.product_type
        else "Suggest 5 niche or sub-niche categories for print-on-demand products."
    )

    headers = {"Authorization": f"Bearer {api_key}"}
    json_data = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 100
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=json_data
        )
        except httpx.ReadTimeout:
            raise HTTPException(
                status_code=504,
                detail="OpenAI request timed out. Please try again."
            )

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=f"OpenAI error: {resp.text}")

    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    # Split out each line, strip bullet markers and whitespace
    suggestions = [line.lstrip("- ").strip() for line in content.splitlines() if line.strip()]

    return SuggestResponse(suggestions=suggestions)


# 3) Store a chosen niche
class NicheSelect(BaseModel):
    name: str
    parent_id: Optional[int] = None
    user_id: int

@router.post("/choose", response_model=Niche)
def choose_niche(
    select: NicheSelect,
    session: Session = Depends(get_session)
):
    niche = Niche(
        name=select.name,
        parent_id=select.parent_id,
        user_id=select.user_id
    )
    session.add(niche)
    session.commit()
    session.refresh(niche)
    return niche