from pathlib import Path
from functools import lru_cache
import threading

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

try:
    from .model import HybridRecommender
except ImportError:
    from model import HybridRecommender


app = FastAPI(title="Hybrid Recommendation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).resolve().parent / "final_data.csv"
model_error = None
recommender = None
_model_lock = threading.Lock()

# Tuned defaults for faster cold-start while preserving recommendation quality.
DEFAULT_CLUSTERS = 8
DEFAULT_MAX_USERS = 2000
DEFAULT_MAX_PRODUCTS = 8000


def get_recommender() -> HybridRecommender:
    global recommender, model_error
    if recommender is not None:
        return recommender

    with _model_lock:
        if recommender is not None:
            return recommender

        try:
            recommender = HybridRecommender(
                str(DATA_PATH),
                n_clusters=DEFAULT_CLUSTERS,
                max_users=DEFAULT_MAX_USERS,
                max_products=DEFAULT_MAX_PRODUCTS,
            )
            model_error = None
            return recommender
        except Exception as exc:
            model_error = str(exc)
            raise HTTPException(status_code=500, detail=f"Model initialization failed: {model_error}") from exc


def _warmup_model() -> None:
    try:
        get_recommender()
    except Exception:
        # Error is stored in model_error and surfaced by endpoints.
        pass


@app.on_event("startup")
def startup_event() -> None:
    threading.Thread(target=_warmup_model, daemon=True).start()


@app.get("/")
def read_root() -> dict:
    return {
        "message": "Hybrid Recommendation API is running",
        "model_loaded": recommender is not None,
        "model_error": model_error,
    }


@app.get("/recommend/{user_id}")
def recommend(user_id: int, limit: int = Query(10, ge=1, le=50)) -> dict:
    model = get_recommender()

    if not model.has_user(user_id):
        raise HTTPException(
            status_code=404,
            detail={
                "message": "User ID not found in training data.",
                "sample_user_ids": model.sample_user_ids(limit=10),
            },
        )

    try:
        recommendations = model.recommend_for_user(user_id=user_id, top_n=limit)
        return {
            "user_id": user_id,
            "count": len(recommendations),
            "recommendations": recommendations,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {exc}") from exc


@app.get("/users/sample")
def sample_users(limit: int = Query(10, ge=1, le=50)) -> dict:
    model = get_recommender()

    return {
        "count": limit,
        "user_ids": model.sample_user_ids(limit=limit),
    }


@app.get("/metrics")
def get_metrics(sample_size: int = Query(100, ge=10, le=500), top_k: int = Query(10, ge=1, le=50)) -> dict:
    get_recommender()

    try:
        result = _cached_metrics(sample_size=sample_size, top_k=top_k)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Metrics computation failed: {exc}") from exc


@lru_cache(maxsize=12)
def _cached_metrics(sample_size: int, top_k: int) -> dict:
    model = get_recommender()
    return model.evaluate_model(sample_size=sample_size, top_k=top_k)

