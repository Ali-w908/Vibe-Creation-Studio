import { Project, ContentBlock, BlockType, BlockStatus, AgentRole, AgentLog, ModelProvider, CharacterProfile, ArchitectPlan, WriterOutput, GenerateOptions, EditorAction } from '../types';
import { getPersonaById } from './agentPersonas';
import {
  getProvider,
  getAvailableProviders,
} from './modelRegistry';

// Initialize providers
import './providers';

// --- Helper for Safe JSON Parsing ---
const safeParseJSON = <T>(text: string, fallback: T): T => {
  if (!text) return fallback;
  try {
    // Remove markdown code blocks if present (common with LLMs)
    const cleanText = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("JSON Parse Failed. Raw text:", text);
    return fallback;
  }
};

const EDITOR_PROMPT = `
You are an Expert Editor.
Your goal is to refine the provided text based on the requested action.

ACTIONS:
- "expand": Add detail, depth, and sensory description.
- "rewrite": Rephrase for better flow and clarity, maintaining the same meaning.
- "shorten": Condense the text, removing fluff while keeping key points.
- "grammar": Fix grammar only. Do not change style.

OUTPUT: Return raw JSON with the refined content.
{
  "content": "The refined text...",
  "changes": "Brief summary of what was changed."
}
`;

// --- Multi-Provider Generate with Fallback ---
const generateWithFallback = async (
  prompt: string,
  options?: GenerateOptions,
  preferredProviders?: ModelProvider[]
): Promise<{ text: string; provider: string }> => {
  const available = getAvailableProviders();

  console.log(`[AgentOrchestrator] Available providers: ${available.join(', ')}`);

  if (available.length === 0) {
    throw new Error('No AI providers configured. Please add API keys to .env.local');
  }

  // Order: preferred first, then all available (using Set to avoid duplicates)
  const tryOrderSet = new Set<ModelProvider>();
  if (preferredProviders) {
    preferredProviders.filter(p => available.includes(p)).forEach(p => tryOrderSet.add(p));
  }
  available.forEach(p => tryOrderSet.add(p));
  const tryOrder = Array.from(tryOrderSet);

  console.log(`[AgentOrchestrator] Try order: ${tryOrder.join(' -> ')}`);

  const errors: string[] = [];

  for (const providerName of tryOrder) {
    const provider = getProvider(providerName);
    if (!provider) {
      console.log(`[AgentOrchestrator] Provider ${providerName} not found in registry`);
      continue;
    }

    // Try up to 2 times per provider for transient errors
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[AgentOrchestrator] Trying ${providerName} (attempt ${attempt})`);
        const text = await provider.generateText(prompt, options);
        if (text && text.trim()) {
          console.log(`[AgentOrchestrator] Success with ${providerName}`);
          return { text, provider: providerName };
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.warn(`[AgentOrchestrator] ${providerName} attempt ${attempt} failed:`, errMsg);
        errors.push(`${providerName}: ${errMsg}`);

        // If it's a rate limit or overload, wait a bit before retry
        if (errMsg.includes('overload') || errMsg.includes('429') || errMsg.includes('rate')) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  }

  throw new Error(`All providers failed:\n${errors.join('\n')}`);
};


// --- Agent Personas & Instructions ---

const ARCHITECT_PROMPT = `
You are the Architect Agent.
Analyze the request and create a structured plan.
Break it down into specific Writer tasks (e.g., Chapters, Sections).

OUTPUT: JSON with a list of tasks.
{
  "tasks": [
    {
      "role": "WRITER",
      "description": "Write Chapter 1: The Beginning...",
      "context_script": "Focus on introducing the protagonist...",
      "title": "Chapter 1"
    }
  ]
}

IMPORTANT: Return raw JSON only.
`;

const WRITER_PROMPT = `
You are the Writer Agent.
Write high-quality creative content based on the Task and Context provided.
Use the Character and World context to ensure consistency.

OUTPUT: JSON with content.
{
  "content": "The generated story text...",
  "helper_script": "Notes on tone/pacing used."
}

IMPORTANT: 
- Return raw JSON only. 
- Write substantial content (at least 3-5 paragraphs for chapters).
- Use proper markdown formatting in content.
- Ensure all newlines in 'content' are escaped (use \\n, not literal line breaks).
`;

const VISIONARY_PROMPT = `
You are the Visionary Agent. 
Generate a comprehensive Visual & Tonal Style Guide for the project.
OUTPUT: JSON with style_guide and sensory_palette.
{
  "style_guide": "Description of the visual and narrative style...",
  "sensory_palette": "Key colors, sounds, and textures to define the mood..."
}
IMPORTANT: Return raw JSON only.
`;

const CRITIC_PROMPT = `
You are a Literary Critic.
Review the provided story text for quality, flow, and impact.
Identify 3-5 specific areas for improvement.
Output { "approved": true, "critique": "Brief feedback..." }.

IMPORTANT: Return raw JSON only.
`;

const CONSISTENCY_PROMPT = `
You are a Continuity Editor.
Your ONLY job is to verify that the story content aligns with the World Blueprint.

BLUEPRINT:
{WORLD_CONTEXT}

STORY CONTENT:
{CONTENT}

TASK:
1. Check for character trait contradictions.
2. Check for location details consistency.
3. Check for item usage accuracy.

OUTPUT: JSON with status and issues.
{
  "status": "pass" | "fail",
  "issues": ["Issue 1", "Issue 2"]
}
IMPORTANT: Return raw JSON only.
`;

// --- Interfaces for Type Safety ---

interface ArchitectTask {
  role: string;
  description: string;
  context_script: string;
  title?: string;
}

interface VisionaryOutput {
  style_guide?: string;
  sensory_palette?: string;
}

interface CriticOutput {
  approved?: boolean;
  critique?: string;
}

interface ConsistencyOutput {
  status?: 'pass' | 'fail';
  issues?: string[];
}

// --- Service Logic ---

export type LogCallback = (log: AgentLog) => void;

export const runMultiAgentWorkflow = async (
  userRequest: string,
  project: Project,
  onLog: LogCallback,
  blueprint?: any // Using any to avoid circular type ref if not imported, but best to import Blueprint
): Promise<ContentBlock[]> => {
  const newBlocks: ContentBlock[] = [];
  const log = (agent: AgentRole, message: string, metadata?: string, status: AgentLog['status'] = 'working', modelUsed?: string) => {
    onLog({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      agent,
      message,
      metadata,
      status,
      modelUsed
    });
  };

  try {
    // 1. PLANNING PHASE (Parallel Architect & Visionary)
    let plan: ArchitectPlan;
    let styleContext = "";

    // If blueprint exists, use it vs dynamic planning
    if (project.blueprint) {
      log(AgentRole.ARCHITECT, 'Using approved blueprint plan.', undefined, 'success');
      plan = {
        tasks: project.blueprint.sections.filter((s: any) => s.type === 'chapter').map((s: any) => ({
          role: 'WRITER',
          description: `Write ${s.title}. ${s.description}`,
          context_script: `Genre: ${project.blueprint?.genre}, Tone: ${project.blueprint?.tone}. Structure this as a ${s.type}.`,
          title: s.title
        }))
      };
      styleContext = `Tone: ${project.blueprint?.tone || 'Standard'}`;
    } else {
      log(AgentRole.PROJECT_MANAGER, 'Initiating Parallel Planning Phase...', undefined, 'thinking');

      const contextSummary = project.blocks.map(b => `[${b.type}] ${b.content.substring(0, 50)}...`).join('\n');
      const basePrompt = `Current Project Context:\n${contextSummary}\n\nUser Request: ${userRequest}`;

      // --- PARALLEL EXECUTION: Architect & Visionary ---
      log(AgentRole.ARCHITECT, 'Structuring narrative arc...', undefined, 'thinking');
      log(AgentRole.VISIONARY, 'Defining stylistic palette...', undefined, 'thinking');

      const [architectResult, visionaryResult] = await Promise.all([
        generateWithFallback(
          basePrompt,
          { systemPrompt: ARCHITECT_PROMPT, responseFormat: 'json' },
          [ModelProvider.DEEPSEEK, ModelProvider.GEMINI, ModelProvider.MISTRAL]
        ),
        generateWithFallback(
          basePrompt,
          { systemPrompt: VISIONARY_PROMPT, responseFormat: 'json' },
          [ModelProvider.GEMINI, ModelProvider.GROQ, ModelProvider.MISTRAL]
        )
      ]);

      // Process Architect Result
      plan = safeParseJSON<ArchitectPlan>(architectResult.text, { tasks: [] });
      if (!plan.tasks || !Array.isArray(plan.tasks)) {
        log(AgentRole.ARCHITECT, 'Failed to generate a valid plan.', undefined, 'failed');
        return [];
      }
      log(AgentRole.ARCHITECT, `Plan created with ${plan.tasks.length} tasks.`, JSON.stringify(plan.tasks, null, 2), 'success', architectResult.provider);

      // Process Visionary Result
      const visionaryData = safeParseJSON<VisionaryOutput>(visionaryResult.text, {});
      styleContext = `VISUAL STYLE: ${visionaryData.style_guide}\nSENSORY PALETTE: ${visionaryData.sensory_palette}`;
      log(AgentRole.VISIONARY, 'Style guide established.', styleContext, 'success', visionaryResult.provider);
    }

    // 2. EXECUTION PHASE
    let chapterNumber = 1;

    // Get Persona
    const persona = getPersonaById(project.blueprint?.personaId);
    if (persona.id !== 'standard_vibe') {
      log(AgentRole.PROJECT_MANAGER, `Applying Agent Persona: ${persona.name}`, undefined, 'success');
    }

    for (const task of plan.tasks) {
      const role = task.role as AgentRole;
      log(role, `Executing: ${task.description}`, undefined, 'thinking');

      if (role === 'WRITER') {
        // Construct character context
        const characterContext = project.blueprint?.characters
          ? `\n\nCHARACTERS IN STORY:\n${project.blueprint.characters.map((c: any) => `- ${c.name} (${c.role}): ${c.description} [Traits: ${c.traits.join(', ')}]`).join('\n')}`
          : '';

        // Construct World Context (Atlas)
        const locationContext = project.blueprint?.locations?.length
          ? `\n\nKEY LOCATIONS:\n${project.blueprint.locations.map((l: any) => `- ${l.name}: ${l.description} [Sensory: ${l.sensoryDetails}]`).join('\n')}`
          : '';

        const itemContext = project.blueprint?.items?.length
          ? `\n\nIMPORTANT ITEMS:\n${project.blueprint.items.map((i: any) => `- ${i.name}: ${i.description} [Usage: ${i.usage}]`).join('\n')}`
          : '';

        const worldContext = `${locationContext}${itemContext}`;

        // Combine contexts
        const fullContext = `${styleContext}\n${characterContext}${worldContext}\nScript: ${task.context_script}`;

        // Apply Persona Modifier
        const systemPrompt = persona.systemPromptModifier
          ? `${WRITER_PROMPT}\n\nIMPORTANT - ADOPT THIS PERSONA:\n${persona.systemPromptModifier}`
          : WRITER_PROMPT;

        // Use Mistral for writing, fallback to others
        const writerResult = await generateWithFallback(
          `Task: ${task.description}\n${fullContext}`,
          {
            systemPrompt: systemPrompt,
            responseFormat: 'json'
          },
          [ModelProvider.MISTRAL, ModelProvider.DEEPSEEK, ModelProvider.GEMINI, ModelProvider.GROQ]
        );

        const output = safeParseJSON<WriterOutput>(writerResult.text, { content: "" });

        // Ensure content is a string
        let contentStr = '';
        if (typeof output.content === 'string') {
          contentStr = output.content;
        } else if (output.content && Array.isArray(output.content)) {
          contentStr = output.content.join('\n');
        } else if (output.content) {
          contentStr = String(output.content);
        }

        if (!contentStr) {
          log(AgentRole.WRITER, 'Failed to generate content.', undefined, 'failed');
          continue;
        }

        log(AgentRole.WRITER, 'Drafting content complete.', output.helper_script || 'No script provided', 'success', writerResult.provider);

        // --- PARALLEL VALIDATION: Critic & Consistency Checker ---
        log(AgentRole.CRITIC, 'Reviewing quality...', undefined, 'thinking');
        log(AgentRole.CONSISTENCY_CHECKER, 'Verifying world facts...', undefined, 'thinking');

        const [criticResult, consistencyResult] = await Promise.all([
          generateWithFallback(
            `Task: ${task.description}\nGenerated Content: ${contentStr.substring(0, 1000)}...`,
            { systemPrompt: CRITIC_PROMPT, responseFormat: 'json' },
            [ModelProvider.GROQ, ModelProvider.GEMINI, ModelProvider.DEEPSEEK]
          ),
          generateWithFallback(
            contentStr.substring(0, 2000), // Limit context for speed
            {
              systemPrompt: CONSISTENCY_PROMPT
                .replace('{WORLD_CONTEXT}', worldContext || 'No specific world rules.')
                .replace('{CONTENT}', contentStr.substring(0, 1000)),
              responseFormat: 'json'
            },
            [ModelProvider.GEMINI, ModelProvider.DEEPSEEK] // Fast + Smart
          )
        ]);

        const critique = safeParseJSON<CriticOutput>(criticResult.text, {});
        const consistency = safeParseJSON<ConsistencyOutput>(consistencyResult.text, {});

        // Log Results
        log(AgentRole.CRITIC, `Quality: ${critique.approved ? 'Approved' : 'Needs Polish'}`, critique.critique, 'success', criticResult.provider);

        if (consistency.status === 'fail') {
          log(AgentRole.CONSISTENCY_CHECKER, 'Consistency Issues Found', consistency.issues?.join(', '), 'warning', consistencyResult.provider);
        } else {
          log(AgentRole.CONSISTENCY_CHECKER, 'World Consistency Verified', undefined, 'success', consistencyResult.provider);
        }

        // Determine if this is a chapter
        const isChapter = task.description.toLowerCase().includes('chapter') ||
          task.title?.toLowerCase().includes('chapter');

        // INTEGRATION
        newBlocks.push({
          id: Math.random().toString(36).substr(2, 9),
          type: isChapter ? BlockType.CHAPTER : BlockType.TEXT,
          content: contentStr,
          status: BlockStatus.DRAFT,
          revisionHistory: [],
          metadata: {
            agentSignature: 'Writer Agent',
            modelUsed: writerResult.provider,
            prompt: task.description,
            title: task.title,
            chapterNumber: isChapter ? chapterNumber++ : undefined
          }
        });
      }
    }
  } catch (error) {
    console.error('Workflow error:', error);
    log(AgentRole.PROJECT_MANAGER, 'Workflow encountered an error.', String(error), 'failed');
  }

  return newBlocks;
};

export const refineContent = async (
  content: string,
  action: EditorAction,
  onLog: (message: string) => void
): Promise<{ content: string; changes: string }> => {
  onLog(`Editing content: ${action}...`);

  try {
    const result = await generateWithFallback(
      `Original Content:\n${content}\n\nAction: ${action}`,
      {
        systemPrompt: EDITOR_PROMPT,
        responseFormat: 'json'
      },
      [ModelProvider.GEMINI, ModelProvider.DEEPSEEK]
    );

    const parsed = safeParseJSON<{ content: string; changes: string }>(result.text, {
      content: content,
      changes: "Failed to parse changes."
    });

    return parsed;

  } catch (error) {
    console.error('Refine error:', error);
    throw error;
  }
};