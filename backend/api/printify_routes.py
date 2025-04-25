from fastapi import APIRouter
from backend.services.printify_service import get_printify_catalog


router = APIRouter(prefix="/printify", tags=["Printify"])

@router.get("/catalog")
def fetch_catalog():
    return {"products": get_printify_catalog()}