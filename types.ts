// ============================================
// MESSAGE TYPES
// ============================================

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface GenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
}

export interface ArchitectPlan {
  tasks: {
    role: string;
    description: string;
    context_script: string;
    title?: string;
  }[];
}

export interface WriterOutput {
  content: string | string[];
  helper_script?: string;
}

// ============================================
// AI PROVIDER TYPES
// ============================================

export enum ModelProvider {
  GEMINI = 'gemini',
  GROQ = 'groq',
  DEEPSEEK = 'deepseek',
  MISTRAL = 'mistral',
  OPENROUTER = 'openrouter',
  HUGGINGFACE = 'huggingface'
}

export interface ModelConfig {
  provider: ModelProvider;
  modelId: string;
  displayName: string;
  description: string;
  strengths: string[];
  isAvailable: boolean; // Based on API key presence
}

export type TaskType =
  | 'planning'
  | 'writing'
  | 'editing'
  | 'critique'
  | 'synthesis'
  | 'image_generation'
  | 'quick_response';

export type EditorAction = 'expand' | 'rewrite' | 'shorten' | 'grammar';

// ============================================
// BLOCK TYPES
// ============================================

export enum BlockType {
  TEXT = 'text',
  IMAGE = 'image',
  NOTE = 'note',
  CHAPTER = 'chapter',
  PLAN = 'plan',
  ARTIFACT = 'artifact'
}

export enum BlockStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  NEEDS_REVISION = 'needs_revision'
}

export interface RevisionEntry {
  id: string;
  content: string;
  timestamp: number;
  feedback?: string; // User feedback that triggered this revision
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string; // Markdown text or Base64 image data
  status: BlockStatus;
  revisionHistory: RevisionEntry[];
  metadata?: {
    prompt?: string;
    style?: string;
    lastEdited?: number;
    agentSignature?: string; // Which agent created this
    modelUsed?: string; // Which AI model generated this
    chapterNumber?: number; // For chapter blocks
    title?: string; // Block title (e.g., chapter title)
  };
}

// ============================================
// PROJECT TYPES
// ============================================

export interface ProjectSettings {
  preferredProvider?: ModelProvider;
  autoSelectModel: boolean;
  bookMetadata?: {
    author?: string;
    genre?: string;
    targetAudience?: string;
    tone?: string;
  };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  blocks: ContentBlock[];
  lastModified: number;
  settings: ProjectSettings;
  workflowPhase: WorkflowPhase;
  blueprint?: Blueprint;
}

export interface Blueprint {
  title: string;
  description: string;
  genre?: string;
  tone?: string;
  targetAudience?: string;
  sections: BlueprintSection[];
  characters: CharacterProfile[];
  locations?: Location[];
  items?: Item[];
  personaId?: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  sensoryDetails: string; // Sights, sounds, smells
}

export interface Item {
  id: string;
  name: string;
  description: string;
  usage: string; // How it is used or why it is important
}

export interface BlueprintSection {
  id: string;
  title: string;
  description: string; // The prompt for the Writer
  type: 'chapter' | 'scene';
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string; // Protag, Antag, Support
  description: string;
  traits: string[];
}

export interface AgentPersona {
  id: string;
  name: string;
  description: string;
  systemPromptModifier: string;
}

export enum WorkflowPhase {
  INPUT_GATHERING = 'input_gathering',
  SYNTHESIS = 'synthesis',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  REVIEW = 'review',
  COMPLETE = 'complete'
}

// ============================================
// MULTI-AGENT TYPES
// ============================================

export enum AgentRole {
  ARCHITECT = 'ARCHITECT',
  WRITER = 'WRITER',
  VISIONARY = 'VISIONARY',
  CRITIC = 'CRITIC',
  INTEGRATOR = 'INTEGRATOR',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  SYNTHESIZER = 'SYNTHESIZER',
  EDITOR = 'EDITOR',
  CONSISTENCY_CHECKER = 'CONSISTENCY_CHECKER'
}

export interface AgentLog {
  id: string;
  timestamp: number;
  agent: AgentRole;
  message: string;
  metadata?: string; // The "helper/describer script"
  status: 'thinking' | 'working' | 'success' | 'failed' | 'warning';
  modelUsed?: string;
}

// ============================================
// APPLICATION STATE
// ============================================

export interface CreationState {
  isGenerating: boolean;
  activeProjectId: string | null;
  projects: Project[];
  chatHistory: Record<string, Message[]>;
  agentLogs: Record<string, AgentLog[]>; // ProjectId -> Logs
  globalSettings: GlobalSettings;
}

// ============================================
// VERSION CONTROL
// ============================================

export interface GlobalSettings {
  defaultProvider: ModelProvider;
  autoSelectModel: boolean;
  availableProviders: ModelProvider[]; // Based on configured API keys
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  timestamp: number;
  label: string;
  type: 'auto' | 'manual';
  snapshot: Project;
}
