# Campus Customs

A Yale apparel store website with an AI shopping assistant ("Handsome Dan"),
built for MGT 409 HW4.

- **Frontend:** React + Vite + TypeScript (`frontend/`)
- **Backend:** Python FastAPI + PydanticAI agent (`backend/`)
- **Data:** SQLite catalogue, inventory, users, and chat history (local `data/`)

## Features
- Browse 102 Yale products, per-item pages with sizes, live stock, and quantity.
- Filters by type, size, price range, and color (with an independent scrollbar).
- Accounts: create / log in (PBKDF2-hashed passwords).
- Chat assistant that answers about products, prices, and stock using only the
  database (never invents), shows matching products on the page, remembers
  logged-in customers, and stays on-topic and Yale-compliant.

## Setup

### 1. Environment
Create a `.env` in the **project root** (see `.env.example`) with:
```
PORTKEY_API_KEY=your-portkey-api-key-here
```

### 2. Data pack (local, not in git)
Place the data pack at `data/`:
```
data/campus_customs.db
data/products/        # product images
```

### 3. Backend (from `backend/`)
```
pip install -r ../requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Frontend (from `frontend/`)
```
npm install
npm run dev          # http://localhost:5173 (proxies /api and /images to :8000)
```

## Models
- Website/front-end copy: `gpt-5.6-luna`
- Agent: `gpt-6-astra` (via the Portkey gateway, OpenAI Responses endpoint)

## Project layout
```
hw4/
├── AI_prompts.md          # log of every prompt sent to the AI, per problem
├── requirements.txt
├── .env.example
├── README.md
├── frontend/              # Vite React TypeScript app
├── backend/               # FastAPI app + agent
│   ├── main.py            # run: uvicorn main:app --reload --port 8000
│   ├── agent.py
│   ├── models.py
│   ├── tools.py
│   ├── auth.py
│   ├── audit.py
│   └── prompts/prompt.md
└── output/
    ├── harness.md
    ├── design.md
    ├── usability.md
    ├── app_check.html
    ├── app_check_images/
    └── audit_trail.json
```

*A student project for MGT 409. Not an official Yale University store.*
