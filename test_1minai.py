#!/usr/bin/env python3
"""
Test script to verify 1minAI API key and endpoint
"""

import json
import urllib.request
import urllib.error

# Test the 1minAI API
ONEMINAI_API_KEY = "5736fcb4bcf61ad04bd7637a0fed935401de06bf64f79b4822bb64fbaab8c1d3"

def test_1minai_api():
    url = "https://api.1min.ai/api/features"
    
    payload = {
        "type": "CHAT_WITH_AI",
        "model": "gemini-2.0-flash-lite",
        "promptObject": {
            "prompt": "Hello, how are you?",
            "isMixed": False,
            "webSearch": False
        }
    }
    
    headers = {
        "API-KEY": ONEMINAI_API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers)
        
        print(f"Testing 1minAI API...")
        print(f"URL: {url}")
        print(f"API Key: {ONEMINAI_API_KEY[:10]}...")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        with urllib.request.urlopen(req, timeout=30) as response:
            print(f"Response status: {response.status}")
            result = response.read().decode('utf-8')
            print(f"Response: {result}")
            
            # Try to parse JSON
            try:
                parsed = json.loads(result)
                print(f"Parsed response: {json.dumps(parsed, indent=2)}")
            except:
                print("Response is not valid JSON")
                
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        error_body = e.read().decode('utf-8')
        print(f"Error body: {error_body}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_1minai_api()