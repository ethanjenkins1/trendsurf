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

- Python 3.10+
- Azure CLI (logged in: `az login`)
- Azure subscription with:
  - Microsoft Foundry project
  - Reasoning model deployed (e.g., GPT-5.1)
  - Bing Search resource (Grounding with Bing Search)

### Setup

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

### Run

```bash
# Default demo topic
python main.py

# Custom topic
python main.py "ESG investing trends in 2026"
python main.py "AI safety and NIST updates for financial services"
```

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
