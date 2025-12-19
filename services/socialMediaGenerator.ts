// ============================================
// SOCIAL MEDIA CONTENT GENERATOR
// Marketing content for book promotion
// ============================================

import { BookMetadata } from './workspaceManager';
import { generateWithBestModel } from './modelRegistry';

export type Platform = 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'facebook';

export interface SocialPost {
    id: string;
    platform: Platform;
    content: string;
    hashtags: string[];
    characterCount: number;
    mediaPrompt?: string; // Prompt for generating accompanying image
    scheduledFor?: number;
    status: 'draft' | 'scheduled' | 'published';
}

export interface ContentCalendar {
    posts: SocialPost[];
    startDate: number;
    endDate: number;
}

// Platform-specific limits and requirements
const PLATFORM_LIMITS: Record<Platform, {
    maxChars: number;
    maxHashtags: number;
    bestHashtags: number;
    supportsImages: boolean;
    supportsThreads: boolean;
}> = {
    twitter: { maxChars: 280, maxHashtags: 5, bestHashtags: 2, supportsImages: true, supportsThreads: true },
    instagram: { maxChars: 2200, maxHashtags: 30, bestHashtags: 15, supportsImages: true, supportsThreads: false },
    linkedin: { maxChars: 3000, maxHashtags: 5, bestHashtags: 3, supportsImages: true, supportsThreads: false },
    tiktok: { maxChars: 2200, maxHashtags: 5, bestHashtags: 4, supportsImages: false, supportsThreads: false },
    facebook: { maxChars: 63206, maxHashtags: 10, bestHashtags: 3, supportsImages: true, supportsThreads: false }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Generate hashtags for a platform
 */
export const generateHashtags = async (
    bookMetadata: BookMetadata,
    platform: Platform,
    count?: number
): Promise<string[]> => {
    const limit = PLATFORM_LIMITS[platform];
    const targetCount = count || limit.bestHashtags;

    const prompt = `Generate ${targetCount} hashtags for promoting a ${bookMetadata.genre} book on ${platform}:

Title: ${bookMetadata.title}
Genre: ${bookMetadata.genre}
Description: ${bookMetadata.description}

Requirements:
- Mix of popular and niche hashtags
- Relevant to the book's theme
- Appropriate for ${platform}
- Include at least one trending book hashtag

Return ONLY a JSON array of hashtag strings (without the # symbol).
Example: ["booktok", "newrelease", "mustread"]`;

    try {
        const result = await generateWithBestModel(prompt, 'writing', {
            responseFormat: 'json',
            temperature: 0.7
        });

        const hashtags = JSON.parse(result.text);
        return Array.isArray(hashtags) ? hashtags.slice(0, targetCount) : [];
    } catch (error) {
        console.error('Error generating hashtags:', error);
        return ['books', 'newrelease', 'reading', bookMetadata.genre.toLowerCase().replace(/\s/g, '')];
    }
};

/**
 * Generate a single social media post
 */
export const generatePost = async (
    bookMetadata: BookMetadata,
    platform: Platform,
    postType: 'announcement' | 'quote' | 'behind-the-scenes' | 'teaser' | 'review-request' | 'sale'
): Promise<SocialPost> => {
    const limit = PLATFORM_LIMITS[platform];

    const typePrompts: Record<string, string> = {
        announcement: 'Write an exciting book launch announcement',
        quote: 'Share a powerful quote or excerpt from the book',
        'behind-the-scenes': 'Write a post about the writing process or inspiration',
        teaser: 'Write an intriguing teaser that hooks readers without spoilers',
        'review-request': 'Write a friendly request for reviews from readers',
        sale: 'Write an urgent promotional post about a limited-time offer'
    };

    const prompt = `${typePrompts[postType]} for ${platform}:

Book Title: ${bookMetadata.title}
Author: ${bookMetadata.author}
Genre: ${bookMetadata.genre}
Description: ${bookMetadata.description}

Requirements:
- Maximum ${limit.maxChars - 50} characters (leave room for hashtags)
- Match the tone and style of ${platform}
- Include a call-to-action
- Be engaging and shareable
${platform === 'twitter' ? '- Can use thread format if needed' : ''}
${platform === 'instagram' ? '- Use line breaks for readability' : ''}
${platform === 'linkedin' ? '- Professional but personable tone' : ''}
${platform === 'tiktok' ? '- Casual, energetic, authentic voice' : ''}

Write ONLY the post content, no hashtags or meta text.`;

    try {
        const result = await generateWithBestModel(prompt, 'writing', {
            temperature: 0.8,
            maxTokens: 500
        });

        const content = result.text.trim();
        const hashtags = await generateHashtags(bookMetadata, platform);

        return {
            id: generateId(),
            platform,
            content,
            hashtags,
            characterCount: content.length,
            status: 'draft'
        };
    } catch (error) {
        console.error('Error generating post:', error);
        throw error;
    }
};

/**
 * Generate Twitter thread
 */
export const generateTwitterThread = async (
    bookMetadata: BookMetadata,
    threadLength: number = 5
): Promise<string[]> => {
    const prompt = `Write a ${threadLength}-tweet Twitter thread promoting this book:

Title: ${bookMetadata.title}
Author: ${bookMetadata.author}
Genre: ${bookMetadata.genre}
Description: ${bookMetadata.description}

Requirements:
- Each tweet max 270 characters (leave room for thread numbering)
- First tweet is the hook
- Build interest through the thread
- Last tweet has the call-to-action
- Use engaging, conversational tone

Return ONLY a JSON array of ${threadLength} tweet strings.`;

    try {
        const result = await generateWithBestModel(prompt, 'writing', {
            responseFormat: 'json',
            temperature: 0.8
        });

        const tweets = JSON.parse(result.text);
        return Array.isArray(tweets) ? tweets.slice(0, threadLength) : [];
    } catch (error) {
        console.error('Error generating thread:', error);
        return [];
    }
};

/**
 * Generate a content calendar
 */
export const generateContentCalendar = async (
    bookMetadata: BookMetadata,
    durationDays: number = 14,
    postsPerDay: number = 1
): Promise<ContentCalendar> => {
    const posts: SocialPost[] = [];
    const startDate = Date.now();
    const endDate = startDate + (durationDays * 24 * 60 * 60 * 1000);

    const platforms: Platform[] = ['twitter', 'instagram', 'linkedin', 'facebook'];
    const postTypes: Array<'announcement' | 'quote' | 'teaser' | 'behind-the-scenes' | 'review-request'> =
        ['announcement', 'quote', 'teaser', 'behind-the-scenes', 'review-request'];

    // Generate posts spread across the duration
    for (let day = 0; day < durationDays; day++) {
        for (let i = 0; i < postsPerDay; i++) {
            const platform = platforms[(day + i) % platforms.length];
            const postType = postTypes[(day + i) % postTypes.length];

            try {
                const post = await generatePost(bookMetadata, platform, postType);
                post.scheduledFor = startDate + (day * 24 * 60 * 60 * 1000) + (i * 4 * 60 * 60 * 1000);
                post.status = 'scheduled';
                posts.push(post);
            } catch (error) {
                console.error(`Error generating post for day ${day}:`, error);
            }
        }
    }

    return {
        posts,
        startDate,
        endDate
    };
};

/**
 * Generate image prompt for post
 */
export const generateImagePrompt = async (
    bookMetadata: BookMetadata,
    postContent: string
): Promise<string> => {
    const prompt = `Create an image generation prompt for a social media post about this book:

Book: ${bookMetadata.title} (${bookMetadata.genre})
Post: ${postContent}

Requirements:
- Describe a visually appealing image
- Match the book's genre and mood
- Social media friendly (eye-catching)
- No text in the image
- Photorealistic or artistic style

Write ONLY the image generation prompt, 1-2 sentences.`;

    try {
        const result = await generateWithBestModel(prompt, 'writing', {
            temperature: 0.7,
            maxTokens: 100
        });

        return result.text.trim();
    } catch (error) {
        console.error('Error generating image prompt:', error);
        return `Book cover aesthetic for ${bookMetadata.genre} novel, moody lighting, professional photography`;
    }
};

/**
 * Format post for display with hashtags
 */
export const formatPost = (post: SocialPost): string => {
    const hashtagsStr = post.hashtags.map(h => `#${h}`).join(' ');
    return `${post.content}\n\n${hashtagsStr}`;
};

/**
 * Validate post for platform
 */
export const validatePost = (post: SocialPost): {
    valid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];
    const limit = PLATFORM_LIMITS[post.platform];

    const fullContent = formatPost(post);

    if (fullContent.length > limit.maxChars) {
        errors.push(`Content exceeds ${limit.maxChars} character limit`);
    }

    if (post.hashtags.length > limit.maxHashtags) {
        errors.push(`Too many hashtags (max ${limit.maxHashtags})`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

export { PLATFORM_LIMITS };

export default {
    generateHashtags,
    generatePost,
    generateTwitterThread,
    generateContentCalendar,
    generateImagePrompt,
    formatPost,
    validatePost
};
