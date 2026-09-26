import httpx
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:8000/api"
print("Starting Final Verification...")

with httpx.Client(timeout=30.0) as client:
    r = client.get(f"{BASE_URL}/agents")
    agents = r.json()
    if len(agents) != 4:
        print(f"FAILED: Expected 4 agents, found {len(agents)}")
        sys.exit(1)
    agent_ids = [a["id"] for a in agents]
    print("Verified only 4 default agents are present.")

    task_payload = {
        "title": "Final Verification Task",
        "prompt": "Say hello world.",
        "agent_ids": agent_ids
    }
    r = client.post(f"{BASE_URL}/tasks", json=task_payload)
    if r.status_code != 200:
        print(f"FAILED to create task: {r.text}")
        sys.exit(1)
    task_id = r.json()["id"]
    print(f"Created task {task_id}")

    print("Waiting for task to complete...")
    for _ in range(15):
        time.sleep(2)
        r = client.get(f"{BASE_URL}/tasks/{task_id}")
        if r.json()["status"] == "completed":
            print("Task completed!")
            break
    
    r = client.get(f"{BASE_URL}/tasks/{task_id}")
    task_details = r.json()
    all_success = True
    for run in task_details.get("runs", []):
        if run["status"] != "completed":
            print(f"FAILED {run['agent_name']}: {run['response']}")
            all_success = False
        else:
            print(f"SUCCESS {run['agent_name']}!")

    r = client.get(f"{BASE_URL}/leaderboard")
    if r.status_code == 200 and len(r.json()) > 0:
        print("Leaderboard updated!")
    else:
        print("FAILED Leaderboard fetch failed or empty")
        all_success = False

    if all_success:
        print("ALL SYSTEMS VERIFIED AND READY.")
    else:
        sys.exit(1)
