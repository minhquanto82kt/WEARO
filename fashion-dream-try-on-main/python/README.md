# UPTHINK Python Backend

Python services for UPTHINK Fashion Dream.

## Supported runtime

This backend targets **CPython** only.

| Version | Status |
|---------|--------|
| **Python 3.12** | Recommended (used in CI) |
| **Python 3.11** | Supported |
| Other implementations (PyPy, MicroPython, Stackless, Pyston…) | **Not supported** |

Use a standard CPython installation. The project is not tested against alternative Python implementations.

A `.python-version` file is provided for tools such as `pyenv` or `asdf`.

## Purpose

This layer owns backend capabilities that should not run in the React/TanStack frontend:

- AI Try-On orchestration
- image validation and normalization
- private Try-On asset storage
- product image analysis (Product Vision)
- catalog attribute enrichment
- deterministic product recommendations
- explainable AI Stylist recommendations
- future fashion-profile intelligence and analytics

## Current status

### P0 — Foundation

FastAPI application structure, configuration, tests, and CI foundation are in place.

### P1 — Supabase bridge

The backend reads active products from the existing `public.products` table through a server-side Supabase client. The Supabase service-role key is never exposed to the frontend.

### P2 — Image and Storage foundation

The image layer supports JPEG, PNG, and WebP validation, a 10 MB upload limit, MIME/file-format verification, safe dimension and pixel checks, EXIF orientation normalization, and WebP conversion capped at 4096 px per dimension. Try-On assets use deterministic user/job-scoped paths in a private Supabase Storage bucket and short-lived signed URLs.

### P3 — AI and recommendation foundation

The backend now includes:

- authenticated Try-On job lifecycle with provider abstraction and failure handling
- Product Vision with Stub/Gemini provider abstraction
- normalized Product Vision attributes
- persistence through `product_vision_attributes`
- deterministic recommendation scoring backed by persisted Product Vision attributes
- protected `/api/recommendations` endpoint
- explainable AI Stylist layer and protected `/api/stylist/recommend` endpoint

The default AI providers remain safe/configurable. Real provider credentials are server-side only.

## API surface

```text
GET  /health
GET  /api/products
GET  /api/products/{product_id}
POST /api/images/validate
POST /api/images/normalize
POST /api/try-on/jobs
GET  /api/try-on/jobs/{job_id}
POST /api/product-vision/analyze
POST /api/recommendations
POST /api/stylist/recommend
```

Protected AI endpoints require `Authorization: Bearer <Supabase access token>`.

## Recommendation strategy

Recommendation v1 is deliberately deterministic. It scores catalog products using:

- style match: 40 points
- color match: 30 points
- garment type match: 20 points
- within-budget: 10 points

Product Vision attributes are read from `product_vision_attributes`; the engine does not modify catalog data while recommending.

## Structure

```text
python/
├── app/
│   ├── api/
│   │   ├── health.py
│   │   ├── products.py
│   │   ├── images.py
│   │   ├── try_on.py
│   │   ├── product_vision.py
│   │   ├── recommendations.py
│   │   └── stylist.py
│   ├── core/
│   │   └── config.py
│   ├── db/
│   │   └── supabase.py
│   ├── models/
│   │   ├── product.py
│   │   ├── product_vision.py
│   │   ├── recommendation.py
│   │   └── stylist.py
│   ├── services/
│   │   ├── image_service.py
│   │   ├── storage_service.py
│   │   ├── product_service.py
│   │   ├── product_vision_service.py
│   │   ├── product_vision_repository.py
│   │   ├── catalog_enrichment_service.py
│   │   ├── recommendation_service.py
│   │   └── stylist_service.py
│   └── main.py
├── tests/
├── .env.example
├── .python-version
├── requirements.txt
└── README.md
```

## Local development

1. Use **CPython 3.11 or 3.12** (3.12 recommended).
2. Create a virtual environment and install dependencies:

```bash
cd fashion-dream-try-on-main/python
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt   # for tests
```

3. Run the API:

```bash
uvicorn app.main:app --reload
```

Health check:

```text
GET /health
```

## Security

Never commit `.env`, Supabase service-role keys, API keys, model credentials, or other secrets. The service-role key must remain server-side only.
