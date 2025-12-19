import { ModelProvider, ModelConfig, TaskType } from '../types';

// ============================================
// AI PROVIDER INTERFACE
// ============================================

export interface GenerateOptions {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json';
}

export type ContentPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } } // base64
    | { fileData: { mimeType: string; fileUri: string } };

export interface AIProvider {
    name: ModelProvider;
    displayName: string;

    // Check if the provider is configured (API key present)
    isConfigured(): boolean;

    // Generate content (supports text-only or multimodal inputs)
    generateText(prompt: string | ContentPart[], options?: GenerateOptions): Promise<string>;

    // Check if provider is available (configured + API responding)
    checkAvailability(): Promise<boolean>;
}

// ============================================
// MODEL DEFINITIONS
// ============================================

export const MODEL_REGISTRY: ModelConfig[] = [
    // Gemini Models
    {
        provider: ModelProvider.GEMINI,
        modelId: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        description: 'Balanced speed and quality, supports image generation',
        strengths: ['images', 'balanced', 'multimodal'],
        isAvailable: true // Will be updated at runtime
    },
    {
        provider: ModelProvider.GEMINI,
        modelId: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Long context (1M tokens), best for complex documents',
        strengths: ['long_context', 'reasoning', 'analysis'],
        isAvailable: true
    },

    // Groq Models (Ultra-fast)
    {
        provider: ModelProvider.GROQ,
        modelId: 'llama-3.3-70b-versatile',
        displayName: 'Llama 3.3 70B (Groq)',
        description: 'Ultra-fast inference, strong general capabilities',
        strengths: ['speed', 'reasoning', 'general'],
        isAvailable: false
    },
    {
        provider: ModelProvider.GROQ,
        modelId: 'mixtral-8x7b-32768',
        displayName: 'Mixtral 8x7B (Groq)',
        description: 'Fast, multilingual, 32k context',
        strengths: ['speed', 'multilingual', 'balanced'],
        isAvailable: false
    },

    // DeepSeek Models (Best reasoning)
    {
        provider: ModelProvider.DEEPSEEK,
        modelId: 'deepseek-chat',
        displayName: 'DeepSeek V3',
        description: 'Excellent reasoning and coding capabilities',
        strengths: ['reasoning', 'coding', 'analysis', 'planning'],
        isAvailable: false
    },

    // Mistral Models (Quality prose)
    {
        provider: ModelProvider.MISTRAL,
        modelId: 'mistral-large-latest',
        displayName: 'Mistral Large',
        description: 'High quality text generation, excellent for prose',
        strengths: ['writing', 'prose', 'creative', 'quality'],
        isAvailable: false
    },
    {
        provider: ModelProvider.MISTRAL,
        modelId: 'mistral-small-latest',
        displayName: 'Mistral Small',
        description: 'Efficient, good for quick tasks',
        strengths: ['speed', 'efficiency', 'quick_tasks'],
        isAvailable: false
    }
];

// ============================================
// TASK-TO-MODEL MAPPING
// ============================================

const TASK_MODEL_PRIORITY: Record<TaskType, ModelProvider[]> = {
    planning: [ModelProvider.DEEPSEEK, ModelProvider.GEMINI, ModelProvider.MISTRAL],
    writing: [ModelProvider.MISTRAL, ModelProvider.DEEPSEEK, ModelProvider.GEMINI],
    editing: [ModelProvider.GROQ, ModelProvider.MISTRAL, ModelProvider.GEMINI],
    critique: [ModelProvider.DEEPSEEK, ModelProvider.GEMINI, ModelProvider.MISTRAL],
    synthesis: [ModelProvider.DEEPSEEK, ModelProvider.GEMINI, ModelProvider.MISTRAL],
    image_generation: [ModelProvider.GEMINI], // Only Gemini supports images
    quick_response: [ModelProvider.GROQ, ModelProvider.GEMINI, ModelProvider.MISTRAL]
};

// ============================================
// PROVIDER INSTANCES (Lazy loaded)
// ============================================

const providerInstances: Map<ModelProvider, AIProvider> = new Map();

export function registerProvider(provider: AIProvider): void {
    providerInstances.set(provider.name, provider);
}

export function getProvider(name: ModelProvider): AIProvider | undefined {
    return providerInstances.get(name);
}

export function getAvailableProviders(): ModelProvider[] {
    const available: ModelProvider[] = [];
    for (const [name, provider] of providerInstances) {
        if (provider.isConfigured()) {
            available.push(name);
        }
    }
    return available;
}

// ============================================
// AUTO-SELECT BEST MODEL
// ============================================

export function selectBestModel(taskType: TaskType, availableProviders: ModelProvider[]): ModelConfig | null {
    const priorityList = TASK_MODEL_PRIORITY[taskType];

    for (const preferredProvider of priorityList) {
        if (availableProviders.includes(preferredProvider)) {
            // Find the best model for this provider
            const model = MODEL_REGISTRY.find(
                m => m.provider === preferredProvider && m.isAvailable
            );
            if (model) return model;
        }
    }

    // Fallback: return any available model
    for (const provider of availableProviders) {
        const model = MODEL_REGISTRY.find(m => m.provider === provider && m.isAvailable);
        if (model) return model;
    }

    return null;
}

// ============================================
// UNIFIED GENERATE FUNCTION
// ============================================

export async function generateWithBestModel(
    prompt: string | ContentPart[],
    taskType: TaskType,
    options?: GenerateOptions,
    preferredProvider?: ModelProvider
): Promise<{ text: string; modelUsed: string }> {
    const available = getAvailableProviders();

    if (available.length === 0) {
        throw new Error('No AI providers configured. Please add API keys to .env.local');
    }

    // Use preferred provider if specified and available
    let targetProvider: ModelProvider;
    if (preferredProvider && available.includes(preferredProvider)) {
        targetProvider = preferredProvider;
    } else {
        const bestModel = selectBestModel(taskType, available);
        if (!bestModel) {
            throw new Error('No suitable model found for task: ' + taskType);
        }
        targetProvider = bestModel.provider;
    }

    const provider = getProvider(targetProvider);
    if (!provider) {
        throw new Error(`Provider ${targetProvider} not initialized`);
    }

    const text = await provider.generateText(prompt, options);
    const model = MODEL_REGISTRY.find(m => m.provider === targetProvider);

    return {
        text,
        modelUsed: model?.displayName || targetProvider
    };
}

// ============================================
// UPDATE MODEL AVAILABILITY
// ============================================

export function updateModelAvailability(provider: ModelProvider, isAvailable: boolean): void {
    MODEL_REGISTRY.forEach(model => {
        if (model.provider === provider) {
            model.isAvailable = isAvailable;
        }
    });
}

// ============================================
// GET MODELS BY PROVIDER
// ============================================

export function getModelsByProvider(provider: ModelProvider): ModelConfig[] {
    return MODEL_REGISTRY.filter(m => m.provider === provider);
}

export function getAllModels(): ModelConfig[] {
    return [...MODEL_REGISTRY];
}
