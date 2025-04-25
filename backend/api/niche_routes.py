# backend/api/niche_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os, openai

openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter(prefix="/niches", tags=["Niches"])

class SuggestRequest(BaseModel):
    prompt: str

@router.post("/suggest")
async def suggest_niches(req: SuggestRequest):
    try:
        resp = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You’re an expert at generating print-on-demand niches."},
                {"role": "user", "content": f"Suggest 5 niche or sub-niche ideas for: {req.prompt}"}
            ],
            max_tokens=150,
            temperature=0.8,
        )
        text = resp.choices[0].message.content
        # split on lines or commas into a list
        suggestions = [s.strip() for s in text.replace("\r","").split("\n") if s.strip()]
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(500, detail=str(e))