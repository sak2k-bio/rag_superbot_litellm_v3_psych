#!/usr/bin/env python3
import os
import asyncio
import logging
import time
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LiteLLM 1minAI Proxy for RAG Superbot",
    description="OpenAI-compatible proxy for 1minAI integration with RAG Superbot",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------------
# Pydantic models
# ----------------------------------------------------------------
class ToolCallFunction(BaseModel):
    name: str = ""
    arguments: str = ""

class ToolCall(BaseModel):
    id: str = ""
    type: str = "function"
    function: ToolCallFunction = ToolCallFunction()

class FunctionDef(BaseModel):
    name: str
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class ToolDef(BaseModel):
    type: str = "function"
    function: FunctionDef

class ResponseFormat(BaseModel):
    type: Optional[str] = None

class ChatMessage(BaseModel):
    role: str
    content: Optional[str] = None
    tool_calls: Optional[List[ToolCall]] = None
    tool_call_id: Optional[str] = None
    name: Optional[str] = None

class ChatCompletionRequest(BaseModel):
    model: str = Field(default="gpt-4o-mini")
    messages: List[ChatMessage]
    temperature: Optional[float] = Field(default=0.7)
    top_p: Optional[float] = Field(default=1.0)
    max_tokens: Optional[int] = Field(default=None)
    stop: Optional[List[str]] = None
    stream: Optional[bool] = Field(default=False)
    user: Optional[str] = None
    response_format: Optional[ResponseFormat] = None
    tools: Optional[List[ToolDef]] = None
    tool_choice: Optional[str] = Field(default="auto")
    conversation_id: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str = "litellm-1minai-proxy-rag-superbot"
    version: str = "1.1.0"

