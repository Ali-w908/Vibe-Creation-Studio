import { ModelProvider } from '../../types';
import { AIProvider, GenerateOptions, registerProvider, updateModelAvailability, ContentPart } from '../modelRegistry';

// ============================================
// HUGGINGFACE PROVIDER (Free Inference API)
// ============================================

const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Free models available on HuggingFace
const HF_MODELS = {
    text: 'mistralai/Mistral-7B-Instruct-v0.3',
    textAlt: 'meta-llama/Llama-3.2-3B-Instruct',
    image: 'stabilityai/stable-diffusion-xl-base-1.0',
    embedding: 'sentence-transformers/all-MiniLM-L6-v2'
};

class HuggingFaceProvider implements AIProvider {
    name = ModelProvider.HUGGINGFACE;
    displayName = 'HuggingFace (Free)';

    private apiKey: string | null = null;
    private defaultModel = HF_MODELS.text;

    constructor() {
        // Vite exposes env vars with VITE_ prefix via import.meta.env
        this.apiKey = (import.meta as any).env?.VITE_HUGGINGFACE_API_KEY || null;
        if (this.apiKey) {
            updateModelAvailability(ModelProvider.HUGGINGFACE, true);
        }
    }

    isConfigured(): boolean {
        return this.apiKey !== null && this.apiKey !== '' && this.apiKey !== 'your_huggingface_api_key_here';
    }

    async checkAvailability(): Promise<boolean> {
        if (!this.isConfigured()) return false;

        try {
            const response = await fetch(`${HF_API_URL}/${this.defaultModel}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: 'Hello',
                    parameters: { max_new_tokens: 5 }
                })
            });
            return response.ok || response.status === 503; // 503 means model is loading
        } catch {
            return false;
        }
    }

    async generateText(prompt: string | ContentPart[], options?: GenerateOptions): Promise<string> {
        if (!this.isConfigured()) {
            throw new Error('HuggingFace API key not configured. Add VITE_HUGGINGFACE_API_KEY to .env.local');
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

        // Format for instruction models
        const formattedPrompt = options?.systemPrompt
            ? `<s>[INST] ${options.systemPrompt}\n\n${textPrompt} [/INST]`
            : `<s>[INST] ${textPrompt} [/INST]`;

        try {
            const response = await fetch(`${HF_API_URL}/${this.defaultModel}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: formattedPrompt,
                    parameters: {
                        max_new_tokens: options?.maxTokens ?? 1024,
                        temperature: options?.temperature ?? 0.7,
                        return_full_text: false,
                        do_sample: true
                    }
                })
            });

            if (!response.ok) {
                const error = await response.text();

                // Handle model loading state
                if (response.status === 503) {
                    console.log('HuggingFace model is loading, retrying...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    return this.generateText(prompt, options);
                }

                throw new Error(`HuggingFace API error: ${error}`);
            }

            const data = await response.json();

            // Handle different response formats
            if (Array.isArray(data)) {
                return data[0]?.generated_text || '';
            }
            return data.generated_text || JSON.stringify(data);
        } catch (error) {
            console.error('HuggingFace generation error:', error);
            throw error;
        }
    }

    // Generate image using Stable Diffusion
    async generateImage(prompt: string): Promise<string> {
        if (!this.isConfigured()) {
            throw new Error('HuggingFace API key not configured');
        }

        try {
            const response = await fetch(`${HF_API_URL}/${HF_MODELS.image}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: prompt
                })
            });

            if (!response.ok) {
                if (response.status === 503) {
                    console.log('HuggingFace image model is loading, retrying...');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    return this.generateImage(prompt);
                }
                throw new Error(`HuggingFace image error: ${await response.text()}`);
            }

            // Convert blob to base64
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('HuggingFace image generation error:', error);
            throw error;
        }
    }

    // Generate embeddings for RAG
    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.isConfigured()) {
            throw new Error('HuggingFace API key not configured');
        }

        try {
            const response = await fetch(`${HF_API_URL}/${HF_MODELS.embedding}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: text
                })
            });

            if (!response.ok) {
                if (response.status === 503) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    return this.generateEmbedding(text);
                }
                throw new Error(`HuggingFace embedding error: ${await response.text()}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('HuggingFace embedding error:', error);
            throw error;
        }
    }
}

// Create and register the provider
const huggingFaceProvider = new HuggingFaceProvider();
registerProvider(huggingFaceProvider);

export { huggingFaceProvider, HF_MODELS };
export default HuggingFaceProvider;
