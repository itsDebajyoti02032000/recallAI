# RecallAI — Progress Tracker

## Project Status: Stage 1 Complete (Deployed)

**Live URLs:**
- Frontend: https://recallai-5ru.pages.dev
- Backend API: https://recallai-api.debajyoti410.workers.dev
- Cloudflare Account ID: 25a1e6622439a26bf61184f0f933e0b8

---

## Stage 1: Conversational Chatbot — DONE

### What's Built

| Feature | Status |
|---------|--------|
| Monorepo (npm workspaces: frontend, backend, shared) | Done |
| Frontend: React 19 + TypeScript + Vite + Tailwind CSS | Done |
| Backend: Cloudflare Workers + Hono | Done |
| Landing page with branding and privacy notice | Done |
| AWS credentials form (Access Key, Secret Key, Session Token) | Done |
| Region selector (7 Bedrock regions) | Done |
| Dynamic model fetching from Bedrock ListFoundationModels API | Done |
| Custom model ID input option | Done |
| Credential validation via Bedrock Converse API | Done |
| Chat interface with streaming responses (SSE) | Done |
| Bedrock ConverseStream integration (model-agnostic) | Done |
| Markdown rendering with syntax-highlighted code blocks | Done |
| Copy button on messages and code blocks | Done |
| Conversation sidebar (create, switch, delete) | Done |
| Auto-generated conversation titles | Done |
| Stop generation (AbortController) | Done |
| Regenerate last response | Done |
| Model indicator in chat header | Done |
| Zustand state management (connectionStore, chatStore) | Done |
| Session storage for credentials (cleared on tab close) | Done |
| Error classification (AccessDenied, ResourceNotFound, Throttling) | Done |
| Deployed frontend to Cloudflare Pages | Done |
| Deployed backend to Cloudflare Workers | Done |
| GitHub Actions CI/CD workflow | Done |

### Architecture

```
Browser (React + Vite + Tailwind) — Cloudflare Pages
    │
    │  POST /api/chat (credentials + messages + conversationId)
    │  POST /api/validate
    │  POST /api/models
    │  POST /api/memories/* (list, search, update, delete, stats)
    │  Response: text/event-stream (SSE with memory_context events)
    ▼
Cloudflare Worker (Hono) — Cloudflare Workers
    │
    │  1. Retrieve relevant memories (D1 + cosine similarity)
    │  2. Build dynamic system prompt (base + memory context)
    │  3. ConverseStreamCommand (user's credentials)
    │  4. Background: extract new memories (waitUntil)
    ▼
Amazon Bedrock (user's AWS account)
    ├── Chat model (user-selected, e.g. Claude, Titan)
    └── amazon.titan-embed-text-v2:0 (1024-dim embeddings)
    
Cloudflare D1 (SQLite)
    └── memories table (per-user, with embeddings as JSON)
```

### Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 3, Zustand 5
- **Backend:** Cloudflare Workers, Hono 4, AWS SDK v3
- **Deployment:** Cloudflare Pages + Workers (free tier)
- **CI/CD:** GitHub Actions (auto-deploy on push to main)

---

## Stage 2: Memory + MCP Layer — IN PROGRESS

### 2A: Memory System — DONE

| Feature | Status |
|---------|--------|
| Memory-inspired architecture (extract/store/retrieve) | Done |
| Short-term memory (conversation context) | Done (existing message history) |
| Long-term semantic memory (user facts/preferences) | Done |
| Episodic memory (past interaction summaries) | Done |
| Memory importance scoring (1-10 scale) | Done |
| Memory retrieval on relevant queries (cosine similarity) | Done |
| Memory creation from conversations (LLM extraction) | Done |
| Memory update/deletion (full CRUD) | Done |
| Memory Inspector UI panel (right-side, collapsible) | Done |
| Memory persistence (Cloudflare D1) | Done |
| Memory isolation per user (SHA-256 hash of accessKeyId) | Done |
| Embedding generation (Bedrock Titan Embed v2) | Done |
| Dynamic system prompt with memory injection | Done |
| Background memory extraction (waitUntil) | Done |

### 2B: MCP Architecture

| Feature | Status |
|---------|--------|
| MCP Client in the agent | Not Started |
| Memory MCP Server (memory.search, memory.add, memory.get, memory.update, memory.delete) | Not Started |
| Web Search MCP Server (web.search, web.fetch) | Not Started |
| MCP tool execution UI / activity indicator | Not Started |
| Agent router (decide: memory needed? web needed? direct answer?) | Not Started |

### 2C: Web Search

| Feature | Status |
|---------|--------|
| SearXNG integration | Not Started |
| Search decision logic (when to search) | Not Started |
| Search result extraction | Not Started |
| Source citations with clickable links | Not Started |
| Search activity indicator in UI | Not Started |

### 2D: Agent Activity Panel

| Feature | Status |
|---------|--------|
| Tool/action summary display | Not Started |
| Memory usage indicator | Not Started |
| Web search indicator | Not Started |
| MCP tool execution indicator | Not Started |

---

## Stage 2A Deployment Steps (Required)

```powershell
# 1. Create D1 database
cd "C:\Generative Ai\Personal Projects Portfolio\RecallAI\backend"
npx wrangler d1 create recallai-memory
# Copy the database_id from output into wrangler.toml

# 2. Run migrations
npx wrangler d1 migrations apply recallai-memory --local   # local dev
npx wrangler d1 migrations apply recallai-memory --remote  # production

# 3. Deploy
npx wrangler deploy
```

## Stage 2 Decisions Still Needed (for 2B/2C/2D)

- **SearXNG hosting:** Self-host on free tier somewhere? Use a public instance?
- **MCP SDK choice:** Which MCP SDK version/library for the client and servers?
- **Agent routing:** LLM-driven tool selection vs rule-based router?

---

## Deployment Commands (Reference)

```powershell
cd "C:\Generative Ai\Personal Projects Portfolio\RecallAI"

# Backend
npx wrangler deploy --config backend/wrangler.toml

# Frontend
$env:VITE_API_URL = "https://recallai-api.debajyoti410.workers.dev"
npm run build:frontend
npx wrangler pages deploy frontend/dist --project-name=recallai --commit-dirty=true --branch=main

# Dev (local)
npm run dev:backend    # localhost:8787
npm run dev:frontend   # localhost:5173
```

---

## Git History

1. `feat: initial project scaffolding` — monorepo, all components, stores, backend routes
2. `feat: add session token support for temporary AWS credentials`
3. `feat: fetch models dynamically from Bedrock ListFoundationModels API`
4. `feat: configure production API URL and deploy to Cloudflare`
5. `ci: add GitHub Actions workflow for Cloudflare deployment`
