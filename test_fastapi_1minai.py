#!/usr/bin/env python3
"""
Test the 1minAI API call from the original FastAPI server
"""

import os
import asyncio
import json
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ONEMINAI_API_KEY = os.getenv("ONEMINAI_API_KEY")

async def test_1minai_fastapi_style():
    """Test using the exact same method as fastapi_server.py"""
    
    # Transform messages to prompt format (same as FastAPI server)
    messages = [{"role": "user", "content": "Hello, how are you?"}]
    prompt_parts = []
    for msg in messages:
        role = msg["role"]
        content = msg["content"]
        if role == "system":
            prompt_parts.append(f"System: {content}")
        elif role == "assistant":
            prompt_parts.append(f"Assistant: {content}")
        else:
            prompt_parts.append(f"User: {content}")
    
    prompt = "\n\n".join(prompt_parts)
    
    # Create 1minAI payload (exact same as FastAPI server)
    payload = {
        "type": "CHAT_WITH_AI",
        "model": "gemini-2.0-flash-lite",
        "promptObject": {
            "prompt": prompt,
            "isMixed": False,
            "webSearch": False
        }
    }
    
    headers = {
        "API-KEY": ONEMINAI_API_KEY,
        "Content-Type": "application/json"
    }
    
    print(f"Testing 1minAI API with FastAPI server method...")
    print(f"API Key: {ONEMINAI_API_KEY[:10] if ONEMINAI_API_KEY else 'None'}...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.1min.ai/api/features",
                json=payload,
                headers=headers
            )
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Success! Response: {json.dumps(result, indent=2)}")
                
                # Parse response like FastAPI server
                ai_record = result.get("aiRecord", {})
                ai_record_detail = ai_record.get("aiRecordDetail", {})
                result_object = ai_record_detail.get("resultObject", [])
                
                if isinstance(result_object, list) and result_object:
                    response_text = str(result_object[0])
                    print(f"Extracted response: {response_text}")
                else:
                    print("No response text found in result")
            else:
                error_text = response.text
                print(f"Error: {response.status_code} - {error_text}")
                
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_1minai_fastapi_style())