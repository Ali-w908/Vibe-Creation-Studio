import { Project, ContentBlock, BlockType, BlockStatus } from '../types';

// ============================================
// BOOK EXPORTER SERVICE
// ============================================

interface ExportOptions {
    includeMetadata?: boolean;
    includeDrafts?: boolean;
    style?: 'modern' | 'classic' | 'minimal';
    pageSize?: '6x9' | 'a4' | 'letter';
}

// CSS for print-ready eBook styling
const BOOK_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  :root {
    --color-text: #1a1a2e;
    --color-accent: #6366f1;
    --color-muted: #64748b;
    --color-bg: #fefefe;
    --font-serif: 'Crimson Pro', Georgia, serif;
    --font-sans: 'Inter', system-ui, sans-serif;
  }
  
  @media (prefers-color-scheme: dark) {
    :root {
      --color-text: #e2e8f0;
      --color-bg: #0f0f1a;
    }
  }
  
  html {
    font-size: 16px;
  }
  
  body {
    font-family: var(--font-serif);
    font-size: 1.1rem;
    line-height: 1.8;
    color: var(--color-text);
    background: var(--color-bg);
    max-width: 42em;
    margin: 0 auto;
    padding: 2rem;
  }
  
  /* Cover Page */
  .cover {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    page-break-after: always;
  }
  
  .cover h1 {
    font-size: 3rem;
    font-weight: 600;
    margin-bottom: 1rem;
    letter-spacing: -0.02em;
  }
  
  .cover .subtitle {
    font-size: 1.2rem;
    color: var(--color-muted);
    font-style: italic;
  }
  
  .cover .author {
    margin-top: 3rem;
    font-family: var(--font-sans);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-muted);
  }
  
  .cover img {
    max-width: 80%;
    max-height: 50vh;
    border-radius: 8px;
    margin: 2rem 0;
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  }
  
  /* Table of Contents */
  .toc {
    page-break-after: always;
    padding: 3rem 0;
  }
  
  .toc h2 {
    font-size: 1.5rem;
    margin-bottom: 2rem;
    font-family: var(--font-sans);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-muted);
  }
  
  .toc ul {
    list-style: none;
  }
  
  .toc li {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0.5rem 0;
    border-bottom: 1px dotted #ddd;
  }
  
  .toc a {
    color: inherit;
    text-decoration: none;
  }
  
  .toc a:hover {
    color: var(--color-accent);
  }
  
  /* Chapters */
  .chapter {
    page-break-before: always;
    padding-top: 3rem;
  }
  
  .chapter-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .chapter-number {
    font-family: var(--font-sans);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--color-muted);
    margin-bottom: 0.5rem;
  }
  
  .chapter-title {
    font-size: 2rem;
    font-weight: 600;
  }
  
  .chapter-content {
    text-align: justify;
    hyphens: auto;
  }
  
  .chapter-content p {
    margin-bottom: 1.5rem;
    text-indent: 2rem;
  }
  
  .chapter-content p:first-of-type {
    text-indent: 0;
  }
  
  .chapter-content p:first-of-type::first-letter {
    font-size: 3rem;
    float: left;
    line-height: 1;
    padding-right: 0.5rem;
    font-weight: 600;
  }
  
  /* Images */
  .image-block {
    margin: 2rem 0;
    text-align: center;
  }
  
  .image-block img {
    max-width: 100%;
    border-radius: 4px;
  }
  
  .image-block .caption {
    font-size: 0.85rem;
    color: var(--color-muted);
    font-style: italic;
    margin-top: 0.5rem;
  }
  
  /* Text blocks */
  .text-block {
    margin: 1.5rem 0;
  }
  
  /* Headings in content */
  h1, h2, h3, h4 {
    font-family: var(--font-serif);
    margin: 2rem 0 1rem;
  }
  
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
  h4 { font-size: 1.1rem; }
  
  /* Print styles */
  @media print {
    body {
      max-width: none;
      padding: 0;
    }
    
    .cover {
      height: 100vh;
    }
    
    .chapter {
      page-break-before: always;
    }
  }
  
  /* Page size: 6x9 */
  @page {
    size: 6in 9in;
    margin: 0.75in;
  }