# ----------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------
ONEMINAI_API_KEY = os.getenv("ONEMINAI_API_KEY")
ONEMINAI_BASE_URL = os.getenv("ONEMINAI_BASE_URL", "https://api.1min.ai")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_KEY_2 = os.getenv("OPENROUTER_API_KEY_2")
OPENROUTER_API_KEY_3 = os.getenv("OPENROUTER_API_KEY_3")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_API_KEY_2 = os.getenv("MISTRAL_API_KEY_2")
MISTRAL_API_KEY_3 = os.getenv("MISTRAL_API_KEY_3")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-small-latest")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GEMINI_API_KEY_2 = os.getenv("GEMINI_API_KEY_2")
GEMINI_API_KEY_3 = os.getenv("GEMINI_API_KEY_3")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# ----------------------------------------------------------------
# Auth helper
# ----------------------------------------------------------------
def get_bearer_token(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    api_key_header = request.headers.get("API-KEY", "")
    if api_key_header:
        return api_key_header
    return None

def verify_auth(request: Request):
    token = get_bearer_token(request)
    if not ONEMINAI_API_KEY:
        return
    if token != ONEMINAI_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

# ----------------------------------------------------------------
# Model mapping
# ----------------------------------------------------------------
MODEL_MAPPING = {
    # OpenAI
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4o": "gpt-4o",
    "gpt-4-turbo": "gpt-4-turbo",
    "gpt-4.1": "gpt-4.1",
    "gpt-4.1-mini": "gpt-4.1-mini",
    "gpt-4.1-nano": "gpt-4.1-nano",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
    "gpt-5": "gpt-5",
    "gpt-5-chat-latest": "gpt-5-chat-latest",
    "gpt-5-mini": "gpt-5-mini",
    "gpt-5-nano": "gpt-5-nano",
    "gpt-5.1": "gpt-5.1",
    "gpt-5.1-codex": "gpt-5.1-codex",
    "gpt-5.1-codex-mini": "gpt-5.1-codex-mini",
    "gpt-5.2": "gpt-5.2",
    "gpt-5.2-pro": "gpt-5.2-pro",
    "gpt-5.2-codex": "gpt-5.2-codex",
    "gpt-5.3-codex": "gpt-5.3-codex",
    "gpt-5.4": "gpt-5.4",
    "gpt-5.4-mini": "gpt-5.4-mini",
    "gpt-5.4-nano": "gpt-5.4-nano",
    "gpt-5.4-pro": "gpt-5.4-pro",
    "gpt-5.5": "gpt-5.5",
    "gpt-5.5-pro": "gpt-5.5-pro",
    "o3": "o3",
    "o3-mini": "o3-mini",
    "o3-pro": "o3-pro",
    "o3-deep-research": "o3-deep-research",
    "o4-mini": "o4-mini",
    "o4-mini-deep-research": "o4-mini-deep-research",
    # Anthropic
    "claude-sonnet-4-6": "claude-sonnet-4-6",
    "claude-sonnet-4-5": "claude-sonnet-4-5-20250929",
    "claude-opus-4-8": "claude-opus-4-8",
    "claude-opus-4-7": "claude-opus-4-7",
    "claude-opus-4-6": "claude-opus-4-6",
    "claude-opus-4-5": "claude-opus-4-5-20251101",
    "claude-opus-4-1": "claude-opus-4-1-20250805",
    "claude-haiku-4-5": "claude-haiku-4-5-20251001",
    # Google
    "gemini-3.5-flash": "gemini-3.5-flash",
    "gemini-3.1-pro": "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite": "gemini-3.1-flash-lite-preview",
    "gemini-3-flash": "gemini-3-flash-preview",
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini-2.5-flash": "gemini-2.5-flash",
    # Mistral
    "mistral-small-latest": "mistral-small-latest",
    "mistral-medium-latest": "mistral-medium-latest",
    "mistral-large-latest": "mistral-large-latest",
    "magistral-small-latest": "magistral-small-latest",
    "magistral-medium-latest": "magistral-medium-latest",
    "ministral-14b-latest": "ministral-14b-latest",
    "open-mistral-nemo": "open-mistral-nemo",
    # DeepSeek
    "deepseek-chat": "deepseek-chat",
    "deepseek-reasoner": "deepseek-reasoner",
    # Alibaba Qwen
    "qwen3-max": "qwen3-max",
    "qwen3-8b": "qwen3-8b",
    "qwen3-vl-plus": "qwen3-vl-plus",
    "qwen3-vl-flash": "qwen3-vl-flash",
    "qwen3-vl-8b-thinking": "qwen3-vl-8b-thinking",
    "qwen-max": "qwen-max",
    "qwen-plus": "qwen-plus",
    "qwen-flash": "qwen-flash",
    "qwen-vl-max": "qwen-vl-max",
    "qwen-vl-plus": "qwen-vl-plus",
    # xAI Grok
    "grok-3": "grok-3",
    "grok-3-mini": "grok-3-mini",
    "grok-4": "grok-4-0709",
    "grok-4-fast-reasoning": "grok-4-fast-reasoning",
    "grok-4-fast-non-reasoning": "grok-4-fast-non-reasoning",
    # Meta / open-source
    "llama-2-70b": "meta/llama-2-70b-chat",
    "llama-3-70b": "meta/meta-llama-3-70b-instruct",
    "llama-4-scout": "meta/llama-4-scout-instruct",
    "llama-4-maverick": "meta/llama-4-maverick-instruct",
    "gpt-oss-20b": "openai/gpt-oss-20b",
    "gpt-oss-120b": "openai/gpt-oss-120b",
    # Cohere
    "command-r": "command-r-08-2024",
    # Perplexity
    "sonar": "sonar",
    "sonar-pro": "sonar-pro",
    "sonar-reasoning-pro": "sonar-reasoning-pro",
    "sonar-deep-research": "sonar-deep-research",
}

def map_model(model: str) -> str:
    return MODEL_MAPPING.get(model, model)

# ----------------------------------------------------------------
# Convert messages to a flat prompt string
# ----------------------------------------------------------------
def messages_to_prompt(messages: List[ChatMessage]) -> str:
    parts = []
    for msg in messages:
        role = msg.role
        content = msg.content or ""
        if role == "system":
            parts.append(f"System: {content}")
        elif role == "assistant":
            if msg.tool_calls:
                for tc in msg.tool_calls:
                    args = tc.function.arguments if tc.function else "{}"
                    parts.append(f"Assistant: [tool_call: {tc.function.name}({args})]")
            else:
                parts.append(f"Assistant: {content}")
        elif role == "tool":
            parts.append(f"Tool ({msg.name or 'tool'}): {content}")
        else:
            parts.append(f"User: {content}")
    return "\n\n".join(parts)

# ----------------------------------------------------------------
# 1minAI API v2: POST /api/chat-with-ai
# ----------------------------------------------------------------
async def call_1minai_chat(
    prompt_text: str,
    model: str,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    stream: bool = False,
    conversation_id: Optional[str] = None,
    web_search: bool = False,
) -> Dict[str, Any]:
    api_key = ONEMINAI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="ONEMINAI_API_KEY not configured")

    mapped_model = map_model(model)

    prompt_object: Dict[str, Any] = {"prompt": prompt_text}
    if conversation_id:
        prompt_object["conversationId"] = conversation_id

    payload: Dict[str, Any] = {
        "type": "UNIFY_CHAT_WITH_AI",
        "model": mapped_model,
        "promptObject": prompt_object,
    }

    headers = {
        "API-KEY": api_key,
        "Content-Type": "application/json",
    }

    url = f"{ONEMINAI_BASE_URL}/api/chat-with-ai"
    if stream:
        url = f"{url}?isStreaming=true"

    logger.info(f"1minAI chat request: model={mapped_model}, stream={stream}, conv={conversation_id}")

    async with httpx.AsyncClient(timeout=120.0) as client:
        if stream:
            return await _stream_1minai(client, url, headers, payload)
        response = await client.post(url, json=payload, headers=headers)
        if response.status_code != 200:
            error_text = response.text
            logger.error(f"1minAI API error: {response.status_code} - {error_text}")
            raise HTTPException(status_code=response.status_code, detail=f"1minAI API error: {error_text}")
        result = response.json()
        return _parse_1minai_response(result, model)

