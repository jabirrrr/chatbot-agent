import urllib.request
import urllib.error
import json
req = urllib.request.Request('https://chatbot-agent-lemon.vercel.app/api/v1/auth/login', 
    data=json.dumps({'email': 'demo-admin@helio.com', 'password': 'demo1234'}).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}, 
    method='POST')
try:
    urllib.request.urlopen(req)
except Exception as e:
    print(e.code)
    print(e.headers)
