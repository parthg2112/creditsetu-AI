# LendReady AI

Automated SME Loan Auditing & Gap Analysis powered by Next.js, FastAPI, and LlamaIndex.

## 🚀 How to Start

### Option A: Development (Recommended for speed)

Run these in separate terminal windows:

**1. Backend (The Brain)**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**2. Frontend (The Face)**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Option B: Production / Docker

To run both services together in containers:

```bash
docker-compose up --build
```

---

## 📂 Project Structure

A decoupled yet unified architecture: separation of concerns with a verified proxy connection.

```text
lendready-ai/
├── .env                  # Shared environment variables (API keys, DB URLs)
├── docker-compose.yml    # Orchestration for running both services
├── README.md             # This guide
│
├── frontend/             # Next.js 15 + Tailwind CSS + TypeScript
│   ├── src/app           # App Router pages and layouts
│   ├── src/components    # React components (Shadcn UI + Custom)
│   │   └── file-uploader.tsx  # Document upload with progress & API integration
│   ├── src/db            # Database layer
│   │   └── schema.ts     # Drizzle ORM definitions (Loans & Vector Embeddings)
│   └── next.config.mjs   # Configures Proxy to Backend (/api/python/* -> localhost:8000)
│
└── backend/              # FastAPI + LlamaIndex + Python
    ├── app/
    │   ├── main.py       # API Entry point & /audit-loan endpoint
    │   ├── engine/       # RAG Logic & Document Processing (Placeholder)
    │   └── core/         # Configuration & Schemas
    ├── scripts/          # Utility scripts (e.g., LlamaParse testing)
    └── requirements.txt  # Python dependencies
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, Shadcn UI, Drizzle ORM, Supabase Client
- **Backend**: FastAPI, LlamaIndex, LlamaParse, Pydantic
- **Database**: PostgreSQL (via Supabase) with pgvector extension
