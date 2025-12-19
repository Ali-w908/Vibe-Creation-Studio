import { InputItem, InputType, SynthesisResult, StructureSuggestion, ChapterSuggestion, SynthesisCharacter, SynthesisLocation, SynthesisItem } from '../types/inputs';
import { generateWithBestModel, ContentPart } from './modelRegistry';
import { ModelProvider } from '../types';

const SYNTHESIS_PROMPT = `
You are an expert content synthesizer. Analyze all the provided inputs and extract:

1. THEMES: Main recurring themes across all inputs
2. KEY IDEAS: Important concepts, points, or story elements
3. STRUCTURE: Suggest an optimal chapter/section structure
4. CHARACTERS: Extract or infer main characters (protagonist, antagonist, etc.)
5. LOCATIONS: Extract key settings/places
6. ITEMS: Extract significant objects/artifacts
7. GUIDELINES: Any specific instructions or style preferences found
8. SUMMARY: A unified context summary that captures the essence

Input Materials:
{INPUTS}

OUTPUT FORMAT (JSON):
{
  "themes": ["theme1", "theme2"],
  "keyIdeas": ["idea1", "idea2"],
  "suggestedStructure": {
    "title": "Suggested book title",
    "chapters": [
      { "number": 1, "title": "Chapter title", "summary": "Brief description", "keyPoints": ["point1"] }
    ],
    "estimatedWordCount": 50000,
    "genre": "detected genre",
    "tone": "detected tone"
  },
  "characters": [
    { "name": "Name", "role": "Protagonist/Antagonist/Supporting", "description": "Brief bio", "traits": ["brave", "cynical"] }
  ],
  "locations": [
    { "name": "Place Name", "description": "Visual desc", "sensoryDetails": "Sights/Smells" }
  ],
  "items": [
    { "name": "Item Name", "description": "Physical desc", "usage": "significance" }
  ],
  "guidelines": ["guideline1", "guideline2", ...],
  "contextSummary": "A comprehensive summary of all inputs that can be used as context for AI agents..."
}

Return ONLY valid JSON. Be thorough in your analysis.
`;

