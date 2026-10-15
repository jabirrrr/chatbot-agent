import urllib.request
import urllib.error
import json
import sys

def main():
    print("=== 1. Testing Unauthenticated Access ===")
    try:
        req_no_auth = urllib.request.Request("https://helio-backend-s55x.onrender.com/api/v1/admin/logs/history")
        urllib.request.urlopen(req_no_auth, timeout=10)
        print("FAIL: Expected HTTP 401 Unauthorized")
        sys.exit(1)
    except urllib.error.HTTPError as e:
        print(f"PASS: Rejected unauthenticated request with HTTP {e.code}")
        assert e.code == 401

    print("\n=== 2. Authenticating as Super User ===")
    url = "https://helio-backend-s55x.onrender.com/api/v1/auth/login"
    data = json.dumps({"email": "demo-admin@helio.com", "password": "admin1234"}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=15) as r:
        resp = json.loads(r.read().decode())
        token = resp["access_token"]
        role = resp["user"]["platform_role"]
        print(f"PASS: Authenticated as {role}. Bearer token obtained.")
        assert role == "super_user"

    print("\n=== 3. Testing History & Sanitization on Render ===")
    req_history = urllib.request.Request(
        "https://helio-backend-s55x.onrender.com/api/v1/admin/logs/history",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req_history, timeout=15) as r2:
        hist_data = json.loads(r2.read().decode())
        print(f"PASS: History retrieved! HTTP {r2.status}")
        print(f"  Total available logs: {hist_data['total_available']}")
        print(f"  Redis connected: {hist_data['redis_connected']}")
        print(f"  Degraded state (is_process_local_only): {hist_data['is_process_local_only']}")
        print(f"  Notice: {hist_data['storage_notice']}")

        for entry in hist_data["logs"][:5]:
            print(f"  - [{entry['level']}] ({entry['source']}) {entry['message']}")
            raw_str = json.dumps(entry)
            assert "admin1234" not in raw_str, "Password leaked!"
            assert token not in raw_str, "Token leaked!"
        print("PASS: Verified zero credential or token leakage in real live events.")

    print("\n=== 4. Testing Real Live SSE Stream Handshake on Render ===")
    req_stream = urllib.request.Request(
        "https://helio-backend-s55x.onrender.com/api/v1/admin/logs/stream",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req_stream, timeout=15) as stream_resp:
        print(f"PASS: SSE stream established! HTTP {stream_resp.status}")
        content_type = stream_resp.headers.get("Content-Type")
        print(f"  Content-Type: {content_type}")
        assert "text/event-stream" in content_type

        # Read initial SSE frames
        line1 = stream_resp.readline().decode()
        line2 = stream_resp.readline().decode()
        line3 = stream_resp.readline().decode()
        handshake = (line1 + line2 + line3).strip()
        print(f"  Initial Handshake Frame:\n  {handshake}")
        assert "event: connected" in handshake
        print("PASS: Real Render SSE stream connected and validated successfully!")

    print("\n==============================================")
    print("ALL PRODUCTION DEPLOYMENT TESTS PASSED ON RENDER!")
    print("==============================================")

if __name__ == "__main__":
    main()
