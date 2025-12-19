// ============================================
// URL SCRAPER SERVICE
// ============================================

export interface ScrapedContent {
    title: string;
    content: string;
    description?: string;
    image?: string;
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
    try {
        // Use a CORS proxy for fetching (allorigins.win is a free public proxy)
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }

        const html = await response.text();
        return parseHtml(html, url);
    } catch (error) {
        console.error('URL extraction error:', error);
        throw error;
    }
}

function parseHtml(html: string, originalUrl: string): ScrapedContent {
    // Basic DOM parsing using DOMParser (browser environment)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract Metadata
    const title = doc.querySelector('title')?.textContent ||
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        originalUrl;

    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        '';

    const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined;

    // cleanup
    const scripts = doc.querySelectorAll('script, style, noscript, iframe, svg');
    scripts.forEach(s => s.remove());

    // Extract main content - simplistic approach
    // In a real app, we might use Readability.js
    const bodyText = doc.body.innerText || doc.body.textContent || '';

    // Clean up whitespace
    const cleanContent = bodyText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n')
        .substring(0, 8000); // Limit context size

    return {
        title: title.trim(),
        description: description.trim(),
        image,
        content: cleanContent
    };
}
