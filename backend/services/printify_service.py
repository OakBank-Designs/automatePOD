import httpx # type: ignore
import os
from dotenv import load_dotenv

load_dotenv()

PRINTIFY_API_KEY = os.getenv("PRINTIFY_API_KEY")
BASE_URL = "https://api.printify.com/v1"

HEADERS = {
    "Authorization": f"Bearer {PRINTIFY_API_KEY}",
    "Content-Type": "application/json"
}

# Store ID is required for some calls; we'll handle that later
def get_printify_catalog():
    """Fetches the full Printify product catalog"""
    url = f"{BASE_URL}/catalog/blueprints.json"
    try:
        response = httpx.get(url, headers=HEADERS)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        print(f"[Printify] Error fetching catalog: {exc}")
        return []