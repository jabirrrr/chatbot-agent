import urllib.request
import json
req = urllib.request.Request('http://localhost:8000/api/v1/auth/login', 
    data=json.dumps({'email': 'demo-admin@helio.com', 'password': 'demo1234'}).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}, 
    method='POST')
try:
    print(urllib.request.urlopen(req).read().decode('utf-8'))
except Exception as e:
    print(e.code)
    print(e.read().decode('utf-8'))
