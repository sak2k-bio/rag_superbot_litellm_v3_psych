/**
 * Cloudflare Worker for Psychiatry Therapy SuperBot LiteLLM Proxy
 * Provides OpenAI-compatible endpoints for 1minAI integration
 */

// CORS headers configuration
function getCorsHeaders(env) {
    return {
        'Access-Control-Allow-Origin': env.CORS_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': env.CORS_ALLOW_CREDENTIALS || 'true',
    };
}

// Handle CORS preflight requests
function handleCORS(request, env) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: getCorsHeaders(env),
        });
    }
    return null;
}

// Add CORS headers to response
function addCORSHeaders(response, env) {
    const corsHeaders = getCorsHeaders(env);
    const newResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
    });
    return newResponse;
}

// Make request to 1minAI API
async function make1minAIRequest(messages, model, temperature = 0.7, maxTokens = null, env) {
    const ONEMINAI_API_KEY = env.ONEMINAI_API_KEY;

    if (!ONEMINAI_API_KEY) {
        throw new Error('ONEMINAI_API_KEY not configured');
    }

    // Transform messages to prompt format
    const promptParts = [];
    for (const msg of messages) {
        const { role, content } = msg;
        if (role === 'system') {
            promptParts.push(`System: ${content}`);
        } else if (role === 'assistant') {
            promptParts.push(`Assistant: ${content}`);
        } else {
            promptParts.push(`User: ${content}`);
        }
    }

    const prompt = promptParts.join('\n\n');

    // Map model names to 1minAI supported format
    const modelMapping = {
        '1minai-gpt-4o-mini': 'gpt-4o-mini',
        '1minai-gpt-4o': 'gpt-4o',
        '1minai-claude-3-5-sonnet': 'claude-3-5-sonnet',
        '1minai-claude-3-haiku': 'claude-3-haiku',
        'gpt-4o-mini': 'gpt-4o-mini',
        'gpt-4o': 'gpt-4o',
        'claude-3-5-sonnet': 'claude-3-5-sonnet',
        'claude-3-haiku': 'claude-3-haiku',
        'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
        'gemini-2.0-flash': 'gemini-2.0-flash',
        'gemini-1.5-flash': 'gemini-1.5-flash',
        'gemini-1.5-pro': 'gemini-1.5-pro',
    };

    const mappedModel = modelMapping[model] || 'gemini-2.0-flash-lite';

    // Create 1minAI payload
    const payload = {
        type: 'CHAT_WITH_AI',
        model: mappedModel,
        promptObject: {
            prompt: prompt,
            isMixed: false,
            webSearch: false,
        },
    };

    const headers = {
        'API-KEY': ONEMINAI_API_KEY,
        'Content-Type': 'application/json',
    };

    try {
        console.log(`Making request to 1minAI API for model: ${mappedModel}`);

        const response = await fetch('https://api.1min.ai/api/features', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('1minAI API request successful');

            // Parse 1minAI response format
            const aiRecord = result.aiRecord || {};
            const aiRecordDetail = aiRecord.aiRecordDetail || {};
            const resultObject = aiRecordDetail.resultObject || [];

            // Extract response text
            let responseText = '';
            if (Array.isArray(resultObject) && resultObject.length > 0) {
                responseText = String(resultObject[0]);
            } else {
                responseText = 'No response generated';
            }

            // Convert to OpenAI format
            const openaiResponse = {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: model,
                choices: [
                    {
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: responseText,
                        },
                        finish_reason: 'stop',
                    },
                ],
                usage: {
                    prompt_tokens: prompt.split(' ').length,
                    completion_tokens: responseText.split(' ').length,
                    total_tokens: prompt.split(' ').length + responseText.split(' ').length,
                },
            };

            return openaiResponse;
        } else {
            const errorText = await response.text();
            console.error(`1minAI API error: ${response.status} - ${errorText}`);
            throw new Error(`1minAI API error: ${errorText}`);
        }
    } catch (error) {
        console.error(`1minAI API connection error: ${error.message}`);
        throw new Error(`1minAI API connection failed: ${error.message}`);
    }
}

