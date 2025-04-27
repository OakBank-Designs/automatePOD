from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Any, List
import os
import httpx # type: ignore
import openai
import json

from sqlmodel import Session # type: ignore
from db import get_session
from models import Product
from services.printify_service import get_printify_catalog
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict


router = APIRouter(tags=["Printify"])

from pydantic import BaseModel

class Shop(BaseModel):
    id:    int
    title: str

@router.get("/shops", response_model=List[Shop])
async def list_shops():
    """
    Fetch all Printify shops available under the configured API key.
    """
    api_key = os.getenv("PRINTIFY_API_KEY")
    if not api_key:
        raise HTTPException(500, detail="Printify API key not configured")

    url = "https://api.printify.com/v1/shops.json"
    headers = {"Authorization": f"Bearer {api_key}"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, detail=f"Printify error: {resp.text}")

    data = resp.json()
    # Handle both dict-wrapped and bare‐list responses:
    if isinstance(data, dict):
        shops = data.get("data") or data.get("shops") or []
    elif isinstance(data, list):
        shops = data
    else:
        shops = []

    return shops

@router.post("/upload-image", response_model=Any)
async def upload_image(
    url: str = Body(...),
    file_name: str = Body(...),
):
    """
    Upload an image to Printify via URL.
    Expects JSON payload with fields `url` and `file_name`.
    """
    api_key = os.getenv("PRINTIFY_API_KEY")
    if not api_key:
        raise HTTPException(500, "Missing Printify API key")

    upload_url = "https://api.printify.com/v1/uploads/images.json"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type":  "application/json",
    }
    payload = {
        "url":       url,
        "file_name": file_name,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(upload_url, json=payload, headers=headers)

    if resp.status_code not in (200, 201):
        raise HTTPException(resp.status_code, f"Upload failed: {resp.text}")

    return resp.json()

@router.get("/catalog")
async def get_catalog():
    return get_printify_catalog()

# @router.get("/catalog/{product_id}/variants")
# async def get_variants(product_id: int):
#     return get_printify_catalog(product_id)

@router.post("/create", status_code=status.HTTP_201_CREATED, response_model=Any)
async def create_printify_product(
    product_id: int,
    shop_id:    int,                          # <-- new!
    session:    Session = Depends(get_session),
):
    # 1) Load the product from your DB
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")

    # 2) Build the Printify payload by merging your fields + JSON blob
    body = {
        "title":              product.title,
        "description":        product.description,
        "safety_information": product.safety_information,
        "blueprint_id":       product.blueprint_id,
        "print_provider_id":  product.print_provider_id,
        **(product.payload or {}),
    }

    # 3) Forward to Printify exactly as before
    #api_key = os.getenv("PRINTIFY_API_KEY")
    #url = f"https://api.printify.com/v1/shops/{os.getenv('PRINTIFY_SHOP_ID')}/products.json"
    url = f"https://api.printify.com/v1/shops/{shop_id}/products.json"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type":  "application/json",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=body, headers=headers)
        if resp.status_code not in (200, 201):
            raise HTTPException(resp.status_code, detail=resp.text)
        return resp.json()
    

# openai.api_key = os.getenv("OPENAI_API_KEY")
# class ProductForCat(BaseModel):
#     id: int
#     title: str
#     description: str = ""

# @router.post("/classify")
# async def classify_products(items: List[ProductForCat]) -> Dict[int, str]:
#     # Build a prompt grouping all products, e.g.:
#     prompt = "Classify each of these products into a single one-word category (e.g. TShirts, Hoodies, Sweatshirts, Long Sleeves, Tank Tops etc):\n\n"
#     for p in items:
#         prompt += f"{p.id}. {p.title} — {p.description}\n"
#     prompt += "\nRespond as JSON mapping ids to categories, e.g.: {\"1\":\"TShirts\",\"2\":\"Bags\",…}"

#     resp = await openai.ChatCompletion.acreate(
#         model="gpt-4-0613",
#         messages=[{"role":"user","content":prompt}],
#         temperature=0,
#     )
#     content = resp.choices[0].message.content
#     # Parse the JSON out of content
#     return json.loads(content)