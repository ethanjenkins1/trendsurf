<div align="center">

# 🏄 TrendSurf Copilot

**AI-Powered Social Media Content Pipeline for Fintech**

*Built for Agents League @ TechConnect — Reasoning Agents Track (Microsoft Foundry)*

</div>

---

## 🎯 What It Does

TrendSurf Copilot transforms trending topics into **brand-safe, platform-ready social media posts** through a multi-agent reasoning pipeline. Give it a topic, and it delivers compliant content for LinkedIn, X/Twitter, and Microsoft Teams — grounded in real sources and verified against your brand policies.

**Demo prompt:**  
> *"Generate posts on 'AI safety & NIST updates' for FinGuard Capital"*

---

## 🧩 Architecture

```
User Input (topic)
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    TrendSurf Copilot Pipeline                │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  📡 Research │───▶│ 🛡️ Brand    │───▶│  ✍️ Copywriter  │  │
│  │    Agent     │    │ Guard Agent │    │     Agent       │  │
│  │  (Bing+ReAct)│    │ (File Search│    │  (Platform-     │  │
│  │             │    │  + CoT)     │    │   specific)     │  │
│  └─────────────┘    └─────────────┘    └────────┬────────┘  │
│                                                  │           │
│                                          ┌───────▼────────┐  │
│                                          │ 🔍 Reviewer    │  │
│                                          │    Agent       │  │
│                                          │ (Self-Reflect) │  │
│                                          └───────┬────────┘  │
│                                                  │           │
└──────────────────────────────────────────────────┼───────────┘
                                                   │
                                                   ▼
                                    ┌──────────────────────────┐
                                    │  📊 Output               │
                                    │  • LinkedIn post         │
                                    │  • X/Twitter post        │
                                    │  • Teams digest          │
                                    │  • Compliance checklist  │
                                    │  • Source citations      │
                                    │  • Adaptive Card summary │
                                    └──────────────────────────┘
```

---

## 🤖 Agent Details

| Agent | Role | Reasoning Pattern | Tools |
|-------|------|-------------------|-------|
| **Research Agent** | Finds top authoritative sources on a topic | **ReAct** (Thought → Search → Observe → Summarize) | Bing Search |
| **Brand Guard Agent** | Checks content against brand policies | **Chain-of-Thought** checklist | File Search (vector store) |
| **Copywriter Agent** | Generates platform-specific posts | Structured generation | — |
| **Reviewer Agent** | Final quality self-critique | **Self-Reflection** (assess → reflect → revise) | — |

---

## 🔧 Tools & Integrations

- **Microsoft Foundry Agent Service** — Multi-agent orchestration
- **Bing Search (Grounding)** — Real-time trend research with authoritative sources
- **File Search (Vector Store)** — Brand kit retrieval for compliance checking
- **Filesystem MCP** — Save drafts and outputs locally
- **Adaptive Cards** — Rich output format for demo presentation

---

## 📊 Rubric Alignment

| Criterion | Weight | How TrendSurf Addresses It |
|-----------|--------|---------------------------|
| **Accuracy & Relevance** | 25% | Bing-grounded research with source citations; brand guardrails ensure factual accuracy |
| **Reasoning & Multi-step Thinking** | 25% | 4-agent chain with explicit ReAct, CoT, and Self-Reflection patterns |
| **Creativity & Originality** | 20% | Real-time trend-to-post pipeline with compliance layer — non-obvious combination |
| **User Experience & Presentation** | 15% | Adaptive Card summary with checklist, posts, sources, and approve/regenerate actions |
| **Technical Implementation** | 15% | Multi-agent architecture, MCP integration, vector store, Bing Search tool |

---

## 🚀 Quick Start

### Prerequisites

**For Python Pipeline:**
- Python 3.10+
- Azure CLI (logged in: `az login`)
- Azure subscription with:
  - Microsoft Foundry project
  - Reasoning model deployed (e.g., GPT-5.1)
  - Bing Search resource (Grounding with Bing Search)

**For Web UI:**
- Node.js 18+ and npm
- Modern web browser (Chrome, Edge, Firefox)

### Setup

**Python Pipeline:**

```bash
# Clone and navigate
cd trendsurf-copilot

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your Foundry endpoint and model name
```

**Web UI:**

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Run

**Python Pipeline (CLI):**

```bash
# Default demo topic
python main.py

# Custom topic
python main.py "ESG investing trends in 2026"
python main.py "AI safety and NIST updates for financial services"
```

**Web UI (Recommended):**

