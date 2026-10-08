import urllib.request
import urllib.error
import json
req = urllib.request.Request('https://helio-backend-s55x.onrender.com/api/v1/auth/login', 
    data=json.dumps({'email': 'demo-admin@helio.com', 'password': 'demo1234'}).encode('utf-8'), 
    headers={'Content-Type': 'application/json', 'Origin': 'https://chatbot-agent-lemon.vercel.app'}, 
    method='POST')
try:
    urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    print(e.headers)
