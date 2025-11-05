#!/usr/bin/env python3
"""
Enhanced server for Psychiatry Therapy SuperBot LiteLLM Proxy.
Includes real 1minAI API integration with Python standard library only.
"""

import os
import time
import json
import logging
from typing import Dict, Any, List
from datetime import datetime
import urllib.request
import urllib.parse
import urllib.error

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple HTTP server using built-in modules
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

# Environment variables
ONEMINAI_API_KEY = os.getenv("ONEMINAI_API_KEY")
PORT = int(os.getenv("PORT", "10000"))

# 1minAI API integration using urllib (built-in)
def make_1minai_request(messages, model="gemini-2.0-flash-lite"):
    """Make request to 1minAI API using only built-in urllib"""
    if not ONEMINAI_API_KEY:
        raise Exception("ONEMINAI_API_KEY not configured")
    
    # Transform messages to prompt format
    prompt_parts = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            prompt_parts.append(f"System: {content}")
        elif role == "assistant":
            prompt_parts.append(f"Assistant: {content}")
        else:
            prompt_parts.append(f"User: {content}")
    
    prompt = "\n\n".join(prompt_parts)
    
    # Map model names to 1minAI supported format
    model_mapping = {
        "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
        "gemini-2.0-flash": "gemini-2.0-flash",
        "gemini-1.5-flash": "gemini-1.5-flash",
        "gemini-1.5-pro": "gemini-1.5-pro",
        "gpt-4o-mini": "gpt-4o-mini",
        "gpt-4o": "gpt-4o",
        "claude-3-5-sonnet": "claude-3-5-sonnet",
        "claude-3-haiku": "claude-3-haiku"
    }
    
    mapped_model = model_mapping.get(model, "gemini-2.0-flash-lite")
    
    # Create 1minAI payload
    payload = {
        "type": "CHAT_WITH_AI",
        "model": mapped_model,
        "promptObject": {
            "prompt": prompt,
            "isMixed": False,
            "webSearch": False
        }
    }
    
    # Prepare request (same as original FastAPI server)
    url = "https://api.1min.ai/api/features"
    headers = {
        "API-KEY": ONEMINAI_API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        # Make request using urllib (matching v2 project format exactly)
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers)
        
        logger.info(f"Making request to: https://api.1min.ai/api/features")
        logger.info(f"Request payload: {payload}")
        logger.info(f"Request headers (masked): API-KEY={ONEMINAI_API_KEY[:10] if ONEMINAI_API_KEY else 'None'}..., Content-Type=application/json")
        logger.info(f"Using model: {mapped_model}")
        
        with urllib.request.urlopen(req, timeout=60) as response:
            logger.info(f"1minAI API response status: {response.status}")
            if response.status == 200:
                result = json.loads(response.read().decode('utf-8'))
                logger.info(f"1minAI API request successful for model: {model}")
                logger.info(f"1minAI API response: {result}")
                
                # Parse 1minAI response format (exact same as v2)
                ai_record = result.get("aiRecord", {})
                ai_record_detail = ai_record.get("aiRecordDetail", {})
                result_object = ai_record_detail.get("resultObject", [])
                
                # Extract response text (exact same as v2)
                response_text = ""
                if isinstance(result_object, list) and result_object:
                    response_text = str(result_object[0])
                else:
                    response_text = "No response generated"
                
                return response_text
            else:
                error_text = response.read().decode('utf-8')
                logger.error(f"1minAI API error: {response.status} - {error_text}")
                return "I'm experiencing technical difficulties. Please try again later."
                
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
        logger.error(f"1minAI API HTTP error: {e.code} - {error_body}")
        return f"1minAI API is currently unavailable (Error: {e.code}). Please check the API configuration."
    except urllib.error.URLError as e:
        logger.error(f"1minAI API connection error: {str(e)}")
        return "I'm currently unable to connect to my AI service. Please try again later."
    except Exception as e:
        logger.error(f"Unexpected error in 1minAI request: {str(e)}")
        return "I encountered an unexpected error. Please try again later."

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        
        if path == "/health":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "service": "psychiatry-therapy-superbot-api",
                "version": "1.0.0"
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif path == "/v1/models":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            models = {
                "object": "list",
                "data": [
                    {
                        "id": "gemini-2.0-flash-lite",
                        "object": "model",
                        "created": int(time.time()),
                        "owned_by": "1minai"
                    },
                    {
                        "id": "gemini-2.0-flash",
                        "object": "model",
                        "created": int(time.time()),
                        "owned_by": "1minai"
                    },
                    {
                        "id": "gemini-1.5-flash",
                        "object": "model",
                        "created": int(time.time()),
                        "owned_by": "1minai"
                    },
                    {
                        "id": "gemini-1.5-pro",
                        "object": "model",
                        "created": int(time.time()),
                        "owned_by": "1minai"
                    },
                    {
                        "id": "gpt-4o-mini",
                        "object": "model",
                        "created": int(time.time()),
                        "owned_by": "1minai"
                    },
                    {
                        "id": "gpt-4o",
                        "object": "model",
                        "created": int(time.time()),
                        "owned_by": "1minai"
                    },
                    {
                        "id": "claude-3-5-sonnet",
                        "object": "model",
                        "created": int(time.time()),
                        "owned_by": "1minai"
                    },
                    {
                        "id": "claude-3-haiku",
                        "object": "model",
                        "created": int(time.time()),
                        "owned_by": "1minai"
                    }
                ]
            }
            self.wfile.write(json.dumps(models).encode())
            
        elif path == "/":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                "service": "Psychiatry Therapy SuperBot LiteLLM Proxy",
                "version": "1.0.0",
                "status": "running",
                "endpoints": {
                    "health": "/health",
                    "chat_completions": "/v1/chat/completions",
                    "models": "/v1/models"
                }
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not Found"}).encode())

    def do_POST(self):
        if self.path in ["/v1/chat/completions", "/chat/completions"]:
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                # Extract request parameters
                messages = request_data.get("messages", [])
                model = request_data.get("model", "gemini-2.0-flash-lite")
                
                if not messages:
                    raise ValueError("Messages array is required")
                
                logger.info(f"Processing chat request with {len(messages)} messages for model: {model}")
                
                # Make real request to 1minAI API
                ai_response = make_1minai_request(messages, model)
                
                # Create OpenAI-compatible response
                response = {
                    "id": f"chatcmpl-{int(time.time())}",
                    "object": "chat.completion",
                    "created": int(time.time()),
                    "model": model,
                    "choices": [
                        {
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": ai_response
                            },
                            "finish_reason": "stop"
                        }
                    ],
                    "usage": {
                        "prompt_tokens": sum(len(msg.get("content", "").split()) for msg in messages),
                        "completion_tokens": len(ai_response.split()),
                        "total_tokens": sum(len(msg.get("content", "").split()) for msg in messages) + len(ai_response.split())
                    }
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                
                logger.info(f"Successfully processed chat request")
                
            except Exception as e:
                logger.error(f"Error processing chat request: {e}")
                
                # Return error response in OpenAI format
                error_response = {
                    "id": f"chatcmpl-{int(time.time())}",
                    "object": "chat.completion",
                    "created": int(time.time()),
                    "model": request_data.get("model", "gemini-2.0-flash-lite") if 'request_data' in locals() else "gemini-2.0-flash-lite",
                    "choices": [
                        {
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": f"I apologize, but I encountered an error: {str(e)}. Please try again."
                            },
                            "finish_reason": "stop"
                        }
                    ],
                    "usage": {
                        "prompt_tokens": 10,
                        "completion_tokens": 20,
                        "total_tokens": 30
                    }
                }
                
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(error_response).encode())
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not Found"}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def log_message(self, format, *args):
        logger.info(f"{self.address_string()} - {format % args}")

if __name__ == "__main__":
    logger.info(f"Starting Psychiatry Therapy SuperBot API on port {PORT}")
    logger.info(f"1minAI API Key configured: {bool(ONEMINAI_API_KEY)}")
    if ONEMINAI_API_KEY:
        logger.info(f"API Key length: {len(ONEMINAI_API_KEY)} characters")
        logger.info(f"API Key starts with: {ONEMINAI_API_KEY[:10]}...")
    else:
        logger.warning("⚠️  ONEMINAI_API_KEY environment variable not set!")
        logger.warning("Please set it in Render dashboard under Environment tab")
    
    server = HTTPServer(('0.0.0.0', PORT), SimpleHandler)
    
    try:
        logger.info(f"Server running at http://0.0.0.0:{PORT}")
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
        server.shutdown()