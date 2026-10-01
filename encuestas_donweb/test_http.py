import urllib.request
import json

try:
    url = 'http://localhost/encuestas/api/api.php/encuestas'
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode('utf-8')[:100])
except Exception as e:
    print("Error:", e)