async def _stream_1minai(client, url, headers, payload):
    async def event_generator():
        async with client.stream("POST", url, json=payload, headers=headers) as resp:
            if resp.status_code != 200:
                error_text = await resp.aread()
                yield f"data: {json.dumps({'error': f'API error {resp.status_code}: {error_text.decode()}'})}\n\n"
                yield "data: [DONE]\n\n"
                return
            event_name = None
            async for raw_line in resp.aiter_lines():
                line = raw_line.strip()
                if not line:
                    event_name = None
                    continue
                if line.startswith("event:"):
                    event_name = line[len("event:"):].strip()
                    continue
                if line.startswith("data:"):
                    data_str = line[len("data:"):].strip()
                    if not data_str:
                        continue
                    try:
                        data = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue
                    if event_name == "content":
                        chunk = data.get("content", "")
                        if chunk:
                            sse = {
                                "id": f"chatcmpl-{int(time.time()*1000)}",
                                "object": "chat.completion.chunk",
                                "created": int(time.time()),
                                "model": payload["model"],
                                "choices": [{"index": 0, "delta": {"content": chunk}, "finish_reason": None}],
                            }
                            yield f"data: {json.dumps(sse)}\n\n"
                    elif event_name == "error":
                        msg = data.get("message") or data.get("error") or "Unknown stream error"
                        yield f"data: {json.dumps({'error': msg})}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    elif event_name == "done":
                        final = {
                            "id": f"chatcmpl-{int(time.time()*1000)}",
                            "object": "chat.completion.chunk",
                            "created": int(time.time()),
                            "model": payload["model"],
                            "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
                        }
                        yield f"data: {json.dumps(final)}\n\n"
                        yield "data: [DONE]\n\n"
                        return
    return event_generator()

def _parse_1minai_response(result: Dict[str, Any], model: str) -> Dict[str, Any]:
    ai_record = result.get("aiRecord", {})
    ai_record_detail = ai_record.get("aiRecordDetail", {})
    result_object = ai_record_detail.get("resultObject", [])

    response_text = ""
    if isinstance(result_object, list) and result_object:
        response_text = "\n".join(str(item) for item in result_object)
    elif isinstance(result_object, str):
        response_text = result_object
    else:
        response_text = ""

    return {
        "id": f"chatcmpl-{int(time.time())}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": model,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_text,
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
        },
    }