```bash
# Navigate to web directory
cd web

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

The web UI provides:
- **Tourist Mode** (default): Clean, simplified interface with essential features
- **Purist Mode**: Full technical inspection with JSON streams, metadata, and developer console

### Output

Results are saved to the `output/` directory:

| File | Content |
|------|---------|
| `01_research_brief.md` | Research findings & authoritative sources |
| `02_brand_guard_review.md` | Brand compliance check results |
| `03_draft_posts.md` | Platform-specific post drafts |
| `04_final_review.md` | Final QA review & approved posts |
| `pipeline_result.json` | Complete pipeline data for Adaptive Card |

---

## 🌐 Web UI Features

### Tourist Mode
- **Hero & Branding**: Clear product identity with system metadata
- **One-Click Demo**: Deterministic demo with fixed seed (1337)
- **Topic Input**: Text input with 4 suggested topic chips
- **Pipeline Progress**: Visual flow diagram with animated stages
- **Results Display**:
  - LinkedIn, X/Twitter, and Teams post cards
  - Copy and download buttons for each post
  - Character count for Twitter (max 280)
  - Compliance checklist with status icons
  - Source citations with links
  - Adaptive Card preview with download
- **Clean UI**: Minimalist "industrial luxury" design inspired by Nike/Virgil

### Purist Mode
All Tourist features PLUS:
- **Live Pipeline Visualization**:
  - Animated node-to-node packet flow
  - Stage status indicators (idle/running/success/warning/error)
  - Clickable nodes with detailed metadata drawers
  - Industrial metadata plaques (RUN_ID, STAGE_ID, PATH, TIME)
- **JSON Stream Panel**:
  - Real-time stage envelope events as JSON
  - Streaming updates during pipeline execution
  - Syntax highlighting and diff support
  - Copy JSON buttons per section
- **Developer Console** with tabs:
  - **Run Envelope**: Complete final response JSON
  - **Stage Events**: Timeline of all stage transitions
  - **Artifacts**: Links to output markdown files
  - **Citations**: Source usage mapping across stages
  - **Compliance**: Full checklist with deltas and reasoning
- **Adaptive Card JSON**: Side-by-side preview and raw JSON

### How Demo Mode Works
Demo Mode uses a deterministic seed (1337) and fixed topic ("AI safety & NIST updates") to ensure consistent outputs across runs. This enables reliable E2E testing and presentations.

---

## 🧪 Testing

### Run E2E Tests

```bash
cd web

# Run tests headless (CI mode)
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed
```

### What the Tests Validate
- Complete demo flow from start to results
- Tourist mode as default
- All pipeline nodes appear and update correctly
- LinkedIn, Twitter, Teams cards render with content
- Compliance checklist has at least 3 items
- Sources section has at least 1 link
- Adaptive Card preview renders
- Purist mode shows JSON panels and developer console
- Copy buttons work (clipboard mocked)
- No errors displayed in UI
- Mode toggle switches correctly
- Topic input and chips function properly

---

## 🐛 Debugging in VS Code + Microsoft Edge

### Setup Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "msedge",
      "request": "launch",
      "name": "Launch Edge against localhost",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/web"
    }
  ]
}
```

### Debug Steps
1. Start the dev server: `cd web && npm run dev`
2. Open VS Code
3. Set breakpoints in `web/components/*.tsx` or `web/app/api/*.ts`
4. Press `F5` or click "Run > Start Debugging"
5. Edge will launch with DevTools attached
6. Interact with the UI to hit breakpoints

---

## 🗂️ Project Structure

```
trendsurf-copilot/
├── agents/
│   ├── __init__.py
│   ├── agent_factory.py     # Agent creation & lifecycle
│   └── prompts.py           # All agent system prompts
├── data/
│   ├── brand_kit.md          # FinGuard Capital brand policy
│   └── adaptive_card_template.json
├── web/                      # 🌐 Next.js Web UI (NEW)
│   ├── app/
│   │   ├── page.tsx          # Main app page
│   │   ├── layout.tsx        # Root layout
│   │   └── api/              # Backend API routes
│   │       ├── generate/route.ts       # POST /api/generate
│   │       └── runs/[runId]/events/route.ts  # GET SSE stream
│   ├── components/           # UI components
│   │   ├── Hero.tsx
│   │   ├── ModeToggle.tsx
│   │   ├── InputForm.tsx
│   │   ├── PipelineVisualization.tsx
│   │   ├── ResultsView.tsx
│   │   └── DeveloperConsole.tsx
│   ├── tests/
│   │   └── e2e.spec.ts       # Playwright E2E tests
│   ├── playwright.config.ts
│   ├── package.json
│   └── tsconfig.json
├── output/                   # Generated content (gitignored)
├── main.py                   # Pipeline orchestrator
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## 🏢 Brand: FinGuard Capital (Synthetic)

FinGuard Capital is a **synthetic fintech company** created for this demo. The brand kit includes:

- Brand voice guidelines (professional, authoritative, approachable)
- Approved and prohibited topics
- Required disclaimers for regulatory, AI, and market content
- Platform-specific guidelines (LinkedIn, X/Twitter, Teams)
- Tone examples (good vs. bad)

---

## 🎬 Demo Storyboard

1. **User**: "Generate posts on 'AI safety & NIST updates' for FinGuard Capital"
2. **Research Agent**: Searches Bing → finds NIST.gov, Reuters, industry reports → produces research brief
3. **Brand Guard Agent**: Checks brief against brand kit → flags any policy violations → suggests fixes
4. **Copywriter Agent**: Crafts LinkedIn thought-leadership post, punchy tweet, Teams digest
5. **Reviewer Agent**: Self-critiques all posts → verifies sources, tone, length, disclaimers → approves
6. **Output**: Adaptive Card with posts, compliance checklist (✅/❌), source links

---

## ⚠️ Security Notice

This project follows the [repository security guidelines](../../DISCLAIMER.md):
- ❌ No API keys, credentials, or connection strings in code
- ❌ No real customer data or PII
- ✅ All secrets stored in `.env` (gitignored)
- ✅ Authentication via `DefaultAzureCredential`

---

## 🔮 Future Enhancements

- **Cosmos DB vector store** with HPK (`tenantId|brandId`) for multi-tenant brand policies
- **Sentiment/risk scoring** per post
- **Crisis mode toggle** — tightens guardrails for sensitive topics
- **Scheduler tool** — ICS/CSV export for content calendar
- **Leaderboard** — Track best-performing post formats in Cosmos DB

---

*Built with ❤️ at Agents League @ TechConnect using Microsoft Foundry, Bing Search, and GitHub Copilot*
