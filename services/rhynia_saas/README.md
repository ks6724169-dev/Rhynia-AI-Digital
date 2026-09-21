# Rhynia Intelligence SaaS v1.0

> **Platform:** Enterprise-Grade Conversational Intelligence Platform  
> **Architecture:** 3-Tier Layered Decoupled Architecture (FastAPI + Supabase PostgreSQL + Vanilla JS)  
> **Brand Policy:** Strictly **Rhynia** (Zero Leakage)

---

## 🏗️ Architecture Overview

```
services/rhynia_saas/
├── backend/                  <- Python + FastAPI Core API Server
│   ├── config.py             <- Pydantic Settings & Environment
│   ├── main.py               <- App Entrypoint, CORS, Security Headers
│   ├── requirements.txt      <- Clean Backend Dependencies
│   ├── database.py           <- SQLAlchemy Models & DB Session (Sprint 1)
│   ├── auth.py               <- BCrypt, JWT, Google OAuth & OTP (Sprint 1)
│   └── llm_engine.py         <- 3-Tier Cascade Router Adapter (Sprint 2)
├── frontend/                 <- High-Performance Static Frontend
│   ├── config.js             <- Dynamic API_BASE & App Constants
│   ├── index.html            <- Main App Container (Login First)
│   ├── style.css             <- Fluent Dark Horizon Design System
│   └── app.js                <- State Management & Modular Services
├── database/                 <- Local / Staging Data Store
├── uploads/                  <- User Document & Media Storage
└── README.md                 <- System Execution Guide
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.11+ (Active virtual environment at `ai_env/`)
- Supabase PostgreSQL Database (Configured via `.env`)

### 2. Environment Setup
Copy `.env.example` from root to `.env` if not already present:
```bash
cp .env.example .env
```

Ensure your `.env` contains the required keys:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_ID].supabase.co
JWT_SECRET=your_super_secure_jwt_secret_key
ENVIRONMENT=development
```

### 3. Run Backend Server
From the workspace root directory:
```bash
# Using virtual environment
ai_env\Scripts\python.exe -m uvicorn services.rhynia_saas.backend.main:app --reload --host 127.0.0.1 --port 8000
```

- API Root: `http://127.0.0.1:8000/`
- Health Check: `http://127.0.0.1:8000/api/v1/health`
- Interactive API Docs: `http://127.0.0.1:8000/api/docs`

### 4. Run Frontend
Serve the frontend using any static file server:
```bash
python -m http.server 3000 --directory services/rhynia_saas/frontend
```
Open `http://localhost:3000` in your web browser.

---

## 🔒 Security & Branding Rules
- Zero tolerance for external vendor branding or banned keywords in responses.
- Stateless HS256 JWT Authentication with strict expiration.
- SQL injection prevention via 100% parameterized SQLAlchemy ORM.
- Route Guard: Login Screen (Screen 07) is always presented first unless a verified JWT is found in local storage.
