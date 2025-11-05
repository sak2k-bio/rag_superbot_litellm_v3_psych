#!/usr/bin/env python3
"""
Minimal FastAPI server for Psychiatry Therapy SuperBot LiteLLM Proxy.
Optimized for Render free tier with Python 3.13 compatibility.
"""

import os
import time
import json
import logging
from typing import Dict, Any, List
from datetime import datetime

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
                
                # Simple response for now
                response = {
                    "id": f"chatcmpl-{int(time.time())}",
                    "object": "chat.completion",
                    "created": int(time.time()),
                    "model": request_data.get("model", "gemini-2.0-flash-lite"),
                    "choices": [
                        {
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": "Hello! I'm your Psychiatry Therapy SuperBot. I'm currently running in minimal mode on Render's free tier. How can I help you today?"
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
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                logger.error(f"Error processing request: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                error_response = {"error": "Internal Server Error", "message": str(e)}
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
    
    server = HTTPServer(('0.0.0.0', PORT), SimpleHandler)
    
    try:
        logger.info(f"Server running at http://0.0.0.0:{PORT}")
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
        server.shutdown()