"""
TrendSurf Copilot — Main Orchestrator
Runs the 4-agent chain: Research → Brand Guard → Copywriter → Reviewer

Usage:
    python main.py "AI safety and NIST updates"
    python main.py "ESG investing trends in 2026"
"""

import json
import sys
from pathlib import Path

from dotenv import load_dotenv

from agents.agent_factory import (
    create_openai_client,
    create_research_agent,
    create_brand_guard_agent,
    create_copywriter_agent,
    create_reviewer_agent,
    upload_brand_kit,
    run_agent_turn,
    cleanup_agents,
)


# ── Helpers ──────────────────────────────────────────────────────────


def save_output(filename: str, content: str):
    """Save output to the output directory."""
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    filepath = output_dir / filename
    filepath.write_text(content, encoding="utf-8")
    print(f"  💾 Saved: {filepath}")


# ── Main Pipeline ────────────────────────────────────────────────────

def run_pipeline(topic: str):
    """
    Execute the full TrendSurf Copilot multi-agent pipeline.
    
    Chain: Research Agent → Brand Guard → Copywriter → Reviewer
    """
    print("=" * 60)
    print("🏄 TrendSurf Copilot — Multi-Agent Content Pipeline")
    print("=" * 60)
    print(f"📌 Topic: {topic}\n")

    # ── Initialize ───────────────────────────────────────────────
    client = create_openai_client()

    # Upload brand kit for File Search
    brand_kit_path = str(Path(__file__).parent / "data" / "brand_kit.md")
    print("📤 Uploading brand kit to vector store...")
    vector_store_id = upload_brand_kit(client, brand_kit_path)

    # Create agents
    print("\n🤖 Creating agents...")
    research_agent = create_research_agent(client)
    brand_guard_agent = create_brand_guard_agent(client, vector_store_id)
    copywriter_agent = create_copywriter_agent(client)
    reviewer_agent = create_reviewer_agent(client)
    assistants = [research_agent, brand_guard_agent, copywriter_agent, reviewer_agent]

    try:
        # ── Step 1: Research Agent ───────────────────────────────
        print("\n" + "─" * 60)
        print("📡 STEP 1: Research Agent — Searching for trends...")
        print("─" * 60)
        
        research_thread = client.beta.threads.create()
        research_prompt = (
            f"Research the following topic for our fintech audience: '{topic}'. "
            f"Find the top 3 most authoritative and recent sources. "
            f"Provide a comprehensive research brief in the JSON format specified in your instructions."
        )
        research_output = run_agent_turn(client, research_agent, research_thread.id, research_prompt)
        print(f"\n📋 Research Brief:\n{research_output[:500]}...\n")
        save_output("01_research_brief.md", research_output)

        # ── Step 2: Brand Guard Agent ────────────────────────────
        print("\n" + "─" * 60)
        print("🛡️  STEP 2: Brand Guard Agent — Checking compliance...")
        print("─" * 60)

        guard_thread = client.beta.threads.create()
        guard_prompt = (
            f"Review the following research brief for brand compliance with FinGuard Capital's policies. "
            f"Use File Search to retrieve our brand kit and check every rule.\n\n"
            f"RESEARCH BRIEF:\n{research_output}"
        )
        guard_output = run_agent_turn(client, brand_guard_agent, guard_thread.id, guard_prompt)
        print(f"\n✅ Compliance Review:\n{guard_output[:500]}...\n")
        save_output("02_brand_guard_review.md", guard_output)

        # ── Step 3: Copywriter Agent ─────────────────────────────
        print("\n" + "─" * 60)
        print("✍️  STEP 3: Copywriter Agent — Drafting posts...")
        print("─" * 60)

        copy_thread = client.beta.threads.create()
        copy_prompt = (
            f"Create platform-specific social media posts for FinGuard Capital based on this research "
            f"and compliance feedback.\n\n"
            f"RESEARCH BRIEF:\n{research_output}\n\n"
            f"BRAND COMPLIANCE FEEDBACK:\n{guard_output}\n\n"
            f"Generate posts for LinkedIn, X/Twitter, and Microsoft Teams. "
            f"Follow all brand guidelines and include required disclaimers."
        )
        copy_output = run_agent_turn(client, copywriter_agent, copy_thread.id, copy_prompt)
        print(f"\n📝 Draft Posts:\n{copy_output[:500]}...\n")
        save_output("03_draft_posts.md", copy_output)

        # ── Step 4: Reviewer Agent ───────────────────────────────
        print("\n" + "─" * 60)
        print("🔍 STEP 4: Reviewer Agent — Final quality check...")
        print("─" * 60)

        review_thread = client.beta.threads.create()
        review_prompt = (
            f"Perform a final quality review of these social media posts for FinGuard Capital.\n\n"
            f"ORIGINAL RESEARCH:\n{research_output}\n\n"
            f"BRAND COMPLIANCE REVIEW:\n{guard_output}\n\n"
            f"DRAFT POSTS:\n{copy_output}\n\n"
            f"Apply your full quality checklist. If any post needs revision, provide the improved version."
        )
        review_output = run_agent_turn(client, reviewer_agent, review_thread.id, review_prompt)
        print(f"\n✅ Final Review:\n{review_output[:500]}...\n")
        save_output("04_final_review.md", review_output)

        # ── Summary ──────────────────────────────────────────────
        print("\n" + "=" * 60)
        print("🏄 TrendSurf Copilot — Pipeline Complete!")
        print("=" * 60)
        print(f"📁 All outputs saved to: {Path(__file__).parent / 'output'}")
        print("\nFiles generated:")
        print("  📋 01_research_brief.md     — Research findings & sources")
        print("  🛡️  02_brand_guard_review.md — Compliance check results")
        print("  ✍️  03_draft_posts.md        — Platform-specific post drafts")
        print("  🔍 04_final_review.md       — Final QA review & approved posts")

        # Build summary card data
        card_data = {
            "topic": topic,
            "research": research_output,
            "compliance": guard_output,
            "posts": copy_output,
            "review": review_output,
        }
        save_output("pipeline_result.json", json.dumps(card_data, indent=2, default=str))

    finally:
        # ── Cleanup ──────────────────────────────────────────────
        print("\n🧹 Cleaning up agents...")
        cleanup_agents(client, assistants)
        print("Done! ✨")


# ── Entry Point ──────────────────────────────────────────────────────

if __name__ == "__main__":
    load_dotenv()

    if len(sys.argv) < 2:
        topic = "AI safety and NIST AI Risk Management Framework updates for financial services"
        print(f"ℹ️  No topic provided. Using default: '{topic}'")
    else:
        topic = " ".join(sys.argv[1:])

    run_pipeline(topic)
