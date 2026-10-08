import urllib.request
import urllib.error
import json
import sys

url = "https://helio-backend-s55x.onrender.com/api/v1/auth/login"
data = json.dumps({"email": "demo-admin@helio.com", "password": "demo1234"}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req, timeout=15) as response:
        print(f"Status: {response.status}")
        body = response.read().decode('utf-8')
        print(f"Body: {body[:200]}")
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Exception: {e}")
