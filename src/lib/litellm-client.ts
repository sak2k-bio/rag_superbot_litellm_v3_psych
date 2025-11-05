import axios, { AxiosError } from 'axios';

// Configuration - Using Next.js public environment variables
const LITELLM_API_URL = process.env.NEXT_PUBLIC_LITELLM_API_URL || 'http://localhost:8000';
const LITELLM_MODEL = process.env.NEXT_PUBLIC_LITELLM_MODEL || 'gemini-2.0-flash-lite';
const LITELLM_TEMPERATURE = parseFloat(process.env.NEXT_PUBLIC_LITELLM_TEMPERATURE || '0.7');
const LITELLM_MAX_TOKENS = parseInt(process.env.NEXT_PUBLIC_LITELLM_MAX_TOKENS || '2048');

// Message interface
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Response interface
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Models list response interface
export interface ModelsListResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

/**
 * Generate a chat completion using the LiteLLM proxy
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  try {
    const model = options?.model || LITELLM_MODEL;
    const temperature = options?.temperature ?? LITELLM_TEMPERATURE;
    const maxTokens = options?.maxTokens || LITELLM_MAX_TOKENS;

    console.log(`🚀 LiteLLM: Generating completion with model: ${model}`);
    console.log(`📊 LiteLLM: Temperature: ${temperature}, Max tokens: ${maxTokens}`);
    console.log(`📝 LiteLLM: Messages count: ${messages.length}`);

    const response = await axios.post<ChatCompletionResponse>(
      `${LITELLM_API_URL}/v1/chat/completions`,
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    
    console.log(`✅ LiteLLM: Successfully generated response (${content.length} chars)`);
    console.log(`📊 LiteLLM: Token usage - Prompt: ${response.data.usage.prompt_tokens}, Completion: ${response.data.usage.completion_tokens}`);

    return content;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('❌ LiteLLM API Error:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      
      // Provide more helpful error messages
      if (axiosError.code === 'ECONNREFUSED') {
        throw new Error(
          `LiteLLM proxy server is not running. Please start it with: docker-compose up -d fastapi-litellm`
        );
      }
      
      if (axiosError.response?.status === 500) {
        const errorData = axiosError.response.data as any;
        throw new Error(
          `LiteLLM proxy error: ${errorData?.detail || 'Internal server error'}. Check if ONEMINAI_API_KEY is configured.`
        );
      }
      
      throw new Error(
        `LiteLLM request failed: ${axiosError.message}. Status: ${axiosError.response?.status || 'N/A'}`
      );
    }
    
    console.error('❌ Unexpected error in LiteLLM client:', error);
    throw error;
  }
}

/**
 * Generate a simple text completion from a prompt
 */
export async function generateTextCompletion(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const messages: ChatMessage[] = [];
  
  // Add system prompt if provided
  if (options?.systemPrompt) {
    messages.push({
      role: 'system',
      content: options.systemPrompt,
    });
  }
  
  // Add user prompt
  messages.push({
    role: 'user',
    content: prompt,
  });
  
  return generateChatCompletion(messages, options);
}

/**
 * Check if the LiteLLM proxy is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    console.log('🏥 LiteLLM: Checking health...');
    const response = await axios.get(`${LITELLM_API_URL}/health`, {
      timeout: 5000,
    });
    
    const isHealthy = response.status === 200 && response.data.status === 'healthy';
    console.log(`${isHealthy ? '✅' : '❌'} LiteLLM: Health check ${isHealthy ? 'passed' : 'failed'}`);
    
    return isHealthy;
  } catch (error) {
    console.error('❌ LiteLLM: Health check failed:', error);
    return false;
  }
}

/**
 * Get list of available models from the LiteLLM proxy
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    console.log('📋 LiteLLM: Fetching available models...');
    const response = await axios.get<ModelsListResponse>(`${LITELLM_API_URL}/v1/models`, {
      timeout: 5000,
    });
    
    const models = response.data.data.map((model) => model.id);
    console.log(`✅ LiteLLM: Found ${models.length} models:`, models);
    
    return models;
  } catch (error) {
    console.error('❌ LiteLLM: Failed to fetch models:', error);
    return [LITELLM_MODEL]; // Return default model as fallback
  }
}

/**
 * Generate embeddings using the proxy (if supported in future)
 * Currently returns placeholder - implement when 1minAI adds embedding support
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // For now, this is a placeholder since 1minAI may not support embeddings directly
  // You would still use Google Gemini embeddings for this
  throw new Error('Embeddings are not supported through LiteLLM proxy. Use Google Gemini embeddings instead.');
}

/**
 * Get the current configuration
 */
export function getLiteLLMConfig() {
  return {
    apiUrl: LITELLM_API_URL,
    model: LITELLM_MODEL,
    temperature: LITELLM_TEMPERATURE,
    maxTokens: LITELLM_MAX_TOKENS,
  };
}

/**
 * Test the LiteLLM connection with a simple query
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  models?: string[];
}> {
  try {
    // Check health
    const isHealthy = await checkHealth();
    if (!isHealthy) {
      return {
        success: false,
        message: 'LiteLLM proxy is not healthy or not reachable',
      };
    }

    // Get models
    const models = await getAvailableModels();

    // Test a simple completion
    const testResponse = await generateTextCompletion('Say "Hello from LiteLLM!"', {
      maxTokens: 50,
    });

    return {
      success: true,
      message: `LiteLLM connection successful! Response: ${testResponse}`,
      models,
    };
  } catch (error) {
    return {
      success: false,
      message: `LiteLLM connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