// Get available models
function getAvailableModels() {
    const models = [
        {
            id: 'gemini-2.0-flash-lite',
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: '1minai',
        },
        {
            id: 'gemini-2.0-flash',
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: '1minai',
        },
        {
            id: 'gemini-1.5-flash',
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: '1minai',
        },
        {
            id: 'gemini-1.5-pro',
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: '1minai',
        },
        {
            id: 'gpt-4o-mini',
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: '1minai',
        },
        {
            id: 'gpt-4o',
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: '1minai',
        },
        {
            id: 'claude-3-5-sonnet',
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: '1minai',
        },
        {
            id: 'claude-3-haiku',
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: '1minai',
        },
    ];

    return {
        object: 'list',
        data: models,
    };
}

// Main request handler
export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        const corsResponse = handleCORS(request, env);
        if (corsResponse) return corsResponse;

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Health check endpoint
            if (path === '/health') {
                const response = new Response(
                    JSON.stringify({
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        service: 'psychiatry-therapy-superbot-api',
                        version: '1.0.0',
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
                return addCORSHeaders(response, env);
            }

            // Root endpoint
            if (path === '/') {
                const response = new Response(
                    JSON.stringify({
                        service: 'Psychiatry Therapy SuperBot LiteLLM Proxy',
                        version: '1.0.0',
                        status: 'running',
                        endpoints: {
                            health: '/health',
                            chat_completions: '/v1/chat/completions',
                            models: '/v1/models',
                        },
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
                return addCORSHeaders(response, env);
            }

            // Models endpoint
            if (path === '/v1/models' && request.method === 'GET') {
                const models = getAvailableModels();
                const response = new Response(JSON.stringify(models), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
                return addCORSHeaders(response, env);
            }

            // Chat completions endpoint
            if ((path === '/v1/chat/completions' || path === '/chat/completions') && request.method === 'POST') {
                try {
                    const requestData = await request.json();
                    const { model = 'gemini-2.0-flash-lite', messages, temperature = 0.7, max_tokens } = requestData;

                    if (!messages || !Array.isArray(messages)) {
                        throw new Error('Messages array is required');
                    }

                    console.log(`Chat completion request for model: ${model}`);
                    console.log(`Request messages: ${messages.length} messages`);

                    // Make request to 1minAI API
                    const result = await make1minAIRequest(messages, model, temperature, max_tokens, env);

                    const response = new Response(JSON.stringify(result), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                    return addCORSHeaders(response, env);
                } catch (error) {
                    console.error(`Error in chat completions: ${error.message}`);

                    // Return fallback response
                    const fallbackResponse = {
                        id: `chatcmpl-${Date.now()}`,
                        object: 'chat.completion',
                        created: Math.floor(Date.now() / 1000),
                        model: requestData?.model || 'gemini-2.0-flash-lite',
                        choices: [
                            {
                                index: 0,
                                message: {
                                    role: 'assistant',
                                    content: `I apologize, but I'm currently experiencing technical difficulties. Error: ${error.message}. Please try again later.`,
                                },
                                finish_reason: 'stop',
                            },
                        ],
                        usage: {
                            prompt_tokens: 10,
                            completion_tokens: 20,
                            total_tokens: 30,
                        },
                    };

                    const response = new Response(JSON.stringify(fallbackResponse), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                    return addCORSHeaders(response, env);
                }
            }

            // 404 for unknown endpoints
            const response = new Response(
                JSON.stringify({ error: 'Not Found', message: `Endpoint ${path} not found` }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
            return addCORSHeaders(response, env);
        } catch (error) {
            console.error(`Worker error: ${error.message}`);
            const response = new Response(
                JSON.stringify({ error: 'Internal Server Error', message: error.message }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
            return addCORSHeaders(response, env);
        }
    },
};