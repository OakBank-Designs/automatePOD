# backend/models.py
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship # type: ignore
from typing      import Optional
from sqlalchemy  import Column, JSON # type: ignore


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True)
    password_hash: str
    products: List["Product"] = Relationship(back_populates="user")

class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
        # Printify metadata
    blueprint_id:    int
    print_provider_id: int
    title:           str
    description:     str
    safety_information: str
    status:          str = Field(default="draft")

    # Raw JSON blob for variants + print_areas
    payload: Optional[dict] = Field(
      sa_column=Column(JSON),
      default=None,
      description="Holds { variants: [...], print_areas: [...] }"
    )
    user: Optional[User] = Relationship(back_populates="products")
    designs: List["Design"] = Relationship(back_populates="product")

class Design(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id")
    design_type: str
    text_content: Optional[str]
    image_url: str
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    product: Optional[Product] = Relationship(back_populates="designs")
    metadata_items: List["Metadata"] = Relationship(back_populates="design")

class Metadata(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    design_id: int = Field(foreign_key="design.id")
    title: str
    description: str
    tags: str  # e.g. comma-separated
    design: Optional[Design] = Relationship(back_populates="metadata_items")

class Niche(SQLModel, table=True):
    """
    A printable product niche or sub-niche selected by the user.
    """
    id:         Optional[int] = Field(default=None, primary_key=True)
    name:       str           = Field(..., description="Niche or sub-niche name")
    parent_id:  Optional[int] = Field(default=None, foreign_key="niche.id",
                                      description="Parent niche ID, if this is a sub-niche")
    user_id:    Optional[int] = Field(default=None, foreign_key="user.id",
                                      description="ID of the user who selected this niche")


# Template models
class TemplateBase(SQLModel):
    name: str = Field(..., description="Name of the template")
    products: Optional[Any] = Field(
      default=None,
      sa_column=Column("products", JSON, nullable=True),
      description="List of product blueprint IDs"
    )
    variants: Optional[Any] = Field(
      default=None,
      sa_column=Column("variants", JSON, nullable=True),
      description="Map of blueprint ID to variant ID list"
    )

class Template(TemplateBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", description="Owner user ID")

class TemplateCreate(TemplateBase):
    user_id: int = Field(..., description="Owner user ID")

class TemplateRead(TemplateBase):
    id: int
    user_id: int