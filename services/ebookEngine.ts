// ============================================
// EBOOK ENGINE
// Professional HTML5 eBook generation
// ============================================

import { ContentBlock, BlockType, Blueprint } from '../types';
import { BookMetadata, ChapterMetadata } from './workspaceManager';

export interface EbookOptions {
    format: 'html' | 'kindle' | 'epub' | 'print';
    includeTableOfContents: boolean;
    includeCoverPage: boolean;
    chapterBreaks: boolean;
    fontFamily?: string;
    fontSize?: string;
}

const DEFAULT_OPTIONS: EbookOptions = {
    format: 'html',
    includeTableOfContents: true,
    includeCoverPage: true,
    chapterBreaks: true,
    fontFamily: "'Crimson Pro', Georgia, serif",
    fontSize: '16px'
};

/**
 * Generate CSS based on format
 */
const generateStyles = (options: EbookOptions): string => {
    const baseStyles = `
    :root {
      --font-body: ${options.fontFamily};
      --font-size: ${options.fontSize};
      --color-text: #1a1a1a;
      --color-heading: #0a0a0a;
      --color-accent: #6366f1;
      --max-width: 42em;
      --line-height: 1.8;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html {
      font-size: var(--font-size);
    }
    
    body {
      font-family: var(--font-body);
      line-height: var(--line-height);
      color: var(--color-text);
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 2rem;
      background: #fff;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-body);
      color: var(--color-heading);
      margin-top: 2em;
      margin-bottom: 0.5em;
      line-height: 1.3;
    }
    
    h1 { font-size: 2.5em; text-align: center; margin-top: 0; }
    h2 { font-size: 1.8em; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.3em; }
    h3 { font-size: 1.4em; }
    
    p {
      margin-bottom: 1em;
      text-align: justify;
      text-indent: 1.5em;
    }
    
    p:first-of-type { text-indent: 0; }
    
    blockquote {
      margin: 1.5em 2em;
      padding-left: 1em;
      border-left: 3px solid var(--color-accent);
      font-style: italic;
      color: #555;
    }
    
    .cover-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      page-break-after: always;
    }
    
    .cover-title {
      font-size: 3em;
      margin-bottom: 0.5em;
    }
    
    .cover-subtitle {
      font-size: 1.5em;
      color: #666;
      margin-bottom: 2em;
    }
    
    .cover-author {
      font-size: 1.2em;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    .toc {
      page-break-after: always;
      padding: 2em 0;
    }
    
    .toc h2 {
      text-align: center;
      border: none;
    }
    
    .toc-list {
      list-style: none;
      padding: 0;
    }
    
    .toc-item {
      display: flex;
      align-items: baseline;
      margin: 0.5em 0;
    }
    
    .toc-title {
      flex: 1;
    }
    
    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #ccc;
      margin: 0 0.5em;
    }
    
    .chapter {
      page-break-before: always;
      padding-top: 3em;
    }
    
    .chapter-number {
      text-align: center;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #888;
      margin-bottom: 0.5em;
    }
    
    .chapter-title {
      text-align: center;
      margin-bottom: 2em;
    }
    
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1.5em auto;
    }
    
    @media print {
      body { padding: 0; }
      .chapter { page-break-before: always; }
      .cover-page { page-break-after: always; }
      .toc { page-break-after: always; }
    }
  `;

    // Format-specific overrides
    const formatOverrides: Record<string, string> = {
        kindle: `
      body { font-size: 100%; }
      .chapter { page-break-before: always; }
    `,
        epub: `
      body { margin: 1em; padding: 0; }
    `,
        print: `
      @page { margin: 1in; }
      body { font-size: 11pt; }
    `
    };

    return `<style>${baseStyles}${formatOverrides[options.format] || ''}</style>`;
};

/**
 * Generate cover page HTML
 */
const generateCoverPage = (metadata: BookMetadata): string => {
    return `
    <div class="cover-page">
      <h1 class="cover-title">${metadata.title}</h1>
      ${metadata.subtitle ? `<p class="cover-subtitle">${metadata.subtitle}</p>` : ''}
      <p class="cover-author">${metadata.author}</p>
    </div>
  `;
};

