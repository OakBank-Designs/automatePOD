from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.printify_routes import router as printify_router
from api.template_routes import router as template_router

app = FastAPI()


# ─── CORS SETUP ──────────────────────────────────────────────────────────────
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # ← only explicitly allow http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ─────────────────────────────────────────────────────────────────────────────

# mount our API routers
app.include_router(printify_router, prefix="/printify")
app.include_router(template_router, prefix="/templates")