#!/usr/bin/env python3
"""
FastAPI server for LiteLLM 1minAI proxy integration.
This server provides OpenAI-compatible endpoints for Psychiatry Therapy SuperBot.
"""

import os
import asyncio
import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import httpx
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="LiteLLM 1minAI Proxy for RAG Superbot",
    description="OpenAI-compatible proxy for 1minAI integration with RAG Superbot",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role (system, user, assistant)")
    content: str = Field(..., description="Message content")

class ChatCompletionRequest(BaseModel):
    model: str = Field(default="gemini-2.0-flash-lite", description="Model to use")
    messages: List[ChatMessage] = Field(..., description="List of chat messages")
    temperature: Optional[float] = Field(default=0.7, description="Sampling temperature")
    max_tokens: Optional[int] = Field(default=None, description="Maximum tokens to generate")
    stream: Optional[bool] = Field(default=False, description="Whether to stream response")

class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[Dict[str, Any]]
    usage: Dict[str, int]

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str = "litellm-1minai-proxy"
    version: str = "1.0.0"

# Global variables for configuration
ONEMINAI_API_KEY = os.getenv("ONEMINAI_API_KEY")
LITELLM_BASE_URL = os.getenv("LITELLM_BASE_URL", "https://api.1min.ai")

# 1minAI API integration functions
async def make_1minai_request(messages: List[ChatMessage], model: str, temperature: float = 0.7, max_tokens: Optional[int] = None) -> Dict[str, Any]:
    """
    Make a real request to 1minAI API using the correct endpoint and format.
    """
    if not ONEMINAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="ONEMINAI_API_KEY not configured"
        )
    
    # Transform messages to prompt format
    prompt_parts = []
    for msg in messages:
        role = msg.role
        content = msg.content
        if role == "system":
            prompt_parts.append(f"System: {content}")
        elif role == "assistant":
            prompt_parts.append(f"Assistant: {content}")
        else:
            prompt_parts.append(f"User: {content}")
    
    prompt = "\n\n".join(prompt_parts)
    
    # Map model names to 1minAI supported format
    model_mapping = {
        "1minai-gpt-4o-mini": "gpt-4o-mini",
        "1minai-gpt-4o": "gpt-4o",
        "1minai-claude-3-5-sonnet": "claude-3-5-sonnet",
        "1minai-claude-3-haiku": "claude-3-haiku",
        "gpt-4o-mini": "gpt-4o-mini",
        "gpt-4o": "gpt-4o",
        "claude-3-5-sonnet": "claude-3-5-sonnet",
        "claude-3-haiku": "claude-3-haiku",
        "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
        "gemini-2.0-flash": "gemini-2.0-flash",
        "gemini-1.5-flash": "gemini-1.5-flash",
        "gemini-1.5-pro": "gemini-1.5-pro"
    }
    
    # Use mapped model name or fallback to gemini-2.0-flash-lite
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
    
    headers = {
        "API-KEY": ONEMINAI_API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        logger.info(f"Making request to: https://api.1min.ai/api/features")
        logger.info(f"Request payload: {payload}")
        logger.info(f"Request headers (masked): API-KEY={ONEMINAI_API_KEY[:10]}..., Content-Type=application/json")
        logger.info(f"Using model: {mapped_model}")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.1min.ai/api/features",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                logger.info(f"1minAI API response status: {response.status}")
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"1minAI API request successful for model: {model}")
                    logger.info(f"1minAI API response: {result}")
                    
                    # Parse 1minAI response format
                    ai_record = result.get("aiRecord", {})
                    ai_record_detail = ai_record.get("aiRecordDetail", {})
                    result_object = ai_record_detail.get("resultObject", [])
                    
                    # Extract response text
                    response_text = ""
                    if isinstance(result_object, list) and result_object:
                        response_text = str(result_object[0])
                    else:
                        response_text = "No response generated"
                    
                    # Convert to OpenAI format
                    openai_response = {
                        "id": f"chatcmpl-{int(time.time())}",
                        "object": "chat.completion",
                        "created": int(time.time()),
                        "model": model,
                        "choices": [
                            {
                                "index": 0,
                                "message": {
                                    "role": "assistant",
                                    "content": response_text
                                },
                                "finish_reason": "stop"
                            }
                        ],
                        "usage": {
                            "prompt_tokens": len(prompt.split()),
                            "completion_tokens": len(response_text.split()),
                            "total_tokens": len(prompt.split()) + len(response_text.split())
                        }
                    }
                    
                    return openai_response
                else:
                    error_text = await response.text()
                    logger.error(f"1minAI API error: {response.status} - {error_text}")
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"1minAI API error: {error_text}"
                    )
    except aiohttp.ClientError as e:
        logger.error(f"1minAI API connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"1minAI API connection failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in 1minAI request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(e)}"
        )

