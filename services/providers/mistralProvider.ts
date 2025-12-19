import { ModelProvider } from '../../types';
import { AIProvider, GenerateOptions, registerProvider, updateModelAvailability, ContentPart } from '../modelRegistry';

// ============================================
// MISTRAL PROVIDER (Quality prose)
// ============================================

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

class MistralProvider implements AIProvider {
    name = ModelProvider.MISTRAL;
    displayName = 'Mistral Large';

    private apiKey: string | null = null;
    private defaultModel = 'mistral-large-latest';

    constructor() {
        // Vite exposes env vars with VITE_ prefix via import.meta.env
        this.apiKey = (import.meta as any).env?.VITE_MISTRAL_API_KEY || null;
        if (this.apiKey && this.apiKey !== '') {
            updateModelAvailability(ModelProvider.MISTRAL, true);
        }
    }

    isConfigured(): boolean {
        return this.apiKey !== null && this.apiKey !== '';
    }

    async checkAvailability(): Promise<boolean> {
        if (!this.apiKey) return false;

        try {
            const response = await fetch(MISTRAL_API_URL, {
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
            throw new Error('Mistral API key not configured. Add VITE_MISTRAL_API_KEY to .env.local');
        }

        let textPrompt = '';
        if (typeof prompt === 'string') {
            textPrompt = prompt;
        } else {
            // Mistral is text-only (mostly), so we extract text parts
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
            const response = await fetch(MISTRAL_API_URL, {
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
                throw new Error(`Mistral API error: ${error}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('Mistral generation error:', error);
            throw error;
        }
    }
}

// Create and register the provider
const mistralProvider = new MistralProvider();
registerProvider(mistralProvider);

export { mistralProvider };
export default MistralProvider;
