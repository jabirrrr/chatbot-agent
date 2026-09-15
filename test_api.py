"""
Helio Platform - CLI API Smoke Test
Quickly verifies local FastAPI authentication endpoint connectivity.
"""

import urllib.request
import urllib.error
import json
import sys

def test_login(base_url="http://127.0.0.1:8000"):
    endpoint = f"{base_url}/api/v1/auth/login"
    payload = {"email": "demo@helio.com", "password": "Password123!"}
    
    req = urllib.request.Request(
        endpoint, 
        data=json.dumps(payload).encode('utf-8'), 
        headers={'Content-Type': 'application/json'}, 
        method='POST'
    )

    try:
        with urllib.request.urlopen(req) as response:
            result = response.read().decode('utf-8')
            print(f"[SUCCESS] Login endpoint responded 200 OK:")
            print(result)
            return True
    except urllib.error.HTTPError as e:
        print(f"[HTTP Error {e.code}] {e.read().decode('utf-8')}")
        return False
    except urllib.error.URLError as e:
        print(f"[Connection Error] Could not connect to {base_url}: {e.reason}")
        return False

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
    test_login(url)
