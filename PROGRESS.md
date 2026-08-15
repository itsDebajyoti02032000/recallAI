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
    │  POST /api/chat (credentials + messages)
    │  POST /api/validate
    │  POST /api/models
    │  Response: text/event-stream (SSE)
    ▼
Cloudflare Worker (Hono) — Cloudflare Workers
    │
    │  ConverseStreamCommand (user's credentials)
    ▼
Amazon Bedrock (user's AWS account)
```

### Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 3, Zustand 5
- **Backend:** Cloudflare Workers, Hono 4, AWS SDK v3
- **Deployment:** Cloudflare Pages + Workers (free tier)
- **CI/CD:** GitHub Actions (auto-deploy on push to main)

---

## Stage 2: Memory + MCP Layer — TODO

### 2A: Memory System

| Feature | Status |
|---------|--------|
| Mem0 OSS integration | Not Started |
| Short-term memory (conversation context) | Not Started |
| Long-term semantic memory (user facts/preferences) | Not Started |
| Episodic memory (past interaction summaries) | Not Started |
| Memory importance scoring | Not Started |
| Memory retrieval on relevant queries | Not Started |
| Memory creation from conversations | Not Started |
| Memory update/deletion | Not Started |
| Memory Inspector UI panel | Not Started |
| Memory persistence (Cloudflare D1 or KV) | Not Started |
| Memory isolation per user/session | Not Started |

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

## Stage 2 Decisions Still Needed

- **Mem0 persistence:** Where to store vectors — Cloudflare Vectorize? External free vector DB? In-memory with D1 fallback?
- **SearXNG hosting:** Self-host on free tier somewhere? Use a public instance?
- **MCP SDK choice:** Which MCP SDK version/library for the client and servers?
- **Agent routing:** LLM-driven tool selection vs rule-based router?
- **Memory scoping:** Session-based user ID vs persistent accounts?

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
