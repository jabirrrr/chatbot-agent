import urllib.request
import re

html = urllib.request.urlopen('https://chatbot-agent-lemon.vercel.app/').read().decode('utf-8')
js_files = set(re.findall(r'src="(.*?\.js)"', html))
print('Found JS files:', len(js_files))
any_match = False
for js in js_files:
    url = js if js.startswith('http') else 'https://chatbot-agent-lemon.vercel.app' + js
    try:
        content = urllib.request.urlopen(url).read().decode('utf-8')
        if 'onrender.com' in content:
            print('Found onrender.com in', js)
            any_match = True
        if 'localhost:8000' in content:
            print('Found localhost:8000 in', js)
            any_match = True
    except Exception as e:
        print('Error fetching', js, e)
print('Matches found:', any_match)