async def get_1minai_models() -> List[Dict[str, Any]]:
    """
    Get available models from 1minAI.
    """
    if not ONEMINAI_API_KEY:
        logger.warning("ONEMINAI_API_KEY not configured")
        return []
    
    # Return supported models
    models = [
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
        },
    ]
    
    logger.info(f"Returning {len(models)} 1minAI models")
    return models

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for service monitoring."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        service="litellm-1minai-proxy-rag-superbot",
        version="1.0.0"
    )

# Chat completion endpoint
@app.post("/v1/chat/completions", response_model=ChatCompletionResponse)
@app.post("/chat/completions", response_model=ChatCompletionResponse)
async def chat_completions(request: ChatCompletionRequest):
    """
    OpenAI-compatible chat completions endpoint.
    Proxies requests to 1minAI.
    """
    try:
        # Validate API key
        if not ONEMINAI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="ONEMINAI_API_KEY not configured"
            )
        
        # Log request for debugging
        logger.info(f"Chat completion request for model: {request.model}")
        logger.info(f"Request messages: {len(request.messages)} messages")
        
        # Make real request to 1minAI API
        try:
            logger.info(f"Making request to 1minAI API for model: {request.model}")
            result = await make_1minai_request(
                messages=request.messages,
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            )
            
            logger.info(f"1minAI API response received")
            
            # Transform to response model
            response = ChatCompletionResponse(
                id=result.get("id", f"chatcmpl-{datetime.utcnow().timestamp()}"),
                created=result.get("created", int(datetime.utcnow().timestamp())),
                model=result.get("model", request.model),
                choices=result.get("choices", []),
                usage=result.get("usage", {})
            )
            
            logger.info(f"Successfully processed 1minAI request for model: {request.model}")
            return response
            
        except HTTPException as e:
            # Log the error and return a fallback response
            logger.error(f"1minAI API error: {e.detail}")
            logger.warning("Falling back to error response")
            
            # Return a fallback response
            response_id = f"chatcmpl-{datetime.utcnow().timestamp()}"
            fallback_response = ChatCompletionResponse(
                id=response_id,
                created=int(datetime.utcnow().timestamp()),
                model=request.model,
                choices=[
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": f"1minAI API is currently unavailable (Error: {e.detail}). Please check the API configuration."
                        },
                        "finish_reason": "stop"
                    }
                ],
                usage={
                    "prompt_tokens": 10,
                    "completion_tokens": 20,
                    "total_tokens": 30
                }
            )
            return fallback_response
            
        except Exception as e:
            logger.error(f"Error processing 1minAI request: {str(e)}")
            # Return a fallback response
            response_id = f"chatcmpl-{datetime.utcnow().timestamp()}"
            fallback_response = ChatCompletionResponse(
                id=response_id,
                created=int(datetime.utcnow().timestamp()),
                model=request.model,
                choices=[
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": f"Error processing request: {str(e)}"
                        },
                        "finish_reason": "stop"
                    }
                ],
                usage={
                    "prompt_tokens": 10,
                    "completion_tokens": 20,
                    "total_tokens": 30
                }
            )
            return fallback_response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error in chat completions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Models endpoint
@app.get("/v1/models")
async def list_models():
    """List available models from 1minAI."""
    try:
        # Get models
        models = await get_1minai_models()
        
        if models:
            logger.info(f"Retrieved {len(models)} models from 1minAI")
            return {
                "object": "list",
                "data": models
            }
        else:
            # Fallback to default model
            logger.warning("Failed to get models from 1minAI, using fallback")
            return {
                "object": "list",
                "data": [
                    {
                        "id": "gpt-4o-mini",
                        "object": "model",
                        "created": int(datetime.utcnow().timestamp()),
                        "owned_by": "1minai"
                    }
                ]
            }
    except Exception as e:
        logger.error(f"Error getting models: {str(e)}")
        # Return fallback models
        return {
            "object": "list",
            "data": [
                {
                    "id": "gpt-4o-mini",
                    "object": "model",
                    "created": int(datetime.utcnow().timestamp()),
                    "owned_by": "1minai"
                }
            ]
        }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "LiteLLM 1minAI Proxy for RAG Superbot",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "chat_completions": "/v1/chat/completions",
            "models": "/v1/models"
        }
    }

if __name__ == "__main__":
    # Configuration - Render uses PORT env var (default 10000), Railway uses PORT, fallback to FASTAPI_PORT
    host = os.getenv("FASTAPI_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("FASTAPI_PORT", "8000")))
    reload = os.getenv("FASTAPI_RELOAD", "false").lower() == "true"
    
    # Detect deployment environment
    environment = "local"
    if os.getenv("RENDER_SERVICE_NAME"):
        environment = "render"
    elif os.getenv("RAILWAY_ENVIRONMENT"):
        environment = "railway"
    
    logger.info(f"Starting LiteLLM 1minAI Proxy server on {host}:{port}")
    logger.info(f"1minAI API Key configured: {bool(ONEMINAI_API_KEY)}")
    logger.info(f"Environment: {environment}")
    
    # Run the server
    uvicorn.run(
        "fastapi_server:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
