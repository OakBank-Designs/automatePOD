# backend/api/product_routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select # type: ignore
from typing import List

from db import get_session
from models import Product, Product as ProductModel
from pydantic import BaseModel
from typing  import Optional, Dict, Any

router = APIRouter(prefix="/products", tags=["Products"])

class ProductCreate(BaseModel):
    user_id: int
    blueprint_id:    int
    print_provider_id: int
    title:           str
    description:     str
    safety_information: str
    payload:         Optional[Dict[str, Any]]

@router.post("/", response_model=ProductModel, status_code=status.HTTP_201_CREATED)
def create_product(
    body: ProductCreate,
    session: Session = Depends(get_session),
):
    product = Product(**body.dict())
    session.add(product)
    session.commit()
    session.refresh(product)
    return product

@router.get("/", response_model=List[ProductModel])
def list_products(
    user_id: int,  # pass ?user_id=123 in the query
    session: Session = Depends(get_session),
):
    statement = select(Product).where(Product.user_id == user_id)
    results = session.exec(statement).all()
    return results

@router.get("/{product_id}", response_model=ProductModel)
def get_product(
    product_id: int,
    session: Session = Depends(get_session),
):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product