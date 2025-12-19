import React, { useState, useEffect } from 'react';
import {
    BookOpen, CheckCircle, Circle, Clock,
    Plus, Trash2, Edit3, Save, ChevronDown,
    ChevronRight, FileText, ListChecks, AlertCircle
} from 'lucide-react';
import { GlassPanel } from './ui/GlassPanel';
import { ProgressBar } from './ui/ProgressBar';
import {
    WorkspaceState,
    initializeWorkspace,
    addChapter,
    updateTaskProgress,
    getProgressSummary,
    ChapterMetadata
} from '../services/workspaceManager';

interface WorkspacePanelProps {
    projectName: string;
    onWorkspaceChange?: (workspace: WorkspaceState) => void;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
    projectName,
    onWorkspaceChange
}) => {
    const [workspace, setWorkspace] = useState<WorkspaceState>(() =>
        initializeWorkspace(projectName)
    );
    const [activeTab, setActiveTab] = useState<'chapters' | 'tasks' | 'plan'>('chapters');
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [isAddingChapter, setIsAddingChapter] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['chapters']));

    useEffect(() => {
        setWorkspace(initializeWorkspace(projectName));
    }, [projectName]);

    useEffect(() => {
        onWorkspaceChange?.(workspace);
    }, [workspace, onWorkspaceChange]);

    const progress = getProgressSummary(workspace);

    const handleAddChapter = () => {
        if (newChapterTitle.trim()) {
            const updated = addChapter(workspace, newChapterTitle.trim());
            setWorkspace({ ...updated });
            setNewChapterTitle('');
            setIsAddingChapter(false);
        }
    };

    const handleUpdateStatus = (chapterId: string, status: ChapterMetadata['status']) => {
        const updated = updateTaskProgress(workspace, chapterId, status);
        setWorkspace({ ...updated });
    };

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const getStatusIcon = (status: ChapterMetadata['status']) => {
        switch (status) {
            case 'complete':
                return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'in-progress':
                return <Clock className="w-4 h-4 text-amber-400 animate-pulse" />;
            case 'review':
                return <AlertCircle className="w-4 h-4 text-blue-400" />;
            default:
                return <Circle className="w-4 h-4 text-gray-500" />;
        }
    };

    const statusOptions: ChapterMetadata['status'][] = ['draft', 'in-progress', 'review', 'complete'];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-white font-display">{workspace.config.name}</h2>
                        <p className="text-xs text-gray-500">Workspace Manager</p>
                    </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                            {progress.complete} of {progress.total} chapters complete
                        </span>
                        <span className="text-violet-400 font-mono">{progress.percentComplete}%</span>
                    </div>
                    <ProgressBar progress={progress.percentComplete} variant="default" showLabel={false} />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-2 mx-4 mt-4 bg-white/[0.02] rounded-xl">
                {[
                    { id: 'chapters', label: 'Chapters', icon: <ListChecks className="w-4 h-4" /> },
                    { id: 'tasks', label: 'Tasks', icon: <CheckCircle className="w-4 h-4" /> },
                    { id: 'plan', label: 'Plan', icon: <FileText className="w-4 h-4" /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center
              ${activeTab === tab.id
                                ? 'bg-violet-500/20 text-violet-300'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                            }
            `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
                {activeTab === 'chapters' && (
                    <div className="space-y-3">
                        {/* Chapters List */}
                        {workspace.metadata.chapters.map((chapter, index) => (
                            <div
                                key={chapter.id}
                                className="animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <GlassPanel
                                    variant="subtle"
                                    padding="md"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="pt-1">
                                            {getStatusIcon(chapter.status)}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 font-mono">
                                                    Ch. {chapter.number}
                                                </span>
                                                <h4 className="text-sm font-medium text-white">{chapter.title}</h4>
                                            </div>

                                            <div className="flex items-center gap-2 mt-2">
                                                {statusOptions.map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleUpdateStatus(chapter.id, status)}
                                                        className={`
                            px-2 py-0.5 text-[10px] rounded-md transition-all uppercase tracking-wider
                            ${chapter.status === status
                                                                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                                                : 'bg-white/[0.02] text-gray-500 border border-white/[0.06] hover:border-white/10'
                                                            }
                          `}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </GlassPanel>
                            </div>
                        ))}

                        {/* Add Chapter */}
                        {isAddingChapter ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newChapterTitle}
                                    onChange={(e) => setNewChapterTitle(e.target.value)}
                                    placeholder="Chapter title..."
                                    className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
                                />
                                <button
                                    onClick={handleAddChapter}
                                    className="px-4 py-2 bg-violet-500 rounded-xl text-white text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingChapter(true)}
                                className="w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-500 text-sm hover:border-violet-500/30 hover:text-violet-400 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Chapter
                            </button>
                        )}
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="space-y-2">
                        <GlassPanel variant="card" padding="md">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                                {workspace.taskMd}
                            </pre>
                        </GlassPanel>
                    </div>
                )}

                {activeTab === 'plan' && (
                    <div className="space-y-2">
                        <GlassPanel variant="card" padding="md">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                                {workspace.implementationPlan}
                            </pre>
                        </GlassPanel>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspacePanel;