/**
 * Generate table of contents
 */
const generateTableOfContents = (chapters: ChapterMetadata[]): string => {
    const items = chapters.map((ch, _i) => `
    <li class="toc-item">
      <span class="toc-title">
        <a href="#chapter-${ch.id}">Chapter ${ch.number}: ${ch.title}</a>
      </span>
      <span class="toc-dots"></span>
    </li>
  `).join('');

    return `
    <nav class="toc">
      <h2>Table of Contents</h2>
      <ol class="toc-list">${items}</ol>
    </nav>
  `;
};

/**
 * Convert markdown to HTML (basic)
 */
const markdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Blockquotes
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');

    // Paragraphs
    html = html.split('\n\n').map(para => {
        if (para.trim().startsWith('<')) return para;
        return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return html;
};

/**
 * Generate chapter HTML
 */
const generateChapterHtml = (
    block: ContentBlock,
    chapterNumber: number,
    title: string
): string => {
    const content = typeof block.content === 'string'
        ? markdownToHtml(block.content)
        : '';

    return `
    <section class="chapter" id="chapter-${block.id}">
      <p class="chapter-number">Chapter ${chapterNumber}</p>
      <h2 class="chapter-title">${title}</h2>
      <div class="chapter-content">${content}</div>
    </section>
  `;
};

/**
 * Generate full eBook HTML
 */
export const generateEbook = (
    blocks: ContentBlock[],
    metadata: BookMetadata,
    blueprint?: Blueprint,
    options: Partial<EbookOptions> = {}
): string => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Build chapters from blocks
    const chapters: { block: ContentBlock; title: string; number: number }[] = [];

    blocks.forEach((block, index) => {
        if (block.type === BlockType.CHAPTER || block.type === BlockType.TEXT) {
            const sectionInfo = blueprint?.sections?.[index];
            chapters.push({
                block,
                title: block.metadata?.title || sectionInfo?.title || `Chapter ${chapters.length + 1}`,
                number: chapters.length + 1
            });
        }
    });

    // Generate HTML
    const styles = generateStyles(opts);
    const coverPage = opts.includeCoverPage ? generateCoverPage(metadata) : '';
    const toc = opts.includeTableOfContents ? generateTableOfContents(
        chapters.map(c => ({
            id: c.block.id,
            number: c.number,
            title: c.title,
            wordCount: c.block.content?.length || 0,
            status: 'complete' as const,
            lastModified: Date.now()
        }))
    ) : '';

    const chaptersHtml = chapters.map(c =>
        generateChapterHtml(c.block, c.number, c.title)
    ).join('\n');

    return `<!DOCTYPE html>
<html lang="${metadata.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title}</title>
  <meta name="author" content="${metadata.author}">
  <meta name="description" content="${metadata.description}">
  <meta name="keywords" content="${metadata.keywords.join(', ')}">
  <meta name="generator" content="Vibe Creation Studio">
  <!-- Dublin Core Metadata -->
  <meta name="DC.title" content="${metadata.title}">
  <meta name="DC.creator" content="${metadata.author}">
  <meta name="DC.subject" content="${metadata.genre}">
  <meta name="DC.description" content="${metadata.description}">
  <meta name="DC.language" content="${metadata.language || 'en'}">
  ${styles}
</head>
<body>
  ${coverPage}
  ${toc}
  <main>
    ${chaptersHtml}
  </main>
</body>
</html>`;
};

/**
 * Calculate word count for content
 */
export const calculateWordCount = (content: string): number => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Calculate reading time in minutes
 */
export const calculateReadingTime = (wordCount: number, wpm: number = 200): number => {
    return Math.ceil(wordCount / wpm);
};

export default {
    generateEbook,
    generateStyles,
    generateCoverPage,
    generateTableOfContents,
    markdownToHtml,
    calculateWordCount,
    calculateReadingTime
};
