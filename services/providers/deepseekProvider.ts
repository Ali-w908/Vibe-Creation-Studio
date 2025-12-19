import { ModelProvider } from '../../types';
import { AIProvider, GenerateOptions, registerProvider, updateModelAvailability, ContentPart } from '../modelRegistry';

// ============================================
// DEEPSEEK PROVIDER (Best reasoning)
// ============================================

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

class DeepSeekProvider implements AIProvider {
    name = ModelProvider.DEEPSEEK;
    displayName = 'DeepSeek V3';

    private apiKey: string | null = null;
    private defaultModel = 'deepseek-chat';

    constructor() {
        // Vite exposes env vars with VITE_ prefix via import.meta.env
        this.apiKey = (import.meta as any).env?.VITE_DEEPSEEK_API_KEY || null;
        if (this.apiKey && this.apiKey !== '') {
            updateModelAvailability(ModelProvider.DEEPSEEK, true);
        }
    }

    isConfigured(): boolean {
        return this.apiKey !== null && this.apiKey !== '';
    }

    async checkAvailability(): Promise<boolean> {
        if (!this.apiKey) return false;

        try {
            const response = await fetch(DEEPSEEK_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
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
        if (!this.apiKey) {
            throw new Error('DeepSeek API key not configured. Add VITE_DEEPSEEK_API_KEY to .env.local');
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
            const response = await fetch(DEEPSEEK_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.defaultModel,
                    messages,
                    temperature: options?.temperature ?? 0.7,
                    max_tokens: options?.maxTokens ?? 4096,
                    response_format: options?.responseFormat === 'json'
                        ? { type: 'json_object' }
                        : undefined
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`DeepSeek API error: ${error}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('DeepSeek generation error:', error);
            throw error;
        }
    }
}

// Create and register the provider
const deepseekProvider = new DeepSeekProvider();
registerProvider(deepseekProvider);

export { deepseekProvider };
export default DeepSeekProvider;
