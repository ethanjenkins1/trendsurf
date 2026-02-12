"""Quick test: bing_grounding with azure-ai-agents SDK."""
import os
from dotenv import load_dotenv
load_dotenv()

from azure.identity import DefaultAzureCredential
from azure.ai.agents import AgentsClient
from azure.ai.agents.models import BingGroundingTool

BING_CONN_ID = (
    "/subscriptions/cc9dc914-23fe-455f-8090-d100dbf35dd1"
    "/resourceGroups/rg-agents-league"
    "/providers/Microsoft.Bing/accounts/bing-agentleague"
)

endpoint = "https://agentsleague058212133979.services.ai.azure.com/"

client = AgentsClient(
    endpoint=endpoint,
    credential=DefaultAzureCredential(),
)

bing_tool = BingGroundingTool(connection_id=BING_CONN_ID)

print("Creating agent with Bing Grounding...")
agent = client.create_agent(
    model="gpt-4.1",
    name="Bing Test Agent",
    instructions="You are a research agent. When asked about a topic, search the web for the latest information.",
    tools=bing_tool.definitions,
)
print(f"  Agent created: {agent.id}")

# Test a quick search
thread = client.create_thread()
msg = client.create_message(
    thread_id=thread.id,
    role="user",
    content="What are the latest NIST AI Risk Management Framework updates in 2026?",
)

print("Running agent with Bing search...")
run = client.create_and_process_run(
    thread_id=thread.id,
    agent_id=agent.id,
)
print(f"  Run status: {run.status}")

if run.status == "failed":
    print(f"  Error: {run.last_error}")
else:
    messages = client.list_messages(thread_id=thread.id)
    for msg in messages.data:
        if msg.role == "assistant":
            for block in msg.content:
                if hasattr(block, "text"):
                    print(f"\n--- Agent response (first 500 chars) ---")
                    print(block.text.value[:500])
            break

# Cleanup
client.delete_agent(agent.id)
print("\nDone! Bing Grounding is working.")
