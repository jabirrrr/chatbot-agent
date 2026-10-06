import httpx
import asyncio
import time
import traceback
import uuid

API_BASE = "http://127.0.0.1:8000"

async def create_user_and_org(email: str, password: str, org_name: str):
    async with httpx.AsyncClient() as client:
        # Register user
        res = await client.post(f"{API_BASE}/api/v1/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Test User",
            "organization_name": org_name
        })
        if res.status_code == 400 and "already registered" in res.text:
            pass # ignore if exists
        elif res.status_code not in (200, 201):
            raise Exception(f"Register failed: {res.status_code} - {res.text}")
        
        # Login
        res = await client.post(f"{API_BASE}/api/v1/auth/login", json={
            "email": email,
            "password": password
        })
        if res.status_code != 200:
            raise Exception(f"Login failed: {res.text}")
        return res.json()["access_token"]

async def main():
    try:
        # 1. Health check
        start = time.time()
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{API_BASE}/health")
            if res.status_code != 200:
                raise Exception(f"Health check failed: {res.status_code}")
        print(f"Health check passed in {(time.time() - start)*1000:.2f}ms")

        uid = uuid.uuid4().hex[:6]
        # 2. Multi-tenant security
        token_a = await create_user_and_org(f"org_a_{uid}@test.com", "password", f"ORG_A_{uid}")
        token_b = await create_user_and_org(f"org_b_{uid}@test.com", "password", f"ORG_B_{uid}")

        # Create chatbot for ORG_A
        async with httpx.AsyncClient() as client:
            res = await client.post(f"{API_BASE}/api/v1/chatbots/", headers={"Authorization": f"Bearer {token_a}"}, json={
                "name": "Bot A",
                "description": "ORG_A Bot",
                "theme_color": "#000000"
            })
            if res.status_code not in (200, 201):
                raise Exception(f"Failed to create chatbot: {res.text}")
            bot_a_id = res.json()["id"]

        # Attempt to access ORG_A bot using ORG_B token
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{API_BASE}/api/v1/chatbots/{bot_a_id}", headers={"Authorization": f"Bearer {token_b}"})
            print(f"Accessing ORG_A bot with ORG_B token -> Status: {res.status_code}")
            if res.status_code not in (403, 404):
                raise Exception(f"Security failed! Got {res.status_code}")

        print("Multi-tenant isolation verified successfully!")

        # 3. Create conversation in ORG_A using widget endpoint
        async with httpx.AsyncClient() as client:
            session_res = await client.post(f"{API_BASE}/api/v1/widget/session", json={
                "widget_token": str(bot_a_id),
                "visitor_id": "test_visitor_123"
            })
            if session_res.status_code != 201:
                raise Exception(f"Session creation failed: {session_res.text}")
            
            session_token = session_res.json()["session_token"]
            
            # Send message
            chat_res = await client.post(f"{API_BASE}/api/v1/widget/message", json={
                "session_token": session_token,
                "chatbot_id": str(bot_a_id),
                "message": "Hello from test script"
            })
            if chat_res.status_code != 200:
                raise Exception(f"Chat failed: {chat_res.text}")
            
            print("Chat session successfully initiated. Note: response is SSE stream.")
            
        # Test analytics
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{API_BASE}/api/v1/analytics/overview", headers={"Authorization": f"Bearer {token_a}"})
            print("ORG_A Analytics Overview:")
            print(res.json())
            
        print("All automated backend tests PASSED")

    except Exception as e:
        print(f"Test failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
