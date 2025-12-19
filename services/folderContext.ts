// ============================================
// FOLDER CONTEXT SYSTEM
// Like Antigravity - full project folder awareness
// ============================================

export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
    lastModified?: number;
    children?: FileNode[];
    content?: string;
}

export interface ProjectContext {
    rootPath: string;
    name: string;
    files: FileNode[];
    totalFiles: number;
    totalSize: number;
    lastScanned: number;
}

export interface VibeConfig {
    name: string;
    description: string;
    genre?: string;
    tone?: string;
    targetAudience?: string;
    author?: string;
    createdAt: number;
    lastModified: number;
    version: string;
}

// Supported file extensions for content indexing
const INDEXABLE_EXTENSIONS = [
    '.md', '.txt', '.html', '.json',
    '.doc', '.docx', '.pdf',
    '.rtf', '.odt'
];

const IGNORED_PATTERNS = [
    'node_modules',
    '.git',
    '.vscode',
    'dist',
    'build',
    '.DS_Store',
    'Thumbs.db'
];

/**
 * Check if a path should be ignored
 */
const shouldIgnore = (name: string): boolean => {
    return IGNORED_PATTERNS.some(pattern => name.includes(pattern));
};

/**
 * Check if a file is indexable for content
 */
const isIndexable = (filename: string): boolean => {
    return INDEXABLE_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));
};

/**
 * Read directory structure recursively using File System Access API
 */
export const scanDirectory = async (
    dirHandle: FileSystemDirectoryHandle,
    basePath: string = ''
): Promise<FileNode[]> => {
    const nodes: FileNode[] = [];

    // Use type assertion for entries() - part of File System Access API
    const entries = (dirHandle as any).entries() as AsyncIterable<[string, FileSystemHandle]>;

    for await (const [name, handle] of entries) {
        if (shouldIgnore(name)) continue;

        const path = basePath ? `${basePath}/${name}` : name;

        if (handle.kind === 'directory') {
            const children = await scanDirectory(handle as FileSystemDirectoryHandle, path);
            nodes.push({
                name,
                path,
                type: 'directory',
                children
            });
        } else {
            const file = await (handle as FileSystemFileHandle).getFile();
            const node: FileNode = {
                name,
                path,
                type: 'file',
                size: file.size,
                lastModified: file.lastModified
            };

            // Load content for indexable files
            if (isIndexable(name) && file.size < 500000) { // Max 500KB
                try {
                    node.content = await file.text();
                } catch (e) {
                    console.warn(`Could not read file: ${path}`);
                }
            }

            nodes.push(node);
        }
    }

    return nodes.sort((a, b) => {
        // Directories first, then alphabetically
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
};

/**
 * Calculate total size and file count
 */
const calculateStats = (nodes: FileNode[]): { totalFiles: number; totalSize: number } => {
    let totalFiles = 0;
    let totalSize = 0;

    const traverse = (items: FileNode[]) => {
        for (const item of items) {
            if (item.type === 'file') {
                totalFiles++;
                totalSize += item.size || 0;
            } else if (item.children) {
                traverse(item.children);
            }
        }
    };

    traverse(nodes);
    return { totalFiles, totalSize };
};

/**
 * Open a folder picker and scan the directory
 */
export const openFolderContext = async (): Promise<ProjectContext | null> => {
    try {
        // Check if File System Access API is supported
        if (!('showDirectoryPicker' in window)) {
            throw new Error('File System Access API not supported in this browser');
        }

        const dirHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite'
        });

        const files = await scanDirectory(dirHandle);
        const stats = calculateStats(files);

        const context: ProjectContext = {
            rootPath: dirHandle.name,
            name: dirHandle.name,
            files,
            ...stats,
            lastScanned: Date.now()
        };

        return context;
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            return null; // User cancelled
        }
        console.error('Error opening folder:', error);
        throw error;
    }
};

/**
 * Find a file by path in the context
 */
export const findFile = (context: ProjectContext, path: string): FileNode | null => {
    const traverse = (nodes: FileNode[]): FileNode | null => {
        for (const node of nodes) {
            if (node.path === path) return node;
            if (node.children) {
                const found = traverse(node.children);
                if (found) return found;
            }
        }
        return null;
    };

    return traverse(context.files);
};

/**
 * Get all files matching a pattern
 */
export const findFilesByPattern = (context: ProjectContext, pattern: RegExp): FileNode[] => {
    const results: FileNode[] = [];

    const traverse = (nodes: FileNode[]) => {
        for (const node of nodes) {
            if (node.type === 'file' && pattern.test(node.name)) {
                results.push(node);
            }
            if (node.children) {
                traverse(node.children);
            }
        }
    };

    traverse(context.files);
    return results;
};

/**
 * Get all content from indexed files
 */
export const getAllIndexedContent = (context: ProjectContext): string => {
    const contents: string[] = [];

    const traverse = (nodes: FileNode[]) => {
        for (const node of nodes) {
            if (node.type === 'file' && node.content) {
                contents.push(`--- ${node.path} ---\n${node.content}`);
            }
            if (node.children) {
                traverse(node.children);
            }
        }
    };

    traverse(context.files);
    return contents.join('\n\n');
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default {
    openFolderContext,
    scanDirectory,
    findFile,
    findFilesByPattern,
    getAllIndexedContent,
    formatFileSize
};
