# RecallAI — Architecture & Features Document

## What is RecallAI?

RecallAI is an AI chatbot that **remembers you**, **searches the web**, and **shows you exactly what it's doing** — all running on your own AWS account with zero backend costs.

Unlike standard chatbots that forget everything after each conversation, RecallAI builds a persistent memory of your preferences, facts, and context. When it doesn't know something, it searches the web in real-time and cites its sources.

---

## Features Overview

| Feature | Description |
|---------|-------------|
| **Conversational AI** | Stream responses from any AWS Bedrock model (Claude, Titan, Llama, etc.) |
| **Persistent Memory** | Remembers facts, preferences, and context across conversations |
| **Web Search** | Searches the internet in real-time for current information |
| **Page Fetching** | Reads full web pages to get detailed answers |
| **Source Citations** | Shows clickable links to every source used |
| **Agent Activity Panel** | See exactly what tools the AI used, with timing and details |
| **Memory Inspector** | Browse, search, edit, and delete stored memories |
| **Multi-Model Support** | Works with any model in your AWS Bedrock account |
| **Privacy-First** | Your credentials stay in your browser (session storage, cleared on tab close) |
| **Zero Cost** | Free Cloudflare hosting — you only pay for your own AWS Bedrock usage |

---

## Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                        │
│  React 19 · TypeScript · Vite 6 · Tailwind CSS 3 · Zustand 5   │
│  Deployed: Cloudflare Pages (free)                               │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND                                                         │
│  Cloudflare Workers · Hono 4 · AWS SDK v3                       │
│  Deployed: Cloudflare Workers (free)                             │
├─────────────────────────────────────────────────────────────────┤
│  DATABASE                                                        │
│  Cloudflare D1 (SQLite) — stores memories + embeddings          │
├─────────────────────────────────────────────────────────────────┤
│  AI / LLM                                                        │
│  Amazon Bedrock (user's AWS account)                             │
│  • Chat: Any model via ConverseStream API                       │
│  • Embeddings: amazon.titan-embed-text-v2:0 (1024-dim)          │
├─────────────────────────────────────────────────────────────────┤
│  WEB SEARCH                                                      │
│  Self-hosted SearXNG (Docker on Render.com, free tier)           │
│  Meta-search: Google + Bing + DuckDuckGo + Wikipedia + Brave    │
├─────────────────────────────────────────────────────────────────┤
│  CI/CD                                                           │
│  GitHub Actions — auto-deploy on push to main                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## The MCP (Model Context Protocol) Architecture

### What is MCP?

MCP is a pattern where the AI model can **use tools** — not just generate text. Think of it like giving the AI hands to reach out and do things: search the web, read a page, store a memory, look up past conversations.

### How RecallAI Implements MCP

RecallAI uses an **in-process MCP pattern** — tool servers are TypeScript modules running inside the same Cloudflare Worker (no separate processes, no network hops):

```
┌─────────────────────────────────────────────────────────────┐
│  MCP Tool Registry (registry.ts)                             │
│                                                              │
│  ┌─────────────────────┐   ┌─────────────────────────────┐  │
│  │  Memory MCP Server  │   │  Web Search MCP Server       │  │
│  │                     │   │                              │  │
│  │  • memory_search    │   │  • web_search                │  │
│  │  • memory_add       │   │  • web_fetch                 │  │
│  │  • memory_get       │   │                              │  │
│  │  • memory_update    │   └─────────────────────────────┘  │
│  │  • memory_delete    │                                     │
│  │  • memory_list      │                                     │
│  └─────────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
```

Each tool has:
- **Name** — identifier the AI uses to call it
- **Description** — tells the AI when and how to use it
- **Input Schema** — JSON schema defining what parameters it accepts
- **Handler** — the function that executes when called

The AI model (via AWS Bedrock) decides **on its own** which tools to use based on the user's question. We don't hardcode "if user says X, search the web." The model reads the tool descriptions and makes intelligent decisions.

---

## How Web Search Works — The Multi-Iteration Loop

This is the most interesting part. When you ask "What's the latest version of React?", here's what happens step by step:

### The Agent Loop (Multi-Turn Tool Use)

```
User: "What's the latest version of React?"
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  ITERATION 1                                                 │
│                                                              │
│  Agent sends message + tool definitions to AWS Bedrock       │
│  Bedrock responds: "I should search for this"               │
│  → stopReason: "tool_use"                                   │
│  → tool: web_search, input: {query: "React latest version"} │
│                                                              │
│  Agent executes web_search:                                  │
│    → Calls SearXNG API: /search?q=React+latest+version      │
│    → Gets results: [{title, url, snippet}, ...]             │
│    → Returns results to Bedrock                             │
│                                                              │
│  Bedrock sees results, decides: "Results are too generic,   │
│  let me search more specifically"                            │
│  → stopReason: "tool_use"                                   │
│  → tool: web_search, input: {query: "React.js 2026 release"}│
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  ITERATION 2                                                 │
│                                                              │
│  Agent executes second web_search:                           │
│    → Calls SearXNG: /search?q=React.js+2026+release         │
│    → Gets better results with version numbers               │
│    → Returns to Bedrock                                     │
│                                                              │
│  Bedrock decides: "I have enough info now"                  │
│  → stopReason: "end_turn"                                   │
│  → Generates final answer with inline citations             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
User sees: "The latest version of React is 19.2.8..."
           + Source citations below
```

### Why Multiple Iterations?

The AI model is **autonomous** — it decides:
1. **When to search** — "This needs current data, I'll search"
2. **What to search** — It crafts the query itself
3. **Whether results are good enough** — If not, it refines and searches again
4. **When to fetch a full page** — "This snippet isn't detailed enough, let me read the full page"
5. **When to stop** — "I have enough information to answer confidently"

This loop runs up to **10 iterations** max (safety limit), but typically completes in 1-3 iterations.

---

## Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                                   │
│                                                                              │
│  ┌─────────┐   ┌──────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│  │ Chat UI │   │ Memory Panel │   │Activity Panel│   │ Sources/Citations│   │
│  └────┬────┘   └──────────────┘   └─────────────┘   └─────────────────┘   │
│       │                                                                      │
│       │  User types: "What's the latest React version?"                     │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────┐                    │
│  │  Zustand Stores (chatStore, agentStore, memoryStore) │                    │
│  │  • Sends POST /api/chat with credentials + messages  │                    │
│  │  • Receives SSE stream of events                     │                    │
│  │  • Updates UI in real-time per event                 │                    │
│  └────────────────────────┬────────────────────────────┘                    │
└───────────────────────────┼──────────────────────────────────────────────────┘
                            │
                            │  POST /api/chat (SSE response)
                            │  Events: tool_start → tool_result → delta → done
                            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE WORKER (Backend)                            │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │                     AGENT LOOP (agent-loop.ts)                  │         │
│  │                                                                 │         │
│  │   ┌─────────────┐     ┌──────────────┐     ┌───────────────┐  │         │
│  │   │ Build system │     │ Call Bedrock  │     │ Check stop    │  │         │
│  │   │ prompt with  │────▶│ ConverseStream│────▶│ reason        │  │         │
│  │   │ tool config  │     │ API          │     │               │  │         │
│  │   └─────────────┘     └──────────────┘     └───────┬───────┘  │         │
│  │                                                      │          │         │
│  │                              ┌───────────────────────┤          │         │
│  │                              │                       │          │         │
│  │                              ▼                       ▼          │         │
│  │                    stopReason="tool_use"    stopReason="end_turn"│         │
│  │                              │                       │          │         │
│  │                              ▼                       ▼          │         │
│  │                    ┌─────────────────┐      Stream text to      │         │
│  │                    │  Execute Tool   │      user (done)         │         │
│  │                    │  via Registry   │                          │         │
│  │                    └────────┬────────┘                          │         │
│  │                             │                                   │         │
│  │                             ▼                                   │         │
│  │                    Feed result back to                           │         │
│  │                    Bedrock → LOOP AGAIN                         │         │
│  │                    (up to 10 iterations)                        │         │
│  └────────────────────────────────────────────────────────────────┘         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │                     MCP TOOL REGISTRY                           │         │
│  │                                                                 │         │
│  │  ┌─────────────────────────────────────────────────────────┐   │         │
│  │  │ MEMORY SERVER                                            │   │         │
│  │  │                                                          │   │         │
│  │  │  memory_search → Embed query → Cosine similarity → D1   │   │         │
│  │  │  memory_add    → Extract facts → Embed → Store in D1    │   │         │
│  │  │  memory_list   → Query D1 → Return memories             │   │         │
│  │  └─────────────────────────────────────────────────────────┘   │         │
│  │                                                                 │         │
│  │  ┌─────────────────────────────────────────────────────────┐   │         │
│  │  │ WEB SEARCH SERVER                                        │   │         │
│  │  │                                                          │   │         │
│  │  │  web_search → Call SearXNG JSON API → Parse results     │   │         │
│  │  │  web_fetch  → Fetch URL → HTMLRewriter → Extract text   │   │         │
│  │  └─────────────────────────────────────────────────────────┘   │         │
│  └────────────────────────────────────────────────────────────────┘         │
│                                                                              │
│  ┌────────────────────────┐                                                 │
│  │ Background (waitUntil) │                                                 │
│  │ Memory Extraction:     │                                                 │
│  │ After each response,   │                                                 │
│  │ extract new memories   │                                                 │
│  │ from the conversation  │                                                 │
│  └────────────────────────┘                                                 │
└──────────────────────────────────────────────────────────────────────────────┘
          │                              │
          │                              │
          ▼                              ▼
┌──────────────────┐          ┌─────────────────────────────┐
│  CLOUDFLARE D1   │          │  SELF-HOSTED SearXNG         │
│  (SQLite)        │          │  (Docker on Render.com)      │
│                  │          │                              │
│  memories table: │          │  GET /search?q=...&format=json│
│  • id            │          │                              │
│  • userId        │          │  Engines:                    │
│  • type          │          │  • Google                    │
│  • content       │          │  • Bing                      │
│  • embedding     │          │  • DuckDuckGo                │
│  • importance    │          │  • Wikipedia                  │
│  • timestamps    │          │  • Brave                      │
└──────────────────┘          └─────────────────────────────┘
          │
          │  Embeddings generated via
          ▼
┌──────────────────────────────────────┐
│  AWS BEDROCK (User's Account)         │
│                                       │
│  • Chat Model (user-selected)         │
│    Claude, Titan, Llama, etc.         │
│    via ConverseStream API             │
│                                       │
│  • Embedding Model                    │
│    amazon.titan-embed-text-v2:0       │
│    1024-dimensional vectors           │
│                                       │
│  • Tool Use                           │
│    toolConfig with toolChoice: auto   │
│    Model decides which tools to call  │
└──────────────────────────────────────┘
```

---

## How Each Layer Works Together (Plain English)

### 1. You ask a question
Your browser sends your message to the Cloudflare Worker backend along with your AWS credentials.

### 2. The Agent Loop starts
The backend builds a system prompt (with instructions about memory and web search) and sends everything to AWS Bedrock's ConverseStream API. It includes definitions of all available tools.

### 3. The AI decides what to do
Bedrock's model reads your question and the tool descriptions. It makes a choice:
- **Simple question** → Answer directly (no tools)
- **Personal question** → Call `memory_search` to check what it knows about you
- **Current information needed** → Call `web_search` to find it online

### 4. Tool execution (the loop)
If the model chose a tool, the agent loop:
1. Executes the tool (searches the web, queries memory, etc.)
2. Sends the result back to Bedrock
3. Bedrock decides: need more info? → Call another tool (loop). Done? → Generate answer.

This can repeat up to 10 times. Each iteration is streamed to your browser in real-time (you see "Searching the web..." indicators).

### 5. Response streams back
Once the model has enough context, it generates a final answer with:
- Inline citations as markdown links `[text](url)`
- The answer streams word-by-word to your browser via SSE

### 6. Background memory extraction
After the response is complete, the backend (using `waitUntil`) analyzes the conversation to extract new memories — facts, preferences, or context worth remembering for next time.

### 7. UI updates
Your browser shows:
- The formatted response with clickable source links
- Source citations in the message footer
- Tool badges showing what tools were used
- The Agent Activity Panel with full execution details
- Updated memory stats in the Memory Inspector

---

## Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| MCP Pattern | In-process (TypeScript modules) | Zero latency, no IPC overhead, fits Workers model |
| Tool Routing | LLM-driven (`toolChoice: auto`) | Model decides intelligently, no hardcoded rules |
| Memory Storage | Cloudflare D1 + embeddings | Free, edge-deployed, semantic search via cosine similarity |
| Web Search | Self-hosted SearXNG | Zero cost, no API keys, privacy-respecting, full control |
| Streaming | SSE (Server-Sent Events) | Simple, unidirectional, works through CDNs |
| State Management | Zustand | Lightweight, no boilerplate, TypeScript-native |
| Credentials | Session storage (browser) | Never persisted to disk, cleared on tab close |

---

## Security Model

- **No backend secrets** — The backend stores nothing sensitive (except the D1 database)
- **User brings credentials** — AWS keys live only in browser session storage
- **Per-user isolation** — Memories are keyed by SHA-256 hash of the access key ID
- **No tracking** — No analytics, no cookies, no third-party scripts
- **SearXNG privacy** — Search queries go through your own instance, not Google directly
