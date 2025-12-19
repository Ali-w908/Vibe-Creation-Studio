// ============================================
// KDP HELPER
// Amazon Kindle Direct Publishing assistance
// ============================================

import { BookMetadata } from './workspaceManager';
import { generateWithBestModel, GenerateOptions } from './modelRegistry';

export interface KDPMetadata {
    title: string;
    subtitle: string;
    author: string;
    description: string; // Book blurb (max 4000 chars)
    keywords: string[]; // Exactly 7 keywords
    categories: string[]; // Up to 2 BISAC categories
    language: string;
    ageRange?: string;
    seriesName?: string;
    seriesNumber?: number;
}

export interface CoverSpecs {
    trimSize: string;
    spineWidth: number;
    coverWidth: number;
    coverHeight: number;
    dpi: number;
}

// Common KDP trim sizes (in inches)
const TRIM_SIZES: Record<string, { width: number; height: number }> = {
    '5x8': { width: 5, height: 8 },
    '5.25x8': { width: 5.25, height: 8 },
    '5.5x8.5': { width: 5.5, height: 8.5 },
    '6x9': { width: 6, height: 9 },
    '7x10': { width: 7, height: 10 },
    '8x10': { width: 8, height: 10 },
    '8.5x11': { width: 8.5, height: 11 }
};

// BISAC Categories for books
const POPULAR_CATEGORIES = [
    'FICTION / General',
    'FICTION / Fantasy / General',
    'FICTION / Science Fiction / General',
    'FICTION / Romance / General',
    'FICTION / Thrillers / General',
    'FICTION / Mystery & Detective / General',
    'SELF-HELP / General',
    'SELF-HELP / Personal Growth / General',
    'SELF-HELP / Motivational & Inspirational',
    'BUSINESS & ECONOMICS / General',
    'BIOGRAPHY & AUTOBIOGRAPHY / General',
    'PSYCHOLOGY / General',
    'RELIGION / Spirituality',
    'HEALTH & FITNESS / General',
    'PHILOSOPHY / General',
    'HISTORY / General',
    'SCIENCE / General',
    'EDUCATION / General',
    'FAMILY & RELATIONSHIPS / General',
    'COOKING / General'
];

/**
 * Calculate cover dimensions based on page count
 */
export const calculateCoverSpecs = (
    pageCount: number,
    trimSize: string = '6x9',
    paperType: 'white' | 'cream' = 'cream'
): CoverSpecs => {
    const size = TRIM_SIZES[trimSize] || TRIM_SIZES['6x9'];

    // Spine width calculation (approximate)
    // White paper: 0.002252" per page, Cream: 0.0025" per page
    const pageThickness = paperType === 'white' ? 0.002252 : 0.0025;
    const spineWidth = pageCount * pageThickness;

    // Cover dimensions at 300 DPI
    const dpi = 300;
    const bleed = 0.125; // Standard bleed

    const coverWidth = (size.width * 2) + spineWidth + (bleed * 2);
    const coverHeight = size.height + (bleed * 2);

    return {
        trimSize,
        spineWidth: Math.round(spineWidth * 100) / 100,
        coverWidth: Math.round(coverWidth * dpi),
        coverHeight: Math.round(coverHeight * dpi),
        dpi
    };
};

/**
 * Generate 7 SEO-optimized keywords using AI
 */
export const generateKeywords = async (
    title: string,
    description: string,
    genre: string
): Promise<string[]> => {
    const prompt = `Generate exactly 7 Amazon KDP keywords for a book with the following details:

Title: ${title}
Genre: ${genre}
Description: ${description}

Requirements:
- Each keyword can be up to 50 characters
- Use a mix of broad and specific terms
- Include genre-related terms
- Consider what readers would search for
- Make them SEO-optimized for Amazon search

Return ONLY a JSON array of 7 keyword strings, nothing else.
Example: ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7"]`;

    try {
        const result = await generateWithBestModel(prompt, 'writing', {
            responseFormat: 'json',
            temperature: 0.7
        });

        const keywords = JSON.parse(result.text);
        return Array.isArray(keywords) ? keywords.slice(0, 7) : [];
    } catch (error) {
        console.error('Error generating keywords:', error);
        // Fallback keywords
        return [
            genre.toLowerCase(),
            `${genre} books`,
            `best ${genre}`,
            title.split(' ')[0].toLowerCase(),
            'new release',
            'bestseller',
            '2024 books'
        ];
    }
};

