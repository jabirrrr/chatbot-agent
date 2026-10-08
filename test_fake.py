import urllib.request
import json
req = urllib.request.Request('https://helio-backend-s55x.onrender.com/api/v1/auth/login', 
    data=json.dumps({'email': 'fake123@helio.com', 'password': 'wrongpassword'}).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}, 
    method='POST')
try:
    urllib.request.urlopen(req)
except Exception as e:
    print(e.code)
    print(e.read().decode('utf-8'))
