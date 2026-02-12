"""
TrendSurf Copilot — Agent Factory
Creates and manages the 4-agent chain using Azure OpenAI Assistants API
(the same runtime that powers Microsoft Foundry Agent Service).

Agents:
  1. Research Agent     – Bing-grounded research (ReAct pattern)
  2. Brand Guard Agent  – Policy compliance via File Search (CoT pattern)
  3. Copywriter Agent   – Platform-specific post generation
  4. Reviewer Agent     – Self-critique quality check (Self-Reflection pattern)
"""

import os
import time
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

from agents.prompts import (
    RESEARCH_AGENT_PROMPT,
    BRAND_GUARD_AGENT_PROMPT,
    COPYWRITER_AGENT_PROMPT,
    REVIEWER_AGENT_PROMPT,
)


def create_openai_client() -> AzureOpenAI:
    """Create an Azure OpenAI client using DefaultAzureCredential (no keys in code)."""
    token_provider = get_bearer_token_provider(
        DefaultAzureCredential(),
        "https://cognitiveservices.azure.com/.default",
    )
    return AzureOpenAI(
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        azure_ad_token_provider=token_provider,
        api_version=os.environ.get("AZURE_OPENAI_API_VERSION", "2025-01-01-preview"),
    )


def get_model_name() -> str:
    """Return the configured model deployment name."""
    return os.environ.get("MODEL_DEPLOYMENT_NAME", "gpt-4.1")


# ── Agent factory functions ──────────────────────────────────────────


def create_research_agent(client: AzureOpenAI):
    """
    Research Agent — uses reasoning to find authoritative sources on a topic.
    Reasoning pattern: ReAct (Thought → Action → Observation)
    """
    assistant = client.beta.assistants.create(
        model=get_model_name(),
        name="TrendSurf Research Agent",
        instructions=RESEARCH_AGENT_PROMPT,
    )
    print(f"  ✅ Research Agent created: {assistant.id}")
    return assistant


def create_brand_guard_agent(client: AzureOpenAI, vector_store_id: str):
    """
    Brand Guard Agent — checks content against brand policies via File Search.
    Reasoning pattern: Chain-of-Thought checklist
    """
    assistant = client.beta.assistants.create(
        model=get_model_name(),
        name="TrendSurf Brand Guard Agent",
        instructions=BRAND_GUARD_AGENT_PROMPT,
        tools=[{"type": "file_search"}],
        tool_resources={"file_search": {"vector_store_ids": [vector_store_id]}},
    )
    print(f"  ✅ Brand Guard Agent created: {assistant.id}")
    return assistant


def create_copywriter_agent(client: AzureOpenAI):
    """
    Copywriter Agent — generates platform-specific social media posts.
    """
    assistant = client.beta.assistants.create(
        model=get_model_name(),
        name="TrendSurf Copywriter Agent",
        instructions=COPYWRITER_AGENT_PROMPT,
    )
    print(f"  ✅ Copywriter Agent created: {assistant.id}")
    return assistant


def create_reviewer_agent(client: AzureOpenAI):
    """
    Reviewer Agent — self-critique and final quality check.
    Reasoning pattern: Self-Reflection
    """
    assistant = client.beta.assistants.create(
        model=get_model_name(),
        name="TrendSurf Reviewer Agent",
        instructions=REVIEWER_AGENT_PROMPT,
    )
    print(f"  ✅ Reviewer Agent created: {assistant.id}")
    return assistant


# ── Brand kit upload → vector store ─────────────────────────────────


def upload_brand_kit(client: AzureOpenAI, brand_kit_path: str) -> str:
    """Upload the brand kit to a vector store for File Search and return the store ID."""
    # Upload file
    with open(brand_kit_path, "rb") as f:
        file_obj = client.files.create(file=f, purpose="assistants")
    print(f"  📄 Brand kit uploaded: {file_obj.id}")

    # Create vector store with the file
    vector_store = client.vector_stores.create(
        name="FinGuard Capital Brand Kit",
        file_ids=[file_obj.id],
    )
    print(f"  📦 Vector store created: {vector_store.id}")

    # Poll until processing is complete
    while True:
        vs = client.vector_stores.retrieve(vector_store.id)
        if vs.file_counts.completed >= 1:
            print(f"  ✅ Vector store ready ({vs.file_counts.completed} file(s) indexed)")
            break
        if vs.file_counts.failed > 0:
            print("  ❌ Vector store file processing failed")
            break
        print("  ⏳ Indexing brand kit...")
        time.sleep(2)

    return vector_store.id


# ── Run an agent turn ───────────────────────────────────────────────


def run_agent_turn(client: AzureOpenAI, assistant, thread_id: str, user_message: str) -> str:
    """
    Send a message to an assistant thread and return the response.
    Polls for completion with backoff.
    """
    # Add user message
    client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=user_message,
    )

    # Create run
    run = client.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=assistant.id,
    )

    # Poll until complete
    while True:
        run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run.id)
        if run.status == "completed":
            break
        if run.status in ("failed", "cancelled", "expired"):
            print(f"  ❌ Run {run.status}: {run.last_error}")
            return f"ERROR: Agent run {run.status} — {run.last_error}"
        time.sleep(2)

    # Get the latest assistant message
    messages = client.beta.threads.messages.list(thread_id=thread_id, order="desc", limit=1)
    for msg in messages.data:
        if msg.role == "assistant":
            texts = []
            for block in msg.content:
                if block.type == "text":
                    texts.append(block.text.value)
            return "\n".join(texts)

    return "ERROR: No response from agent"


# ── Cleanup ──────────────────────────────────────────────────────────


def cleanup_agents(client: AzureOpenAI, assistants: list):
    """Delete all assistants to avoid resource leakage."""
    for asst in assistants:
        try:
            client.beta.assistants.delete(asst.id)
            print(f"  🗑️  Deleted: {asst.name} ({asst.id})")
        except Exception as e:
            print(f"  ⚠️  Failed to delete {asst.id}: {e}")
