// ============================================
// INPUT HUB TYPES
// ============================================

export enum InputType {
    DOCUMENT = 'document',
    IMAGE = 'image',
    CONVERSATION = 'conversation',
    AUDIO = 'audio',
    VIDEO = 'video',
    URL = 'url',
    GUIDELINE = 'guideline',
    NOTE = 'note'
}

export interface InputItem {
    id: string;
    type: InputType;
    name: string;
    content: string;
    rawContent?: string | ArrayBuffer;
    metadata: InputMetadata;
    status: InputStatus;
    createdAt: number;
    processedAt?: number;
}

export interface InputMetadata {
    // Document
    fileType?: string;
    fileSize?: number;
    pageCount?: number;
    wordCount?: number;

    // Image
    imageUrl?: string;
    width?: number;
    height?: number;
    analysis?: string;

    // Conversation
    platform?: 'chatgpt' | 'claude' | 'gemini' | 'other';
    messageCount?: number;
    participants?: string[];

    // Audio/Video
    duration?: number;
    transcript?: string;

    // URL
    url?: string;
    title?: string;
    description?: string;

    // Guideline
    category?: 'style' | 'avoid' | 'include' | 'format' | 'custom';
    priority?: 'high' | 'medium' | 'low';

    // Note
    tags?: string[];
}

export enum InputStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    READY = 'ready',
    ERROR = 'error'
}

export interface SynthesisResult {
    summary: string;
    themes: string[]; // normalized from keyThemes
    keyIdeas: string[];
    suggestedStructure: StructureSuggestion;
    characters: SynthesisCharacter[];
    locations: SynthesisLocation[];
    items: SynthesisItem[];
    guidelines: string[];
    contextSummary: string;
    wordCount: number;
    sourceCount: number;
}

export interface SynthesisCharacter {
    name: string;
    role: string;
    description: string;
    traits: string[];
}

export interface SynthesisLocation {
    name: string;
    description: string;
    sensoryDetails: string;
}

export interface SynthesisItem {
    name: string;
    description: string;
    usage: string;
}

export interface StructureSuggestion {
    title?: string;
    chapters: ChapterSuggestion[];
    estimatedWordCount: number;
    genre?: string;
    tone?: string;
}

export interface ChapterSuggestion {
    number: number;
    title: string;
    summary: string;
    keyPoints: string[];
}

export interface InputHubState {
    items: InputItem[];
    isProcessing: boolean;
    synthesisResult?: SynthesisResult;
    lastSynthesized?: number;
}

// ============================================
// GUIDELINE PRESETS
// ============================================

export const GUIDELINE_PRESETS = {
    style: [
        'Write in first person perspective',
        'Use simple, clear language',
        'Include vivid sensory descriptions',
        'Write like Ernest Hemingway - short sentences, minimal adjectives',
        'Use active voice throughout',
        'Include dialogue to bring scenes to life'
    ],
    avoid: [
        'Avoid clichés and overused phrases',
        'No cliffhangers between chapters',
        'Avoid purple prose - keep it grounded',
        'No deus ex machina plot devices',
        'Avoid excessive exposition dumps',
        'No passive voice'
    ],
    include: [
        'Include character development arcs',
        'Add foreshadowing for major events',
        'Include moments of humor for relief',
        'Add sensory details in every scene',
        'Include internal monologue for protagonist',
        'Add conflict in every chapter'
    ],
    format: [
        'Keep chapters between 2000-3000 words',
        'Use scene breaks with "* * *" markers',
        'Start each chapter with a hook',
        'End chapters on mini-cliffhangers',
        'Use markdown formatting for emphasis',
        'Include chapter titles that hint at content'
    ]
};

// ============================================
// CONVERSATION PARSING
// ============================================

export interface ParsedConversation {
    platform: string;
    messages: ParsedMessage[];
    extractedIdeas: string[];
    summary: string;
}

export interface ParsedMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}
