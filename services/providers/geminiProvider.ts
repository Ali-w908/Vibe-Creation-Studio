import { GoogleGenAI } from "@google/genai";
import { ModelProvider } from '../../types';
import { AIProvider, GenerateOptions, registerProvider, updateModelAvailability, ContentPart } from '../modelRegistry';

// ============================================
// GEMINI PROVIDER
// ============================================

class GeminiProvider implements AIProvider {
    name = ModelProvider.GEMINI;
    displayName = 'Google Gemini';

    private client: GoogleGenAI | null = null;
    private defaultModel = 'gemini-2.5-flash';

    constructor() {
        this.initClient();
    }

    private initClient(): void {
        try {
            // Vite exposes env vars with VITE_ prefix via import.meta.env
            const apiKey = (import.meta as any).env?.VITE_API_KEY || '';
            if (apiKey && apiKey !== '' && !apiKey.includes('your_')) {
                this.client = new GoogleGenAI({ apiKey });
                updateModelAvailability(ModelProvider.GEMINI, true);
                console.log('[Gemini] Provider initialized');
            } else {
                console.log('[Gemini] No API key configured');
            }
        } catch (error) {
            console.error('[Gemini] Failed to initialize:', error);
            this.client = null;
        }
    }

    isConfigured(): boolean {
        return this.client !== null;
    }

    async checkAvailability(): Promise<boolean> {
        if (!this.client) return false;

        try {
            // Simple ping test
            await this.client.models.generateContent({
                model: this.defaultModel,
                contents: 'Hi',
                config: { maxOutputTokens: 5 }
            });
            return true;
        } catch {
            return false;
        }
    }

    async generateText(prompt: string | ContentPart[], options?: GenerateOptions): Promise<string> {
        if (!this.client) {
            throw new Error('Gemini client not initialized. Check VITE_API_KEY in .env.local');
        }

        try {
            let contents: any;

            if (typeof prompt === 'string') {
                contents = prompt;
            } else {
                // Map ContentPart[] to Gemini Part[]
                contents = [{
                    role: 'user',
                    parts: prompt.map(p => {
                        if ('text' in p) return { text: p.text };
                        if ('inlineData' in p) return { inlineData: p.inlineData };
                        // fileData not supported directly in this simplified flow yet, 
                        // but logic would go here if using File API
                        return { text: '' };
                    })
                }];
            }

            const response = await this.client.models.generateContent({
                model: this.defaultModel,
                contents: contents,
                config: {
                    systemInstruction: options?.systemPrompt,
                    temperature: options?.temperature,
                    maxOutputTokens: options?.maxTokens,
                    responseMimeType: options?.responseFormat === 'json' ? 'application/json' : undefined
                }
            });

            return response.text || '';
        } catch (error) {
            console.error('Gemini generation error:', error);
            throw error;
        }
    }

    // Special method for image generation (Gemini-specific)
    async generateImage(prompt: string): Promise<string | null> {
        if (!this.client) {
            throw new Error('Gemini client not initialized');
        }

        try {
            const response = await this.client.models.generateContent({
                model: 'gemini-2.5-flash-preview-image-generation',
                contents: prompt,
                config: { responseMimeType: 'image/jpeg' }
            });

            const candidates = response.candidates;
            if (candidates && candidates.length > 0) {
                for (const part of candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('Gemini image generation error:', error);
            throw error;
        }
    }
}

// Create and register the provider
const geminiProvider = new GeminiProvider();
registerProvider(geminiProvider);

export { geminiProvider };
export default GeminiProvider;
