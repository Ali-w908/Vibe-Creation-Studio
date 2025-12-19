import React, { useState } from 'react';
import { ContentBlock, BlockStatus, BlockType } from '../types';
import { Check, Edit3, History, X, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Button } from './ui/Button';

interface ReviewPanelProps {
    blocks: ContentBlock[];
    onApprove: (blockId: string) => void;
    onRequestRevision: (blockId: string, feedback: string) => void;
    onViewHistory: (blockId: string) => void;
    isGenerating: boolean;
}

const STATUS_LABELS: Record<BlockStatus, { label: string; color: string }> = {
    [BlockStatus.DRAFT]: { label: 'Draft', color: 'text-gray-400 bg-gray-800' },
    [BlockStatus.PENDING_REVIEW]: { label: 'Pending Review', color: 'text-yellow-400 bg-yellow-900/30' },
    [BlockStatus.APPROVED]: { label: 'Approved', color: 'text-green-400 bg-green-900/30' },
    [BlockStatus.NEEDS_REVISION]: { label: 'Needs Revision', color: 'text-orange-400 bg-orange-900/30' }
};

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
    [BlockType.TEXT]: '📝 Text',
    [BlockType.IMAGE]: '🖼️ Image',
    [BlockType.NOTE]: '📌 Note',
    [BlockType.CHAPTER]: '📖 Chapter',
    [BlockType.PLAN]: '📋 Plan',
    [BlockType.ARTIFACT]: '📄 Artifact'
};

interface ReviewItemProps {
    block: ContentBlock;
    onApprove: () => void;
    onRequestRevision: (feedback: string) => void;
    onViewHistory: () => void;
    isGenerating: boolean;
}

