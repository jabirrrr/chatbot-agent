import time
import asyncio
import httpx
from colorama import Fore, Style, init

init(autoreset=True)

API_URL = "http://localhost:8000/api/v1"

async def test_latency():
    print(f"\n{Fore.CYAN}--- Measuring Vercel -> Backend Latency (Simulated) ---{Style.RESET_ALL}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Cold start / First request (Widget Config)
        start_time = time.time()
        try:
            resp = await client.get(f"{API_URL}/widget/config/test-tenant")
            cold_time = time.time() - start_time
            print(f"Cold Start / First Request Latency: {cold_time * 1000:.2f} ms")
        except Exception as e:
            print(f"Error on first request: {e}")
            return
            
        # 2. Warm up requests
        warm_times = []
        for i in range(10):
            start_time = time.time()
            try:
                resp = await client.get(f"{API_URL}/widget/config/test-tenant")
                warm_times.append(time.time() - start_time)
            except Exception as e:
                print(f"Error on warm request {i+1}: {e}")
                
        if warm_times:
            avg_warm_time = sum(warm_times) / len(warm_times)
            print(f"Average Warm Start Latency (10 requests): {avg_warm_time * 1000:.2f} ms")
            
        # Success Criteria
        if avg_warm_time < 0.2: # Less than 200ms
            print(f"{Fore.GREEN}✅ Latency is within acceptable production limits (<200ms).{Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}❌ Latency is too high: {avg_warm_time * 1000:.2f} ms.{Style.RESET_ALL}")

if __name__ == "__main__":
    asyncio.run(test_latency())
