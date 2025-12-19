import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, MessageRole, Project, ContentBlock, BlockType } from "../types";

// Lazy initialization to avoid crash when API key is not set
let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = (import.meta as any).env?.VITE_API_KEY || '';
    if (!apiKey || apiKey === '') {
      throw new Error('Gemini API key not configured. Add VITE_API_KEY to .env.local');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// System instruction to guide the "Vibe" persona
const SYSTEM_INSTRUCTION = `
You are the Vibe Engine, a deep-work creative partner. 
Your goal is to help the user progressively build high-quality creative content (books, designs, articles, etc.).
You should:
1. Be concise but deeply insightful in chat.
2. When the user asks to "create", "draft", "visualize", or "expand", you must generate structured content.
3. Adopt a modern, professional, slightly futuristic and encouraging tone ("Vibe coding" aesthetic).
4. If the user asks for an image, acknowledge it in text, but understand the client handles the actual image generation call separately based on your triggers.
`;

export const generateChatMessage = async (
  history: Message[],
  currentMessage: string,
  projectContext?: Project
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';

    let contextPrompt = "";
    if (projectContext) {
      const projectSummary = projectContext.blocks.map(b => `[${b.type.toUpperCase()}]: ${b.content.substring(0, 100)}...`).join('\n');
      contextPrompt = `\nCurrent Project Context (${projectContext.title}):\n${projectSummary}\n---\n`;
    }

    const contents = [
      ...history.filter(m => m.role !== MessageRole.SYSTEM).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })),
      {
        role: 'user',
        parts: [{ text: contextPrompt + currentMessage }]
      }
    ];

    const response = await getAI().models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "I'm vibing, but I couldn't generate a response.";
  } catch (error) {
    console.error("Chat generation error:", error);
    return "Connection interrupted. Let's try that again.";
  }
};

export const generateBlockContent = async (
  prompt: string,
  currentBlocks: ContentBlock[],
  blockType: 'text' | 'image' = 'text'
): Promise<string> => {
  try {
    if (blockType === 'image') {
      // Use image generation model
      const response = await getAI().models.generateContent({
        model: 'gemini-2.5-flash-image', // Using standard image model
        contents: prompt,
        config: {
          responseMimeType: 'image/jpeg'
          // Not setting responseSchema for image model
        }
      });

      // Handle image response extraction
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
      // If no inline data, check if it returned text (error or refusal)
      return "";
    } else {
      // Text generation
      const model = 'gemini-2.5-flash';
      const context = currentBlocks.map(b => b.content).join('\n\n');
      const fullPrompt = `Based on the following context:\n${context}\n\nTask: ${prompt}\n\nGenerate high-quality Markdown formatted text. Do not include introductory filler. Just the content.`;

      const response = await getAI().models.generateContent({
        model,
        contents: fullPrompt
      });
      return response.text || "";
    }
  } catch (error) {
    console.error("Content generation error:", error);
    throw error;
  }
};

export const suggestImprovement = async (content: string): Promise<string> => {
  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Improve the following text to be more engaging, articulate, and "vibey". Keep the original meaning but elevate the prose:\n\n${content}`
    });
    return response.text || content;
  } catch (error) {
    return content;
  }
}