export async function synthesizeInputs(items: InputItem[]): Promise<SynthesisResult> {
    if (items.length === 0) {
        return {
            summary: 'No inputs provided.',
            themes: [],
            keyIdeas: [],
            suggestedStructure: { chapters: [], estimatedWordCount: 0 },
            characters: [],
            locations: [],
            items: [],
            guidelines: [],
            contextSummary: 'No inputs provided.',
            wordCount: 0,
            sourceCount: 0
        };
    }

    // Format inputs for the prompt
    let prompt: string | ContentPart[] = '';
    const contentParts: ContentPart[] = [];

    // Add instruction text as the first part
    contentParts.push({ text: SYNTHESIS_PROMPT.replace('{INPUTS}', '[See attached content]') });

    for (const item of items) {
        if (item.type === InputType.IMAGE && item.rawContent) {
            // Add image directly
            const base64Data = (item.rawContent as string).split(',')[1];
            const mimeType = item.metadata.fileType || 'image/jpeg';
            contentParts.push({ text: `\n\n--- Input (Image): ${item.name} ---\n` });
            contentParts.push({ inlineData: { mimeType, data: base64Data } });
        } else if (item.type === InputType.DOCUMENT && item.rawContent && item.metadata.fileType === 'application/pdf') {
            // Add PDF directly
            const base64Data = (item.rawContent as string).split(',')[1];
            const mimeType = 'application/pdf';
            contentParts.push({ text: `\n\n--- Input (PDF): ${item.name} ---\n` });
            contentParts.push({ inlineData: { mimeType, data: base64Data } });
        } else {
            // Text content
            let textContent = '';
            switch (item.type) {
                case InputType.DOCUMENT:
                    textContent = `[DOCUMENT: ${item.name}]\n${item.content.substring(0, 5000)}`;
                    break;
                case InputType.URL:
                    textContent = `[URL: ${item.metadata.url}]\nTitle: ${item.metadata.title || 'N/A'}\nContent: ${item.content.substring(0, 3000)}`;
                    break;
                case InputType.GUIDELINE:
                    textContent = `[GUIDELINE]\n${item.content}`;
                    break;
                case InputType.NOTE:
                    textContent = `[NOTE]\n${item.content}`;
                    break;
                default:
                    textContent = `[${item.type}]\n${item.content.substring(0, 2000)}`;
            }
            contentParts.push({ text: `\n\n--- Input ${item.name} ---\n${textContent}` });
        }
    }

    prompt = contentParts;

    try {
        // Use DeepSeek for synthesis (best reasoning) via registry auto-selection
        const response = await generateWithBestModel(
            prompt,
            'synthesis',
            { responseFormat: 'json' }
        );

        // Parse the response
        const cleanedResponse = response.text
            .replace(/```json\s */g, '')
            .replace(/```\s*/g, '')
            .trim();

        const parsed = JSON.parse(cleanedResponse);

        // Calculate metadata
        const totalWordCount = items.reduce((sum, item) => {
            return sum + (item.content?.split(/\s+/).length || 0);
        }, 0);

        return {
            summary: parsed.contextSummary || 'Synthesis complete.',
            themes: parsed.themes || [],
            keyIdeas: parsed.keyIdeas || [],
            suggestedStructure: parsed.suggestedStructure || { chapters: [], estimatedWordCount: 0 },
            characters: parsed.characters || [],
            locations: parsed.locations || [],
            items: parsed.items || [],
            guidelines: [
                ...parsed.guidelines || [],
                ...items.filter(i => i.type === InputType.GUIDELINE).map(i => i.content)
            ],
            contextSummary: parsed.contextSummary || 'Synthesis complete.',
            wordCount: totalWordCount,
            sourceCount: items.length
        };

    } catch (error) {
        console.error('Synthesis error:', error);

        // Return a basic synthesis from guidelines and notes
        const guidelines = items
            .filter(i => i.type === InputType.GUIDELINE)
            .map(i => i.content);

        const notes = items
            .filter(i => i.type === InputType.NOTE)
            .map(i => i.content)
            .join('\n');

        return {
            summary: 'Synthesis failed. Using raw inputs.',
            themes: ['Unable to fully synthesize - using basic extraction'],
            keyIdeas: notes.split('\n').filter(n => n.trim()).slice(0, 5),
            suggestedStructure: {
                chapters: [
                    { number: 1, title: 'Introduction', summary: 'Begin the story', keyPoints: ['Setup'] },
                    { number: 2, title: 'Development', summary: 'Build the narrative', keyPoints: ['Action'] },
                    { number: 3, title: 'Conclusion', summary: 'Resolve the story', keyPoints: ['Resolution'] }
                ],
                estimatedWordCount: 30000
            },
            characters: [],
            locations: [],
            items: [],
            guidelines,
            contextSummary: `Based on ${items.length} inputs: ${notes.substring(0, 500)}`,
            wordCount: items.reduce((sum, item) => sum + (item.content?.split(/\s+/).length || 0), 0),
            sourceCount: items.length
        };
    }
}

// Helper to extract text from different file types
export async function extractTextFromFile(file: File): Promise<string> {
    const type = file.type;

    if (type === 'text/plain' || type === 'text/markdown') {
        return await file.text();
    }

    if (type === 'application/json') {
        const text = await file.text();
        try {
            const json = JSON.parse(text);
            // Try to extract ChatGPT/Claude conversation format
            if (json.messages) {
                return json.messages.map((m: any) => `${m.role}: ${m.content}`).join('\n\n');
            }
            return JSON.stringify(json, null, 2);
        } catch {
            return text;
        }
    }

    // For PDFs and DOCXs, we'd need a library - for now return a placeholder
    if (type === 'application/pdf') {
        return '[PDF content - browser-side extraction requires pdf.js library]';
    }

    if (type.includes('wordprocessingml')) {
        return '[DOCX content - browser-side extraction requires mammoth.js library]';
    }

    // Default: try to read as text
    try {
        return await file.text();
    } catch {
        return '[Unable to extract text from this file type]';
    }
}

// Helper to fetch and parse URL content
export async function fetchUrlContent(url: string): Promise<{ title: string; content: string }> {
    try {
        // Use a CORS proxy for fetching
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const html = await response.text();

        // Basic HTML parsing
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : url;

        // Extract main text content (simplified)
        const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000);

        return { title, content: textContent };
    } catch (error) {
        console.error('URL fetch error:', error);
        return { title: url, content: 'Unable to fetch URL content.' };
    }
}