# ----------------------------------------------------------------
# Fallback providers
# ----------------------------------------------------------------
async def call_openrouter(
    messages: List[ChatMessage],
    model: str,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    for key in [OPENROUTER_API_KEY, OPENROUTER_API_KEY_2, OPENROUTER_API_KEY_3]:
        if not key:
            continue
        try:
            mapped = MODEL_MAPPING.get(model, "openai/gpt-4o-mini")
            payload = {
                "model": mapped,
                "messages": [{"role": m.role, "content": m.content or ""} for m in messages],
                "temperature": temperature,
            }
            if max_tokens:
                payload["max_tokens"] = max_tokens
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.warning(f"OpenRouter fallback failed: {e}")
    return None

async def call_mistral(
    messages: List[ChatMessage],
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    for key in [MISTRAL_API_KEY, MISTRAL_API_KEY_2, MISTRAL_API_KEY_3]:
        if not key:
            continue
        try:
            payload = {
                "model": "mistral-small-latest",
                "messages": [{"role": m.role, "content": m.content or ""} for m in messages],
                "temperature": temperature,
            }
            if max_tokens:
                payload["max_tokens"] = max_tokens
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post("https://api.mistral.ai/v1/chat/completions", json=payload, headers=headers)
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.warning(f"Mistral fallback failed: {e}")
    return None

async def call_gemini(
    messages: List[ChatMessage],
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    for key in [GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3]:
        if not key:
            continue
        try:
            gemini_model = GEMINI_MODEL
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={key}"
            contents = []
            for m in messages:
                role = "model" if m.role == "assistant" else "user"
                contents.append({"role": role, "parts": [{"text": m.content or ""}]})
            payload = {"contents": contents}
            if temperature is not None:
                payload["generationConfig"] = {"temperature": temperature}
            if max_tokens:
                if "generationConfig" not in payload:
                    payload["generationConfig"] = {}
                payload["generationConfig"]["maxOutputTokens"] = max_tokens
            headers = {"Content-Type": "application/json"}
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    text = ""
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        text = "".join(p.get("text", "") for p in parts)
                    return {
                        "id": f"chatcmpl-{int(time.time())}",
                        "object": "chat.completion",
                        "created": int(time.time()),
                        "model": gemini_model,
                        "choices": [{"index": 0, "message": {"role": "assistant", "content": text}, "finish_reason": "stop"}],
                        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                    }
        except Exception as e:
            logger.warning(f"Gemini fallback failed: {e}")
    return None

# ----------------------------------------------------------------
# Conversation thread management
# ----------------------------------------------------------------
async def get_or_create_conversation(user: Optional[str], conversation_id: Optional[str]) -> Optional[str]:
    if conversation_id:
        return conversation_id
    if user:
        conv_id = f"thread-{user}"
        return conv_id
    return None

# ----------------------------------------------------------------
# Models list
# ----------------------------------------------------------------
AVAILABLE_MODELS = [
    {"id": "gpt-4o-mini", "owned_by": "openai"},
    {"id": "gpt-4o", "owned_by": "openai"},
    {"id": "gpt-4", "owned_by": "openai"},
    {"id": "gpt-4-turbo", "owned_by": "openai"},
    {"id": "gpt-3.5-turbo", "owned_by": "openai"},
    {"id": "gpt-5", "owned_by": "openai"},
    {"id": "gpt-5-mini", "owned_by": "openai"},
    {"id": "gpt-5-nano", "owned_by": "openai"},
    {"id": "gpt-5.1", "owned_by": "openai"},
    {"id": "gpt-5.1-codex", "owned_by": "openai"},
    {"id": "gpt-5.1-codex-mini", "owned_by": "openai"},
    {"id": "gpt-5.2", "owned_by": "openai"},
    {"id": "gpt-5.2-pro", "owned_by": "openai"},
    {"id": "gpt-5.4", "owned_by": "openai"},
    {"id": "gpt-5.4-mini", "owned_by": "openai"},
    {"id": "gpt-5.4-nano", "owned_by": "openai"},
    {"id": "gpt-5.4-pro", "owned_by": "openai"},
    {"id": "o3", "owned_by": "openai"},
    {"id": "o3-mini", "owned_by": "openai"},
    {"id": "o4-mini", "owned_by": "openai"},
    {"id": "claude-3-5-sonnet", "owned_by": "anthropic"},
    {"id": "claude-3-haiku", "owned_by": "anthropic"},
    {"id": "claude-sonnet-4-6", "owned_by": "anthropic"},
    {"id": "claude-opus-4-6", "owned_by": "anthropic"},
    {"id": "claude-haiku-4-5", "owned_by": "anthropic"},
    {"id": "gemini-2.0-flash", "owned_by": "google"},
    {"id": "gemini-2.0-flash-lite", "owned_by": "google"},
    {"id": "gemini-1.5-flash", "owned_by": "google"},
    {"id": "gemini-1.5-pro", "owned_by": "google"},
    {"id": "gemini-2.5-flash", "owned_by": "google"},
    {"id": "gemini-2.5-pro", "owned_by": "google"},
    {"id": "mistral-small-latest", "owned_by": "mistral"},
    {"id": "mistral-medium-latest", "owned_by": "mistral"},
    {"id": "mistral-large-latest", "owned_by": "mistral"},
    {"id": "deepseek-chat", "owned_by": "deepseek"},
    {"id": "deepseek-reasoner", "owned_by": "deepseek"},
    {"id": "llama-3-70b", "owned_by": "meta"},
    {"id": "llama-4-scout", "owned_by": "meta"},
    {"id": "llama-4-maverick", "owned_by": "meta"},
    {"id": "command-r", "owned_by": "cohere"},
    {"id": "sonar", "owned_by": "perplexity"},
    {"id": "sonar-pro", "owned_by": "perplexity"},
    {"id": "sonar-reasoning-pro", "owned_by": "perplexity"},
]

# ----------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------
@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        service="litellm-1minai-proxy-rag-superbot",
        version="1.1.0",
    )

@app.get("/v1/models")
async def list_models(request: Request):
    verify_auth(request)
    now = int(time.time())
    return {
        "object": "list",
        "data": [{**m, "object": "model", "created": now} for m in AVAILABLE_MODELS],
    }

@app.post("/v1/chat/completions")
@app.post("/chat/completions")
async def chat_completions(request: Request, body: ChatCompletionRequest):
    # Auth is optional for chat - proxy authenticates to 1minAI server-side.
    # If a bearer token is provided, validate it; if not, proceed with server-side key.
    token = get_bearer_token(request)
    if token and token != ONEMINAI_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    try:
        conversation_id = await get_or_create_conversation(body.user, body.conversation_id)
        prompt_text = messages_to_prompt(body.messages)

        logger.info(f"Chat request: model={body.model}, messages={len(body.messages)}, stream={body.stream}")

        if body.stream:
            gen = await call_1minai_chat(
                prompt_text=prompt_text,
                model=body.model,
                temperature=body.temperature or 0.7,
                max_tokens=body.max_tokens,
                stream=True,
                conversation_id=conversation_id,
            )
            return StreamingResponse(gen, media_type="text/event-stream")

        result = await call_1minai_chat(
            prompt_text=prompt_text,
            model=body.model,
            temperature=body.temperature or 0.7,
            max_tokens=body.max_tokens,
            stream=False,
            conversation_id=conversation_id,
        )
        return result

    except HTTPException as e:
        if e.status_code == 401:
            raise
        logger.error(f"1minAI primary failed (HTTP {e.status_code}), trying fallbacks")
        result = await _try_fallbacks(body)
        if result:
            return result
        raise
    except Exception as e:
        logger.error(f"1minAI primary failed: {e}, trying fallbacks")
        result = await _try_fallbacks(body)
        if result:
            return result
        raise HTTPException(status_code=503, detail=f"All providers failed: {str(e)}")

async def _try_fallbacks(body: ChatCompletionRequest) -> Optional[Dict[str, Any]]:
    result = await call_openrouter(body.messages, body.model, body.temperature or 0.7, body.max_tokens)
    if result:
        logger.info("Fallback: OpenRouter succeeded")
        return result
    result = await call_mistral(body.messages, body.temperature or 0.7, body.max_tokens)
    if result:
        logger.info("Fallback: Mistral succeeded")
        return result
    result = await call_gemini(body.messages, body.temperature or 0.7, body.max_tokens)
    if result:
        logger.info("Fallback: Gemini succeeded")
        return result
    return None

@app.get("/")
async def root():
    return {
        "service": "LiteLLM 1minAI Proxy for RAG Superbot",
        "version": "1.1.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "chat_completions": "/v1/chat/completions",
            "models": "/v1/models",
        },
        "features": {
            "primary_provider": "1minAI",
            "fallbacks_enabled": True,
            "fallback_providers": ["OpenRouter", "Mistral", "Gemini"],
        },
    }

# ----------------------------------------------------------------
# Main
# ----------------------------------------------------------------
if __name__ == "__main__":
    host = os.getenv("FASTAPI_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("FASTAPI_PORT", "8000")))
    reload = os.getenv("FASTAPI_RELOAD", "false").lower() == "true"

    environment = "local"
    if os.getenv("RENDER_SERVICE_NAME"):
        environment = "render"
    elif os.getenv("RAILWAY_ENVIRONMENT"):
        environment = "railway"

    logger.info(f"Starting LiteLLM 1minAI Proxy v1.1.0 on {host}:{port}")
    logger.info(f"1minAI API Key configured: {bool(ONEMINAI_API_KEY)}")
    logger.info(f"Environment: {environment}")

    uvicorn.run(
        "fastapi_server:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
    )
