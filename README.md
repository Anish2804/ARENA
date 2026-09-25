# ARENA

**The Operating System for AI Workers.**  
*Orchestrate. Evaluate. Evolve.*

---

## 1. Overview

ARENA is an enterprise-grade AI Workforce Orchestration & Evaluation Platform. 

In traditional enterprise services, human workforce orchestration matches tasks to specialists, monitors execution, evaluates quality against clear benchmarks, and optimizes business outcomes. ARENA elevates this abstraction into the autonomous AI era:

**What happens when the workers are specialized autonomous AI agents?**

ARENA receives a task, matches it across a roster of differentiated AI agents, executes them concurrently in isolated environments, evaluates their responses using an LLM-as-a-judge evaluator, and continuously scores and tracks performance along four vectors: **Quality**, **Accuracy**, **Cost**, and **Latency**.

---

## 2. Architecture

The system features clean decoupling between client presentation, high-concurrency orchestration, deterministic evaluation, and cloud persistence:

```text
User creates task (Next.js Dashboard)
                  ↓
       FastAPI Background Dispatch
                  ↓
   Agent Matching & Concurrent Execution
                  ↓
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Research-Pro   │   Precision-X   │  Fast-Research  │  General-Agent  │
│ (Deep Analysis) │ (Factual Rigor) │ (Low Cost/Time) │ (Balanced Mode) │
└────────┬────────┴────────┬────────┴────────┬────────┴────────┬────────┘
         │                 │                 │                 │
         └─────────────────┴────────┬────────┴─────────────────┘
                                    ↓
                 Evaluator (LLM-as-a-Judge on Groq)
                                    ↓
              Composite Multi-Vector Scoring (0 - 100)
                                    ↓
            Neon PostgreSQL Database (Async SQLAlchemy)
                                    ↓
            Live Leaderboard & Historical Analytics
```

### Technology Stack
- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Vanilla CSS design system.
- **Backend**: FastAPI 0.115+, Python 3.12, Uvicorn, Pydantic v2.
- **Database**: Remote Neon PostgreSQL serverless database with async pooling (`psycopg` / `SQLAlchemy 2.0`).
- **Inference Engine**: Groq Cloud API with `openai/gpt-oss-20b` for high-throughput ultra-low-latency execution.

---

## 3. Specialized Agent Roster & Differentiation

ARENA provides 4 distinct agent strategies, each tuned with custom system instructions and inference profiles:

| Agent | Role | Strategic Focus | Temperature | Max Tokens |
|---|---|---|---|---|
| **Research-Pro** | Deep Research Specialist | Exhaustive multi-dimensional coverage, edge-case analysis, structural breakdown, and risk identification. | `0.4` | `1500` |
| **Precision-X** | Factual Precision Analyst | Verifiable bullet points, deterministic assertions, zero speculation, zero conversational filler. | `0.1` | `800` |
| **Fast-Research** | High-Speed & Cost Optimizer | Minimal latency, maximal token efficiency, immediate high-signal conclusions in tight sections. | `0.5` | `400` |
| **General-Agent** | Balanced Strategy Analyst | Well-rounded general purpose analysis balancing clarity, practical depth, and readability. | `0.7` | `1000` |

---

## 4. Evaluation & Scoring Methodology

Completed agent responses are evaluated across 4 core dimensions:

1. **Quality (45%)**: Evaluates structure, comprehensiveness, clarity, and logical organization (0–100).
2. **Accuracy (30%)**: Evaluates factual precision, correctness, and adherence to domain principles (0–100).
3. **Cost (10%)**: Measures token expenditure converted to USD cost, normalized against benchmark:
   $$\text{Normalized Cost} = \max(0, \min(100, 100 - (\text{cost} / \$0.02 \times 100)))$$
   *Lower cost yields a higher score.*
4. **Latency (15%)**: Measures execution turnaround time in milliseconds, normalized against benchmark:
   $$\text{Normalized Latency} = \max(0, \min(100, 100 - (\text{latency\_ms} / 10000 \times 100)))$$
   *Lower latency yields a higher score.*

### Final Composite Score Formula
$$\text{Final Score} = (\text{Quality} \times 0.45) + (\text{Accuracy} \times 0.30) + (\text{Cost}_{\text{norm}} \times 0.10) + (\text{Latency}_{\text{norm}} \times 0.15)$$

The result is clamped between `0.0` and `100.0` and rounded to one decimal place.

---

## 5. Environment Variables & Security

Secrets and credentials are kept strictly server-side and are never committed to version control.

### Backend (`backend/.env`)
```env
# Neon PostgreSQL Connection URL
DATABASE_URL=postgresql+psycopg://<user>:<password>@<neon-host>/neondb?sslmode=require

# Groq Cloud API Key
GROQ_API_KEY=gsk_...

# Active Groq LLM Model
LLM_MODEL=openai/gpt-oss-20b

# Allowed CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend (`frontend/.env.local`)
```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 6. Setup & Local Development

No Docker daemon is required. The backend connects directly to your Neon PostgreSQL instance and the frontend connects via `NEXT_PUBLIC_API_URL`.

### Prerequisites
- Python 3.10 – 3.12
- Node.js 18+ and npm
- Neon PostgreSQL connection string
- Groq Cloud API key

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment:
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed or update agent profiles in Neon PostgreSQL
python -m app.database.seed

# Run the backend server
# Note: On Windows, run.py enforces SelectorEventLoop for psycopg compatibility
python run.py
```
Backend API will be available at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend application will be available at `http://localhost:3000`.

---

## 7. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/agents` | Lists all registered agents and their active profiles |
| `POST` | `/api/tasks` | Validates, creates, and dispatches a multi-agent task |
| `GET` | `/api/tasks` | Lists all tasks ordered by creation date |
| `GET` | `/api/tasks/{task_id}` | Retrieves full task detail including agent runs, responses, latencies, costs, and judge evaluations |
| `GET` | `/api/leaderboard` | Real-time leaderboard aggregated from database evaluation records |
| `GET` | `/api/activity` | Recent activity stream of task and agent lifecycle events |

---

## 8. Reliability & Production Safeguards

- **No Concurrency Violations**: SQLAlchemy `AsyncSession` instances are strictly isolated from concurrent asynchronous network I/O. Agents run pure async HTTP requests in parallel and persist cleanly in sequential commits.
- **Fail-Safe Orchestration**: A failure in a single agent or evaluator does not crash the orchestration. The system records the individual failure and completes the remaining runs.
- **Credential Redaction**: Unhandled exceptions, loggers, and evaluation error handlers automatically scrub API keys and database credentials before returning or logging messages.
- **Connection Health**: Database connections utilize `pool_pre_ping=True` and connection recycling to handle serverless database sleeps and idle disconnects seamlessly.
