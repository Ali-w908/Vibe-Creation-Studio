import { ModelProvider } from '../../types';
import { AIProvider, GenerateOptions, registerProvider, updateModelAvailability, ContentPart } from '../modelRegistry';

// ============================================
// OPENROUTER PROVIDER
// Access to 100+ models through one API
// ============================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free/cheap models available on OpenRouter
const OPENROUTER_MODELS = {
    // Free models (community donated)
    free: {
        mistral7b: 'mistralai/mistral-7b-instruct:free',
        llama3: 'meta-llama/llama-3-8b-instruct:free',
        gemma: 'google/gemma-7b-it:free',
        phi3: 'microsoft/phi-3-mini-128k-instruct:free'
    },
    // Low-cost models (excellent value)
    cheap: {
        claude3haiku: 'anthropic/claude-3-haiku',
        gpt35turbo: 'openai/gpt-3.5-turbo',
        mistralSmall: 'mistralai/mistral-small',
        geminiFlash: 'google/gemini-flash-1.5'
    },
    // Premium models (best quality)
    premium: {
        claude3opus: 'anthropic/claude-3-opus',
        gpt4: 'openai/gpt-4-turbo',
        deepseek: 'deepseek/deepseek-chat'
    }
};

class OpenRouterProvider implements AIProvider {
    name = ModelProvider.OPENROUTER;
    displayName = 'OpenRouter (Multi-Model)';

    private apiKey: string | null = null;
    private defaultModel = OPENROUTER_MODELS.free.mistral7b;
    private siteUrl = 'https://vibe-creation-studio.app';
    private siteName = 'Vibe Creation Studio';

    constructor() {
        // Vite exposes env vars with VITE_ prefix
        this.apiKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || null;
        if (this.apiKey && this.apiKey !== '') {
            updateModelAvailability(ModelProvider.OPENROUTER, true);
        }
    }

    isConfigured(): boolean {
        return this.apiKey !== null && this.apiKey !== '' && !this.apiKey.includes('your_');
    }

    async checkAvailability(): Promise<boolean> {
        if (!this.isConfigured()) return false;

        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': this.siteUrl,
                    'X-Title': this.siteName
                },
                body: JSON.stringify({
                    model: this.defaultModel,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 5
                })
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async generateText(prompt: string | ContentPart[], options?: GenerateOptions): Promise<string> {
        if (!this.isConfigured()) {
            throw new Error('OpenRouter API key not configured. Add VITE_OPENROUTER_API_KEY to .env.local');
        }

        let textPrompt = '';
        if (typeof prompt === 'string') {
            textPrompt = prompt;
        } else {
            textPrompt = prompt
                .filter(p => 'text' in p)
                .map(p => (p as any).text)
                .join('\n\n');
        }

        const messages: Array<{ role: string; content: string }> = [];

        if (options?.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }

        messages.push({ role: 'user', content: textPrompt });

        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': this.siteUrl,
                    'X-Title': this.siteName
                },
                body: JSON.stringify({
                    model: this.defaultModel,
                    messages,
                    max_tokens: options?.maxTokens ?? 2048,
                    temperature: options?.temperature ?? 0.7,
                    ...(options?.responseFormat === 'json' && {
                        response_format: { type: 'json_object' }
                    })
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`OpenRouter API error: ${error.error?.message || JSON.stringify(error)}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('OpenRouter generation error:', error);
            throw error;
        }
    }

    // Switch to a different model
    setModel(modelId: string) {
        this.defaultModel = modelId;
    }

    // Get list of available models
    getAvailableModels() {
        return OPENROUTER_MODELS;
    }

    // Get current model
    getCurrentModel() {
        return this.defaultModel;
    }
}

// Create and register the provider
const openRouterProvider = new OpenRouterProvider();
registerProvider(openRouterProvider);

export { openRouterProvider, OPENROUTER_MODELS };
export default OpenRouterProvider;
