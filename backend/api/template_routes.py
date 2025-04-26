from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from models import Template, TemplateCreate, TemplateRead
from db import get_session

router = APIRouter(prefix="/templates", tags=["templates"])

@router.get("/", response_model=List[TemplateRead])
def list_templates(*, session: Session = Depends(get_session)):
    templates = session.exec(select(Template)).all()
    return templates

@router.post("/", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
def create_template(
    *, 
    template_in: TemplateCreate, 
    session: Session = Depends(get_session)
):
    template = Template.from_orm(template_in)
    session.add(template)
    session.commit()
    session.refresh(template)
    return template