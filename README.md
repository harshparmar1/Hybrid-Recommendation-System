# Hybrid Recommendation System

AI-powered product recommendation platform built with FastAPI and React.

The project combines KMeans user clustering with cosine similarity-based collaborative filtering to generate personalized product suggestions, and includes a modern analytics dashboard for recommendation insights.

## Table of Contents

- Overview
- Features
- Tech Stack
- Project Structure
- How It Works
- API Endpoints
- Local Setup
- Running the Project
- Sample Usage
- Performance Optimizations
- Troubleshooting
- Future Improvements

## Overview

This repository contains a full-stack recommendation system:

- Backend: FastAPI service that loads interaction data, trains a hybrid recommendation model, and serves recommendation and metrics endpoints.
- Frontend: React + Vite dashboard for searching users, fetching recommendations, visualizing metrics, and exploring category/price/brand analytics.

The system uses weighted user behavior events:

- view = 1
- cart = 3
- purchase = 5

These event weights are aggregated into a user-item interaction matrix and used for collaborative recommendation scoring.

## Features

- Hybrid recommendation strategy (KMeans + cosine similarity)
- Popularity fallback for cold-start or sparse users
- Category diversity control in top-N recommendations
- Random sample user picker for quick demo flows
- Evaluation metrics endpoint with cached results
- Frontend analytics charts:
  - Category distribution
  - Score trend
  - Price distribution
  - Top brands
- Rich UI with loading states, skeletons, and product detail modal
- Startup optimizations with lazy model initialization and background warmup

## Tech Stack

### Backend

- Python 3.10+
- FastAPI
- Uvicorn
- Pandas
- scikit-learn

### Frontend

- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Recharts

## Project Structure

	Recommand-System/
	├─ backend/
	│  ├─ final_data.csv
	│  ├─ main.py
	│  ├─ model.py
	│  └─ requirements.txt
	├─ frontend/
	│  ├─ index.html
	│  ├─ package.json
	│  ├─ tailwind.config.js
	│  └─ src/
	│     ├─ App.jsx
	│     ├─ index.css
	│     ├─ main.jsx
	│     ├─ components/
	│     └─ services/
	├─ .gitignore
	└─ README.md

## How It Works

### 1) Data Preparation

- Loads CSV dataset with user, product, event_type, category, brand, and price fields.
- Fills missing brand/category values.
- Converts event_type into numeric interaction scores.
- Filters to top users and products to control memory/time.

### 2) User Modeling

- Builds a sparse user-item matrix from interaction scores.
- Clusters users with KMeans.

### 3) Candidate Generation

- For a target user, selects users from the same cluster.
- Computes cosine similarity against candidate users.
- Aggregates weighted product scores from similar users.

### 4) Ranking and Diversity

- Ranks products by score.
- Enforces per-category cap to improve recommendation diversity.
- Fallbacks to popular products when needed.

### 5) Evaluation

- Hold-out evaluation for sampled users.
- Reports Precision@K, Recall@K, F1, NDCG@K, Hit Rate, Coverage, MAP.

## API Endpoints

Base URL:

	http://127.0.0.1:8000

### Health

	GET /

Returns service and model load status.

### Recommendations

	GET /recommend/{user_id}?limit=10

Response:

- user_id
- count
- recommendations list with:
  - product_id
  - category
  - brand
  - price
  - score
  - image_url (if available)

### Sample Users

	GET /users/sample?limit=10

Returns sample user IDs available in the training matrix.

### Metrics

	GET /metrics?sample_size=100&top_k=10

Returns recommendation quality metrics and model statistics.

## Local Setup

### 1) Clone Repository

	git clone https://github.com/harshparmar1/Hybrid-Recommendation-System.git
	cd Hybrid-Recommendation-System

### 2) Backend Setup

	cd backend
	python -m venv .venv
	.venv\Scripts\activate
	pip install -r requirements.txt

### 3) Frontend Setup

Open a new terminal:

	cd frontend
	npm install

## Running the Project

### Start Backend

From backend folder:

	python -m uvicorn main:app --reload --port 8000

From project root:

	python -m uvicorn backend.main:app --reload --port 8000

### Start Frontend

	cd frontend
	npm run dev

Then open the local Vite URL shown in terminal (usually http://127.0.0.1:5173).

## Sample Usage

1. Open dashboard.
2. Click Random User or enter a user ID manually.
3. Click Get Recommendations.
4. Explore charts in Evaluation Metrics and Analytics sections.

## Performance Optimizations

- Lazy backend model initialization
- Background warmup on startup
- Thread-safe singleton model loading
- Reduced default model size for faster first response
- Cached metrics endpoint using function-level LRU cache
- On-demand similarity scoring instead of full user-user similarity matrix precompute

## Troubleshooting

### Random user suggestions not appearing

- Ensure backend is running on port 8000.
- Check frontend API base in frontend/src/services/api.js.
- Verify endpoint manually:

	  http://127.0.0.1:8000/users/sample?limit=5

### Error: Could not import module "main"

- Run from backend folder with:

	  python -m uvicorn main:app --reload --port 8000

- Or from root with:

	  python -m uvicorn backend.main:app --reload --port 8000

### Git push rejected (fetch first)

Use:

	git pull --rebase origin main
	git push -u origin main

## Future Improvements

- Add authentication and user session persistence
- Add model retraining pipeline and scheduled refresh
- Add offline experiment tracking and A/B testing
- Add Docker setup for one-command deployment
- Add CI checks and automated tests for API and UI

---

If you found this project useful, consider starring the repository.
