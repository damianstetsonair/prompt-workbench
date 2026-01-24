import { API_CONFIG, getModelsForProvider } from '../constants';
import type { Settings, ModelInfo, Provider } from '../types';

export interface ApiResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  responseTime: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Unified AI API service supporting multiple providers
 */
export const aiApi = {
  /**
   * Send a message to the selected AI provider
   */
  async sendMessage(
    messages: Message[],
    settings: Settings,
    systemPrompt?: string,
    trackMetrics = false
  ): Promise<ApiResult | string> {
    const providerSettings = settings.providers[settings.provider];
    
    if (!providerSettings.apiKey) {
      throw new Error('API key no configurada');
    }

    const startTime = Date.now();
    let result: ApiResult;

    switch (settings.provider) {
      case 'anthropic':
        result = await this.callAnthropic(messages, settings, systemPrompt);
        break;
      case 'openai':
        result = await this.callOpenAI(messages, settings, systemPrompt);
        break;
      case 'gemini':
        result = await this.callGemini(messages, settings, systemPrompt);
        break;
      default:
        throw new Error(`Proveedor no soportado: ${settings.provider}`);
    }

    result.responseTime = Date.now() - startTime;

    if (trackMetrics) {
      return result;
    }

    return result.text;
  },

  /**
   * Call Anthropic Claude API
   */
  async callAnthropic(
    messages: Message[],
    settings: Settings,
    systemPrompt?: string
  ): Promise<ApiResult> {
    const providerSettings = settings.providers.anthropic;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': providerSettings.apiKey,
      'anthropic-version': API_CONFIG.anthropic.version,
      'anthropic-dangerous-direct-browser-access': 'true',
    };

    const body: Record<string, unknown> = {
      model: providerSettings.model,
      max_tokens: API_CONFIG.maxTokens,
      temperature: settings.temperature,
      messages,
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const response = await fetch(`${API_CONFIG.anthropic.baseUrl}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Error de API de Anthropic');
    }

    return {
      text: data.content?.[0]?.text || '',
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      responseTime: 0,
    };
  },

  /**
   * Call OpenAI API
   */
  async callOpenAI(
    messages: Message[],
    settings: Settings,
    systemPrompt?: string
  ): Promise<ApiResult> {
    const providerSettings = settings.providers.openai;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${providerSettings.apiKey}`,
    };

    // Build messages array with system prompt if provided
    const apiMessages: Array<{ role: string; content: string }> = [];
    
    if (systemPrompt) {
      apiMessages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.forEach((m) => {
      apiMessages.push({ role: m.role, content: m.content });
    });

    const body = {
      model: providerSettings.model,
      max_tokens: API_CONFIG.maxTokens,
      temperature: settings.temperature,
      messages: apiMessages,
    };

    const response = await fetch(`${API_CONFIG.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Error de API de OpenAI');
    }

    return {
      text: data.choices?.[0]?.message?.content || '',
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      responseTime: 0,
    };
  },

  /**
   * Call Google Gemini API
   */
  async callGemini(
    messages: Message[],
    settings: Settings,
    systemPrompt?: string
  ): Promise<ApiResult> {
    const providerSettings = settings.providers.gemini;

    // Build contents array for Gemini
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    messages.forEach((m) => {
      contents.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      });
    });

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: API_CONFIG.maxTokens,
        temperature: settings.temperature,
      },
    };

    // Add system instruction if provided
    if (systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const url = `${API_CONFIG.gemini.baseUrl}/models/${providerSettings.model}:generateContent?key=${providerSettings.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Error de API de Gemini');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usageMetadata = data.usageMetadata || {};

    return {
      text,
      inputTokens: usageMetadata.promptTokenCount || 0,
      outputTokens: usageMetadata.candidatesTokenCount || 0,
      responseTime: 0,
    };
  },

  /**
   * Get available models for the current provider
   */
  getModels(provider: Provider): ModelInfo[] {
    return getModelsForProvider(provider);
  },

  /**
   * Generate a prompt from description
   */
  async generatePrompt(description: string, settings: Settings): Promise<string> {
    const result = await this.sendMessage(
      [
        {
          role: 'user',
          content: `Genera un prompt de sistema profesional y efectivo para el siguiente caso de uso. 
              
Caso de uso: ${description}

Devuelve SOLO el prompt, sin explicaciones ni markdown. El prompt debe ser claro, específico y seguir mejores prácticas de prompt engineering.`,
        },
      ],
      settings
    );

    return typeof result === 'string' ? result : result.text;
  },

  /**
   * Improve a prompt based on feedback
   */
  async improvePrompt(
    currentContent: string,
    feedback: string,
    lastOutput: string | null,
    settings: Settings
  ): Promise<string> {
    const result = await this.sendMessage(
      [
        {
          role: 'user',
          content: `Tengo este prompt de sistema:

\`\`\`
${currentContent}
\`\`\`

${lastOutput ? `Último output generado:\n\`\`\`\n${lastOutput}\n\`\`\`\n` : ''}

Feedback del usuario: ${feedback}

Genera una versión mejorada del prompt incorporando el feedback. Devuelve SOLO el prompt mejorado, sin explicaciones.`,
        },
      ],
      settings
    );

    return typeof result === 'string' ? result : result.text;
  },
};
