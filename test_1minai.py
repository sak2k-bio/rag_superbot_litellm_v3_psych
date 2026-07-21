#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

ONEMINAI_API_KEY = "5736fcb4bcf61ad04bd7637a0fed935401de06bf64f79b4822bb64fbaab8c1d3"

def test_1minai_api_v2():
    """Test 1minAI API v2: POST /api/chat-with-ai with UNIFY_CHAT_WITH_AI"""
    url = "https://api.1min.ai/api/chat-with-ai"

    payload = {
        "type": "UNIFY_CHAT_WITH_AI",
        "model": "gpt-4o-mini",
        "promptObject": {
            "prompt": "Reply with OK only."
        }
    }

    headers = {
        "API-KEY": ONEMINAI_API_KEY,
        "Content-Type": "application/json"
    }

    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers)

        print(f"Testing 1minAI API v2 (unified chat)...")
        print(f"URL: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")

        with urllib.request.urlopen(req, timeout=30) as response:
            print(f"Response status: {response.status}")
            result = response.read().decode('utf-8')
            print(f"Response: {result}")
            try:
                parsed = json.loads(result)
                print(f"Parsed response: {json.dumps(parsed, indent=2)}")
                ai_record = parsed.get("aiRecord", {})
                detail = ai_record.get("aiRecordDetail", {})
                result_object = detail.get("resultObject", [])
                if isinstance(result_object, list) and result_object:
                    print(f"\nExtracted text: {result_object[0]}")
            except:
                print("Response is not valid JSON")

    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        error_body = e.read().decode('utf-8')
        print(f"Error body: {error_body}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_1minai_api_v2()
