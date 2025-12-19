// ============================================
// WORKSPACE MANAGER
// Manages .vibe/ project config folder
// Like Antigravity's task.md, implementation_plan.md, etc.
// ============================================

import { ProjectContext, VibeConfig } from './folderContext';

export interface WorkspaceState {
    config: VibeConfig;
    taskMd: string;
    implementationPlan: string;
    walkthrough: string;
    metadata: BookMetadata;
}

export interface BookMetadata {
    title: string;
    subtitle?: string;
    author: string;
    description: string;
    genre: string;
    keywords: string[];
    language: string;
    isbn?: string;
    publishDate?: string;
    chapters: ChapterMetadata[];
}

export interface ChapterMetadata {
    id: string;
    number: number;
    title: string;
    wordCount: number;
    status: 'draft' | 'in-progress' | 'review' | 'complete';
    lastModified: number;
}

// Default templates
const DEFAULT_TASK_MD = `# Book Creation Tasks

## Research & Inputs
- [ ] Gather reference materials
- [ ] Import AI conversations
- [ ] Add notes and guidelines
- [ ] Synthesize all inputs

## Blueprint & Structure
- [ ] Define book concept
- [ ] Create chapter outline
- [ ] Develop character profiles
- [ ] Set tone and style guidelines

## Writing
- [ ] Generate initial drafts
- [ ] Review and approve content
- [ ] Revise as needed

## Finalization
- [ ] Final review pass
- [ ] Export to HTML
- [ ] Generate KDP metadata
- [ ] Create marketing content
`;

const DEFAULT_IMPLEMENTATION_PLAN = `# Book Implementation Plan

## Overview
[Describe your book concept here]

## Target Audience
[Who is this book for?]

## Structure
### Part 1: [Title]
- Chapter 1: [Title]
- Chapter 2: [Title]

### Part 2: [Title]
- Chapter 3: [Title]
- Chapter 4: [Title]

## Style Guidelines
- **Tone**: [e.g., conversational, academic, inspirational]
- **Voice**: [first person, third person]
- **Length**: [target word count]

## Key Themes
1. [Theme 1]
2. [Theme 2]
3. [Theme 3]
`;

const DEFAULT_WALKTHROUGH = `# Book Creation Walkthrough

## Progress Log

### Session 1 - [Date]
- Initialized project
- Set up basic structure

---
*This file tracks your book creation journey*
`;

const DEFAULT_CONFIG: VibeConfig = {
    name: 'New Book Project',
    description: '',
    genre: '',
    tone: '',
    targetAudience: '',
    author: '',
    createdAt: Date.now(),
    lastModified: Date.now(),
    version: '1.0.0'
};

const DEFAULT_METADATA: BookMetadata = {
    title: '',
    author: '',
    description: '',
    genre: '',
    keywords: [],
    language: 'en',
    chapters: []
};

/**
 * Initialize a new .vibe workspace in memory
 */
export const initializeWorkspace = (projectName: string): WorkspaceState => {
    return {
        config: {
            ...DEFAULT_CONFIG,
            name: projectName,
            createdAt: Date.now(),
            lastModified: Date.now()
        },
        taskMd: DEFAULT_TASK_MD,
        implementationPlan: DEFAULT_IMPLEMENTATION_PLAN.replace('[Describe your book concept here]', ''),
        walkthrough: DEFAULT_WALKTHROUGH.replace('[Date]', new Date().toLocaleDateString()),
        metadata: {
            ...DEFAULT_METADATA,
            title: projectName
        }
    };
};

/**
 * Update task.md with chapter progress
 */
export const updateTaskProgress = (
    workspace: WorkspaceState,
    chapterId: string,
    status: ChapterMetadata['status']
): WorkspaceState => {
    const chapter = workspace.metadata.chapters.find(c => c.id === chapterId);
    if (chapter) {
        chapter.status = status;
        chapter.lastModified = Date.now();
    }

    // Regenerate task.md content
    const chapterTasks = workspace.metadata.chapters.map(ch => {
        const checkbox = ch.status === 'complete' ? '[x]' :
            ch.status === 'in-progress' ? '[/]' : '[ ]';
        return `${checkbox} Chapter ${ch.number}: ${ch.title}`;
    }).join('\n');

    workspace.taskMd = `# Book Creation Tasks

## Chapters
${chapterTasks}

## Finalization
- [ ] Final review pass
- [ ] Export to HTML
- [ ] Generate KDP metadata
`;

    workspace.config.lastModified = Date.now();
    return workspace;
};

/**
 * Add chapter to workspace
 */
export const addChapter = (
    workspace: WorkspaceState,
    title: string
): WorkspaceState => {
    const newChapter: ChapterMetadata = {
        id: Math.random().toString(36).substr(2, 9),
        number: workspace.metadata.chapters.length + 1,
        title,
        wordCount: 0,
        status: 'draft',
        lastModified: Date.now()
    };

    workspace.metadata.chapters.push(newChapter);
    workspace.config.lastModified = Date.now();

    return workspace;
};

/**
 * Generate a progress summary
 */
export const getProgressSummary = (workspace: WorkspaceState): {
    total: number;
    complete: number;
    inProgress: number;
    percentComplete: number;
} => {
    const chapters = workspace.metadata.chapters;
    const total = chapters.length;
    const complete = chapters.filter(c => c.status === 'complete').length;
    const inProgress = chapters.filter(c => c.status === 'in-progress').length;

    return {
        total,
        complete,
        inProgress,
        percentComplete: total > 0 ? Math.round((complete / total) * 100) : 0
    };
};

/**
 * Export workspace to JSON for persistence
 */
export const exportWorkspace = (workspace: WorkspaceState): string => {
    return JSON.stringify(workspace, null, 2);
};

/**
 * Import workspace from JSON
 */
export const importWorkspace = (json: string): WorkspaceState => {
    try {
        return JSON.parse(json);
    } catch {
        throw new Error('Invalid workspace JSON');
    }
};

/**
 * Generate walkthrough entry
 */
export const addWalkthroughEntry = (
    workspace: WorkspaceState,
    entry: string
): WorkspaceState => {
    const timestamp = new Date().toLocaleString();
    workspace.walkthrough += `\n### ${timestamp}\n${entry}\n`;
    workspace.config.lastModified = Date.now();
    return workspace;
};

export default {
    initializeWorkspace,
    updateTaskProgress,
    addChapter,
    getProgressSummary,
    exportWorkspace,
    importWorkspace,
    addWalkthroughEntry
};