`;

// Generate HTML for a single block
function renderBlock(block: ContentBlock, index: number): string {
    switch (block.type) {
        case BlockType.CHAPTER:
            const chapterNum = block.metadata?.chapterNumber || index + 1;
            const chapterTitle = block.metadata?.title || `Chapter ${chapterNum}`;
            return `
        <section class="chapter" id="chapter-${chapterNum}">
          <div class="chapter-header">
            <div class="chapter-number">Chapter ${chapterNum}</div>
            <h1 class="chapter-title">${escapeHtml(chapterTitle)}</h1>
          </div>
          <div class="chapter-content">
            ${markdownToHtml(block.content)}
          </div>
        </section>
      `;

        case BlockType.IMAGE:
            return `
        <div class="image-block">
          <img src="${block.content}" alt="${escapeHtml(block.metadata?.prompt || 'Generated image')}" />
          ${block.metadata?.prompt ? `<div class="caption">${escapeHtml(block.metadata.prompt)}</div>` : ''}
        </div>
      `;

        case BlockType.TEXT:
            return `
        <div class="text-block">
          ${markdownToHtml(block.content)}
        </div>
      `;

        case BlockType.PLAN:
        case BlockType.ARTIFACT:
            return `
        <div class="artifact-block" style="display: none;">
          <!-- ${block.type}: ${escapeHtml(block.content.substring(0, 100))}... -->
        </div>
      `;

        default:
            return `
        <div class="text-block">
          ${markdownToHtml(block.content)}
        </div>
      `;
    }
}

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    let html = escapeHtml(markdown);

    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Paragraphs
    html = html.split('\n\n').map(p => {
        p = p.trim();
        if (!p) return '';
        if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol')) return p;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return html;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Generate table of contents
function generateTOC(blocks: ContentBlock[]): string {
    const chapters = blocks.filter(b => b.type === BlockType.CHAPTER);

    if (chapters.length === 0) return '';

    const items = chapters.map((block, i) => {
        const num = block.metadata?.chapterNumber || i + 1;
        const title = block.metadata?.title || `Chapter ${num}`;
        return `<li><a href="#chapter-${num}">${escapeHtml(title)}</a></li>`;
    }).join('\n');

    return `
    <nav class="toc">
      <h2>Contents</h2>
      <ul>
        ${items}
      </ul>
    </nav>
  `;
}

// Find cover image from blocks
function findCoverImage(blocks: ContentBlock[]): string | null {
    const imageBlock = blocks.find(b => b.type === BlockType.IMAGE && b.content);
    return imageBlock?.content || null;
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export function exportToHtml(project: Project, options: ExportOptions = {}): string {
    const {
        includeMetadata = false,
        includeDrafts = false,
        style = 'modern'
    } = options;

    // Filter blocks
    let blocks = project.blocks;
    if (!includeDrafts) {
        blocks = blocks.filter(b =>
            b.status === BlockStatus.APPROVED ||
            b.status === BlockStatus.PENDING_REVIEW
        );
    }

    // Get cover image
    const coverImage = findCoverImage(blocks);

    // Get metadata
    const author = project.settings?.bookMetadata?.author || 'Unknown Author';
    const genre = project.settings?.bookMetadata?.genre || '';

    // Build HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(project.title)}</title>
  <meta name="author" content="${escapeHtml(author)}">
  <meta name="description" content="${escapeHtml(project.description)}">
  <meta name="generator" content="Vibe Creation Studio">
  <style>
${BOOK_CSS}
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    ${coverImage ? `<img src="${coverImage}" alt="Cover">` : ''}
    <h1>${escapeHtml(project.title)}</h1>
    ${project.description ? `<p class="subtitle">${escapeHtml(project.description)}</p>` : ''}
    <p class="author">by ${escapeHtml(author)}</p>
    ${genre ? `<p class="genre">${escapeHtml(genre)}</p>` : ''}
  </div>
  
  <!-- Table of Contents -->
  ${generateTOC(blocks)}
  
  <!-- Content -->
  <main>
    ${blocks.map((block, i) => renderBlock(block, i)).join('\n')}
  </main>
  
  <!-- Footer -->
  <footer style="text-align: center; margin-top: 4rem; padding: 2rem; color: var(--color-muted); font-size: 0.8rem;">
    <p>Created with Vibe Creation Studio</p>
    <p>${new Date().toLocaleDateString()}</p>
  </footer>
</body>
</html>
  `.trim();

    return html;
}

// ============================================
// DOWNLOAD HELPERS
// ============================================

export function downloadAsHtml(project: Project, options: ExportOptions = {}): void {
    const html = exportToHtml(project, options);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function exportMetadata(project: Project): string {
    const metadata = {
        title: project.title,
        description: project.description,
        author: project.settings?.bookMetadata?.author,
        genre: project.settings?.bookMetadata?.genre,
        targetAudience: project.settings?.bookMetadata?.targetAudience,
        tone: project.settings?.bookMetadata?.tone,
        workflowPhase: project.workflowPhase,
        totalBlocks: project.blocks.length,
        chapters: project.blocks.filter(b => b.type === BlockType.CHAPTER).length,
        images: project.blocks.filter(b => b.type === BlockType.IMAGE).length,
        approvedBlocks: project.blocks.filter(b => b.status === BlockStatus.APPROVED).length,
        lastModified: new Date(project.lastModified).toISOString(),
        exportedAt: new Date().toISOString(),
        revisionHistory: project.blocks.map(block => ({
            blockId: block.id,
            type: block.type,
            status: block.status,
            revisions: block.revisionHistory?.length || 0,
            modelUsed: block.metadata?.modelUsed
        }))
    };

    return JSON.stringify(metadata, null, 2);
}

export function downloadMetadata(project: Project): void {
    const metadata = exportMetadata(project);
    const blob = new Blob([metadata], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_metadata.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
