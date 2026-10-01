import asyncio
import httpx

async def find_free_models():
    base_url = "https://openrouter.ai/api/v1"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{base_url}/models")
        data = response.json()
        free_models = [m["id"] for m in data.get("data", []) if ":free" in m["id"]]
        print("Free models:", free_models)

asyncio.run(find_free_models())
