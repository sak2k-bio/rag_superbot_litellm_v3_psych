#!/usr/bin/env python3
import os
import asyncio
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

ONEMINAI_API_KEY = os.getenv("ONEMINAI_API_KEY")

async def test_1minai_v2():
    """Test 1minAI API v2 unified chat endpoint"""
    payload = {
        "type": "UNIFY_CHAT_WITH_AI",
        "model": "gpt-4o-mini",
        "promptObject": {
            "prompt": "User: Reply with OK only."
        }
    }

    headers = {
        "API-KEY": ONEMINAI_API_KEY,
        "Content-Type": "application/json"
    }

    print(f"Testing 1minAI API v2...")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.1min.ai/api/chat-with-ai",
                json=payload,
                headers=headers
            )
            print(f"Response status: {response.status_code}")

            if response.status_code == 200:
                result = response.json()
                print(f"Success! Response: {json.dumps(result, indent=2)}")

                ai_record = result.get("aiRecord", {})
                ai_record_detail = ai_record.get("aiRecordDetail", {})
                result_object = ai_record_detail.get("resultObject", [])

                if isinstance(result_object, list) and result_object:
                    response_text = str(result_object[0])
                    print(f"\nExtracted response: {response_text}")
                else:
                    print("No response text found in result")
            else:
                error_text = response.text
                print(f"Error: {response.status_code} - {error_text}")

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_1minai_v2())