/**
 * Generate book description/blurb using AI
 */
export const generateBlurb = async (
    title: string,
    description: string,
    genre: string,
    maxChars: number = 4000
): Promise<string> => {
    const prompt = `Write a compelling Amazon book description (blurb) for:

Title: ${title}
Genre: ${genre}
Summary: ${description}

Requirements:
- Maximum ${maxChars} characters
- Hook the reader in the first line
- Build intrigue without spoilers
- Include emotional appeal
- End with a call-to-action
- Use HTML formatting allowed by Amazon: <b>, <i>, <br>, <h2>
- Break into paragraphs for readability

Write ONLY the blurb, no other text.`;

    try {
        const result = await generateWithBestModel(prompt, 'writing', {
            temperature: 0.8,
            maxTokens: 1000
        });

        return result.text.substring(0, maxChars);
    } catch (error) {
        console.error('Error generating blurb:', error);
        return description;
    }
};

/**
 * Suggest categories based on content
 */
export const suggestCategories = async (
    description: string,
    genre: string
): Promise<string[]> => {
    const prompt = `Based on this book description and genre, suggest the 2 most appropriate BISAC categories:

Genre: ${genre}
Description: ${description}

Available categories:
${POPULAR_CATEGORIES.join('\n')}

Return ONLY a JSON array with exactly 2 category strings from the list above.`;

    try {
        const result = await generateWithBestModel(prompt, 'writing', {
            responseFormat: 'json',
            temperature: 0.3
        });

        const categories = JSON.parse(result.text);
        return Array.isArray(categories) ? categories.slice(0, 2) : [POPULAR_CATEGORIES[0]];
    } catch (error) {
        console.error('Error suggesting categories:', error);
        return [POPULAR_CATEGORIES[0]];
    }
};

/**
 * Generate complete KDP metadata
 */
export const generateKDPMetadata = async (
    bookMetadata: BookMetadata
): Promise<KDPMetadata> => {
    const [keywords, blurb, categories] = await Promise.all([
        generateKeywords(bookMetadata.title, bookMetadata.description, bookMetadata.genre),
        generateBlurb(bookMetadata.title, bookMetadata.description, bookMetadata.genre),
        suggestCategories(bookMetadata.description, bookMetadata.genre)
    ]);

    return {
        title: bookMetadata.title,
        subtitle: bookMetadata.subtitle || '',
        author: bookMetadata.author,
        description: blurb,
        keywords,
        categories,
        language: bookMetadata.language || 'en'
    };
};

/**
 * Validate KDP metadata
 */
export const validateKDPMetadata = (metadata: KDPMetadata): {
    valid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    if (!metadata.title || metadata.title.length > 200) {
        errors.push('Title is required and must be under 200 characters');
    }

    if (metadata.subtitle && metadata.subtitle.length > 200) {
        errors.push('Subtitle must be under 200 characters');
    }

    if (!metadata.author) {
        errors.push('Author is required');
    }

    if (!metadata.description || metadata.description.length > 4000) {
        errors.push('Description is required and must be under 4000 characters');
    }

    if (metadata.keywords.length !== 7) {
        errors.push('Exactly 7 keywords are required');
    }

    if (metadata.categories.length < 1 || metadata.categories.length > 2) {
        errors.push('1-2 categories are required');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Format metadata for KDP submission
 */
export const formatForKDP = (metadata: KDPMetadata): string => {
    return `
=== AMAZON KDP METADATA ===

TITLE: ${metadata.title}
SUBTITLE: ${metadata.subtitle || 'N/A'}
AUTHOR: ${metadata.author}
LANGUAGE: ${metadata.language}

CATEGORIES:
${metadata.categories.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}

KEYWORDS:
${metadata.keywords.map((k, i) => `  ${i + 1}. ${k}`).join('\n')}

DESCRIPTION:
${metadata.description}

================================
  `.trim();
};

export { POPULAR_CATEGORIES, TRIM_SIZES };

export default {
    calculateCoverSpecs,
    generateKeywords,
    generateBlurb,
    suggestCategories,
    generateKDPMetadata,
    validateKDPMetadata,
    formatForKDP
};
