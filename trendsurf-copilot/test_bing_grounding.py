"""Test various web search approaches available in Azure OpenAI."""
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI

cred = DefaultAzureCredential()
token_provider = get_bearer_token_provider(cred, "https://cognitiveservices.azure.com/.default")

# Try both endpoints
endpoints = [
    ("openai.azure.com", "https://agentsleague058212133979.openai.azure.com/"),
    ("services.ai.azure.com", "https://agentsleague058212133979.services.ai.azure.com/"),
]

conn_id_workspace = "/subscriptions/cc9dc914-23fe-455f-8090-d100dbf35dd1/resourceGroups/rg-agents-league/providers/Microsoft.MachineLearningServices/workspaces/agents-league-1/connections/bing-agentleague"
conn_id_bing = "/subscriptions/cc9dc914-23fe-455f-8090-d100dbf35dd1/resourceGroups/rg-agents-league/providers/Microsoft.Bing/accounts/bing-agentleague"

for ep_name, endpoint in endpoints:
    for api_ver in ["2025-04-01-preview", "2025-03-01-preview", "2025-01-01-preview"]:
        client = AzureOpenAI(
            azure_endpoint=endpoint,
            azure_ad_token_provider=token_provider,
            api_version=api_ver,
        )

        # Test 1: Responses API with web_search_preview
        print(f"\n=== {ep_name} / {api_ver} / Responses API web_search_preview ===")
        try:
            response = client.responses.create(
                model="gpt-4.1",
                input="What are the latest AI safety developments in 2025? 2-3 sentences.",
                tools=[{"type": "web_search_preview"}],
            )
            print(f"  Response: {response.output_text[:200]}")
            print(f"  SUCCESS!")
            
            with open("working_bing_config.txt", "w") as f:
                f.write(f"approach=responses_api_web_search_preview\n")
                f.write(f"endpoint={endpoint}\n")
                f.write(f"api_version={api_ver}\n")
            
            # Found a working approach!
            import sys
            sys.exit(0)
        except Exception as e:
            err = str(e)[:200]
            print(f"  Error: {err}")

        # Test 2: Responses API with bing_grounding and connection
        print(f"\n=== {ep_name} / {api_ver} / Responses API bing_grounding ===")
        for conn_id in [conn_id_workspace, conn_id_bing]:
            try:
                response = client.responses.create(
                    model="gpt-4.1",
                    input="What are the latest AI safety developments? 2 sentences.",
                    tools=[{
                        "type": "bing_grounding",
                        "bing_grounding": {
                            "connections": [{"connection_id": conn_id}]
                        }
                    }],
                )
                print(f"  Response: {response.output_text[:200]}")
                print(f"  SUCCESS with conn: ...{conn_id[-40:]}")
                
                with open("working_bing_config.txt", "w") as f:
                    f.write(f"approach=responses_api_bing_grounding\n")
                    f.write(f"endpoint={endpoint}\n")
                    f.write(f"api_version={api_ver}\n")
                    f.write(f"connection_id={conn_id}\n")
                
                import sys
                sys.exit(0)
            except Exception as e:
                err = str(e)[:150]
                print(f"  Error ({conn_id[-30:]}): {err}")

        # Test 3: Assistants API with web_search_preview tool
        print(f"\n=== {ep_name} / {api_ver} / Assistants web_search_preview ===")
        try:
            assistant = client.beta.assistants.create(
                model="gpt-4.1",
                name="test-websearch",
                instructions="Search the web for current information.",
                extra_body={
                    "tools": [{"type": "web_search_preview"}]
                },
            )
            print(f"  Created: {assistant.id}")
            client.beta.assistants.delete(assistant.id)
            print(f"  SUCCESS!")
        except Exception as e:
            err = str(e)[:200]
            print(f"  Error: {err}")

print("\nNo working approach found.")