const ReviewItem: React.FC<ReviewItemProps> = ({
    block,
    onApprove,
    onRequestRevision,
    onViewHistory,
    isGenerating
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);
    const [feedback, setFeedback] = useState('');

    const statusInfo = STATUS_LABELS[block.status];
    const revisionCount = block.revisionHistory?.length || 0;

    const handleSubmitFeedback = () => {
        if (feedback.trim()) {
            onRequestRevision(feedback);
            setFeedback('');
            setShowFeedbackInput(false);
        }
    };

    const getPreview = () => {
        if (block.type === BlockType.IMAGE) {
            return block.content ? '🖼️ [Image generated]' : '⏳ [Awaiting generation]';
        }
        const text = block.content || '';
        return text.substring(0, 150) + (text.length > 150 ? '...' : '');
    };

    return (
        <div className="border border-vibe-700 rounded-lg overflow-hidden bg-vibe-900/50 hover:border-vibe-600 transition-colors">
            {/* Header */}
            <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-vibe-800/30"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">
                            {BLOCK_TYPE_LABELS[block.type]}
                        </span>
                        {block.metadata?.title && (
                            <span className="text-sm font-medium text-gray-200 truncate">
                                {block.metadata.title}
                            </span>
                        )}
                        {block.metadata?.chapterNumber && (
                            <span className="text-xs text-gray-500">
                                Chapter {block.metadata.chapterNumber}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                        {getPreview()}
                    </p>
                </div>

                {/* Status Badge */}
                <div className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider ${statusInfo.color}`}>
                    {statusInfo.label}
                </div>

                {/* Revision Count */}
                {revisionCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <History className="w-3 h-3" />
                        v{revisionCount + 1}
                    </div>
                )}

                {/* Expand Toggle */}
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-vibe-800 p-4 space-y-4">
                    {/* Content Preview */}
                    <div className="bg-vibe-800/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                        {block.type === BlockType.IMAGE && block.content ? (
                            <img
                                src={block.content}
                                alt="Generated"
                                className="max-h-40 rounded-lg mx-auto"
                            />
                        ) : (
                            <p className="text-sm text-gray-300 whitespace-pre-wrap font-serif">
                                {block.content || 'No content yet...'}
                            </p>
                        )}
                    </div>

                    {/* Model Used */}
                    {block.metadata?.modelUsed && (
                        <p className="text-[10px] text-gray-500">
                            Generated by: <span className="text-vibe-accent">{block.metadata.modelUsed}</span>
                        </p>
                    )}

                    {/* Feedback Input */}
                    {showFeedbackInput && (
                        <div className="space-y-2">
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Describe what changes you'd like..."
                                className="w-full bg-vibe-800 border border-vibe-700 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-vibe-accent resize-none"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFeedbackInput(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSubmitFeedback}
                                    disabled={!feedback.trim() || isGenerating}
                                >
                                    Submit Revision
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {!showFeedbackInput && block.status === BlockStatus.PENDING_REVIEW && (
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={onApprove}
                                disabled={isGenerating}
                                icon={<Check className="w-3 h-3" />}
                            >
                                Approve
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowFeedbackInput(true)}
                                disabled={isGenerating}
                                icon={<Edit3 className="w-3 h-3" />}
                            >
                                Request Edit
                            </Button>
                            {revisionCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onViewHistory}
                                    icon={<History className="w-3 h-3" />}
                                >
                                    History
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
    blocks,
    onApprove,
    onRequestRevision,
    onViewHistory,
    isGenerating
}) => {
    const pendingBlocks = blocks.filter(b => b.status === BlockStatus.PENDING_REVIEW);
    const approvedBlocks = blocks.filter(b => b.status === BlockStatus.APPROVED);
    const revisionBlocks = blocks.filter(b => b.status === BlockStatus.NEEDS_REVISION);

    const approveAll = () => {
        pendingBlocks.forEach(block => onApprove(block.id));
    };

    if (blocks.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No content to review yet.</p>
                <p className="text-xs mt-1">Start creating to see items here.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 h-full overflow-y-auto">
            {/* Header Stats */}
            <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs">
                    <span className="text-yellow-400">{pendingBlocks.length} pending</span>
                    <span className="text-green-400">{approvedBlocks.length} approved</span>
                    {revisionBlocks.length > 0 && (
                        <span className="text-orange-400">{revisionBlocks.length} revising</span>
                    )}
                </div>

                {pendingBlocks.length > 1 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={approveAll}
                        disabled={isGenerating}
                    >
                        Approve All
                    </Button>
                )}
            </div>

            {/* Pending Review */}
            {pendingBlocks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-mono">
                        Awaiting Review
                    </h3>
                    {pendingBlocks.map(block => (
                        <ReviewItem
                            key={block.id}
                            block={block}
                            onApprove={() => onApprove(block.id)}
                            onRequestRevision={(feedback) => onRequestRevision(block.id, feedback)}
                            onViewHistory={() => onViewHistory(block.id)}
                            isGenerating={isGenerating}
                        />
                    ))}
                </div>
            )}

            {/* Needs Revision */}
            {revisionBlocks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-widest text-orange-400 font-mono">
                        Being Revised
                    </h3>
                    {revisionBlocks.map(block => (
                        <ReviewItem
                            key={block.id}
                            block={block}
                            onApprove={() => onApprove(block.id)}
                            onRequestRevision={(feedback) => onRequestRevision(block.id, feedback)}
                            onViewHistory={() => onViewHistory(block.id)}
                            isGenerating={isGenerating}
                        />
                    ))}
                </div>
            )}

            {/* Approved */}
            {approvedBlocks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-widest text-green-400 font-mono">
                        Approved
                    </h3>
                    {approvedBlocks.map(block => (
                        <ReviewItem
                            key={block.id}
                            block={block}
                            onApprove={() => onApprove(block.id)}
                            onRequestRevision={(feedback) => onRequestRevision(block.id, feedback)}
                            onViewHistory={() => onViewHistory(block.id)}
                            isGenerating={isGenerating}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewPanel;
