import httpx
import time
import json
import sys

BASE_URL = "http://localhost:8000/api"
print("Starting E2E Backend Tests...")

with httpx.Client(timeout=30.0) as client:
    # 1. Fetch existing agents
    print("\n1. Fetching existing agents...")
    r = client.get(f"{BASE_URL}/agents")
    assert r.status_code == 200
    agents = r.json()
    print(f"Found {len(agents)} agents.")

    # 2. Register New AI Agent (Testing provider parsing)
    print("\n2. Registering new AI agents...")
    new_agent_1 = client.post(f"{BASE_URL}/agents", json={"name": "OpenAI Test", "model": "openai/gpt-4o-mini"})
    assert new_agent_1.status_code == 200, f"Failed: {new_agent_1.text}"
    new_agent_1_id = new_agent_1.json()["id"]
    print(f"Registered OpenAI Test: {new_agent_1_id}")

    new_agent_2 = client.post(f"{BASE_URL}/agents", json={"name": "Gemini Test", "model": "gemini/gemini-1.5-flash"})
    assert new_agent_2.status_code == 200, f"Failed: {new_agent_2.text}"
    new_agent_2_id = new_agent_2.json()["id"]
    print(f"Registered Gemini Test: {new_agent_2_id}")

    # 3. Fetch all agents again to include new ones
    r = client.get(f"{BASE_URL}/agents")
    agent_ids = [a["id"] for a in r.json()]
    print(f"Total agents for task: {len(agent_ids)}")

    # 4. Create Task
    print("\n3. Creating a new task across all agents...")
    task_payload = {
        "title": "Comprehensive Backend Test",
        "prompt": "What is 2+2? Answer in one word.",
        "agent_ids": agent_ids
    }
    r = client.post(f"{BASE_URL}/tasks", json=task_payload)
    assert r.status_code == 200, f"Task creation failed: {r.text}"
    task_id = r.json()["id"]
    print(f"Task created with ID: {task_id}")

    # 5. Monitor task completion
    print("\n4. Waiting for task completion (polling)...")
    for _ in range(15):
        time.sleep(4)
        r = client.get(f"{BASE_URL}/tasks/{task_id}")
        assert r.status_code == 200
        task_details = r.json()
        if task_details["status"] == "completed":
            print("Task completed successfully!")
            break
        print(f"Status: {task_details['status']} - checking again...")
    
    r = client.get(f"{BASE_URL}/tasks/{task_id}")
    task_details = r.json()
    
    print("\n--- TASK RESULTS ---")
    all_success = True
    for run in task_details.get("runs", []):
        agent_name = run["agent_name"]
        status = run["status"]
        if status != "completed":
            all_success = False
            print(f"❌ {agent_name} FAILED: {run['response']}")
        else:
            print(f"✅ {agent_name} COMPLETED. Score: {run.get('evaluation', {}).get('final_score')}")

    # 6. Check Leaderboard
    print("\n5. Checking leaderboard...")
    r = client.get(f"{BASE_URL}/leaderboard")
    assert r.status_code == 200
    lb = r.json()
    print(f"Leaderboard fetched successfully! {len(lb)} agents ranked.")
    
    if all_success:
        print("\n🏆 ALL TESTS PASSED SUCCESSFULLY!")
    else:
        print("\n⚠️ SOME AGENTS FAILED. Check logs.")
        sys.exit(1)
