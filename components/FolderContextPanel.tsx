import React, { useState } from 'react';
import {
    Folder, FolderOpen, File, FileText, Image,
    ChevronRight, ChevronDown, RefreshCw, Search,
    HardDrive, Clock, Loader2, AlertCircle
} from 'lucide-react';
import { GlassPanel } from './ui/GlassPanel';
import {
    openFolderContext,
    ProjectContext,
    FileNode,
    formatFileSize,
    findFilesByPattern
} from '../services/folderContext';

interface FolderContextPanelProps {
    onContextLoaded?: (context: ProjectContext) => void;
}

export const FolderContextPanel: React.FC<FolderContextPanelProps> = ({
    onContextLoaded
}) => {
    const [context, setContext] = useState<ProjectContext | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

    const handleOpenFolder = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const ctx = await openFolderContext();
            if (ctx) {
                setContext(ctx);
                onContextLoaded?.(ctx);
                // Auto-expand root level
                setExpandedPaths(new Set(ctx.files.filter(f => f.type === 'directory').map(f => f.path)));
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (path: string) => {
        const newExpanded = new Set(expandedPaths);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedPaths(newExpanded);
    };

    const getFileIcon = (node: FileNode) => {
        if (node.type === 'directory') {
            return expandedPaths.has(node.path)
                ? <FolderOpen className="w-4 h-4 text-amber-400" />
                : <Folder className="w-4 h-4 text-amber-400" />;
        }

        const ext = node.name.split('.').pop()?.toLowerCase();

        switch (ext) {
            case 'md':
            case 'txt':
            case 'doc':
            case 'docx':
                return <FileText className="w-4 h-4 text-blue-400" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return <Image className="w-4 h-4 text-purple-400" />;
            default:
                return <File className="w-4 h-4 text-gray-400" />;
        }
    };

    const filteredFiles = context && searchQuery
        ? findFilesByPattern(context, new RegExp(searchQuery, 'i'))
        : null;

    const renderFileTree = (nodes: FileNode[], depth: number = 0) => {
        return nodes.map(node => (
            <div key={node.path}>
                <div
                    onClick={() => node.type === 'directory' && toggleExpand(node.path)}
                    className={`
            flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer
            hover:bg-white/[0.03] transition-colors
            ${node.content ? 'bg-indigo-500/5 border-l-2 border-indigo-500' : ''}
          `}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                    {node.type === 'directory' && (
                        <span className="w-4 h-4 flex items-center justify-center">
                            {expandedPaths.has(node.path)
                                ? <ChevronDown className="w-3 h-3 text-gray-500" />
                                : <ChevronRight className="w-3 h-3 text-gray-500" />
                            }
                        </span>
                    )}
                    {node.type === 'file' && <span className="w-4" />}

                    {getFileIcon(node)}

                    <span className="text-sm text-gray-300 truncate flex-1">
                        {node.name}
                    </span>

                    {node.type === 'file' && node.size && (
                        <span className="text-xs text-gray-600 font-mono">
                            {formatFileSize(node.size)}
                        </span>
                    )}

                    {node.content && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400" title="Indexed" />
                    )}
                </div>

                {node.type === 'directory' &&
                    node.children &&
                    expandedPaths.has(node.path) &&
                    renderFileTree(node.children, depth + 1)
                }
            </div>
        ));
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white font-display">Folder Context</h2>
                        <p className="text-xs text-gray-500">Project File System</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
                {!context && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                            <Folder className="w-8 h-8 text-emerald-400/50" />
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            Open a folder to get full project context
                        </p>
                        <button
                            onClick={handleOpenFolder}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2"
                        >
                            <FolderOpen className="w-4 h-4" />
                            Open Folder
                        </button>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
                        <p className="text-sm text-gray-400">Scanning folder...</p>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
                        <p className="text-sm text-red-400 mb-4">{error}</p>
                        <button
                            onClick={handleOpenFolder}
                            className="px-4 py-2 bg-white/10 rounded-xl text-white text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {context && (
                    <div className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                            <GlassPanel variant="subtle" padding="sm">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="w-4 h-4 text-emerald-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Size</p>
                                        <p className="text-sm font-mono text-white">
                                            {formatFileSize(context.totalSize)}
                                        </p>
                                    </div>
                                </div>
                            </GlassPanel>

                            <GlassPanel variant="subtle" padding="sm">
                                <div className="flex items-center gap-2">
                                    <File className="w-4 h-4 text-blue-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Files</p>
                                        <p className="text-sm font-mono text-white">{context.totalFiles}</p>
                                    </div>
                                </div>
                            </GlassPanel>

                            <GlassPanel variant="subtle" padding="sm">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-purple-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Scanned</p>
                                        <p className="text-sm font-mono text-white">
                                            {new Date(context.lastScanned).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            </GlassPanel>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search files..."
                                className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        {/* File Tree or Search Results */}
                        <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] max-h-96 overflow-y-auto">
                            {searchQuery && filteredFiles ? (
                                <div className="p-2">
                                    <p className="text-xs text-gray-500 mb-2 px-2">
                                        {filteredFiles.length} results
                                    </p>
                                    {filteredFiles.map(file => (
                                        <div
                                            key={file.path}
                                            className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.03]"
                                        >
                                            {getFileIcon(file)}
                                            <span className="text-sm text-gray-300 truncate">{file.path}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-2">
                                    {renderFileTree(context.files)}
                                </div>
                            )}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={handleOpenFolder}
                            className="w-full py-2 bg-white/5 rounded-xl text-gray-400 text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Open Different Folder
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FolderContextPanel;
