import { ModelProvider } from '../../types';
import { AIProvider, GenerateOptions, registerProvider, updateModelAvailability, ContentPart } from '../modelRegistry';

// ============================================
// GROQ PROVIDER (Ultra-fast inference)
// ============================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

class GroqProvider implements AIProvider {
    name = ModelProvider.GROQ;
    displayName = 'Groq (Llama 3.3)';

    private apiKey: string | null = null;
    private defaultModel = 'llama-3.3-70b-versatile';

    constructor() {
        // Vite exposes env vars with VITE_ prefix via import.meta.env
        this.apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY || null;
        if (this.apiKey && this.apiKey !== '') {
            updateModelAvailability(ModelProvider.GROQ, true);
        }
    }

    isConfigured(): boolean {
        return this.apiKey !== null && this.apiKey !== '';
    }

    async checkAvailability(): Promise<boolean> {
        if (!this.apiKey) return false;

        try {
            const response = await fetch(GROQ_API_URL, {
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
            throw new Error('Groq API key not configured. Add GROQ_API_KEY to .env.local');
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
            const response = await fetch(GROQ_API_URL, {
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
                    ...(options?.responseFormat === 'json' && { response_format: { type: 'json_object' } })
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Groq API error: ${error}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('Groq generation error:', error);
            throw error;
        }
    }
}

// Create and register the provider
const groqProvider = new GroqProvider();
registerProvider(groqProvider);

export { groqProvider };
export default GroqProvider;
