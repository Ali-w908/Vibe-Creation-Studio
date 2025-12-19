import React, { useState } from 'react';
import {
    BookOpen, Sparkles, Tag, List, FileText,
    Copy, Check, AlertCircle, Loader2, RefreshCw,
    Package, Ruler
} from 'lucide-react';
import { GlassPanel } from './ui/GlassPanel';
import { ProgressBar } from './ui/ProgressBar';
import {
    generateKDPMetadata,
    validateKDPMetadata,
    formatForKDP,
    calculateCoverSpecs,
    KDPMetadata,
    POPULAR_CATEGORIES
} from '../services/kdpHelper';
import { BookMetadata } from '../services/workspaceManager';

interface KDPPanelProps {
    bookMetadata: BookMetadata;
    onMetadataUpdate?: (metadata: KDPMetadata) => void;
}

export const KDPPanel: React.FC<KDPPanelProps> = ({
    bookMetadata,
    onMetadataUpdate
}) => {
    const [kdpMetadata, setKdpMetadata] = useState<KDPMetadata | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'metadata' | 'cover' | 'preview'>('metadata');
    const [pageCount, setPageCount] = useState(200);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            const metadata = await generateKDPMetadata(bookMetadata);

            clearInterval(progressInterval);
            setProgress(100);
            setKdpMetadata(metadata);
            onMetadataUpdate?.(metadata);
        } catch (error) {
            console.error('Error generating KDP metadata:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (kdpMetadata) {
            navigator.clipboard.writeText(formatForKDP(kdpMetadata));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const validation = kdpMetadata ? validateKDPMetadata(kdpMetadata) : null;
    const coverSpecs = calculateCoverSpecs(pageCount);

    const tabs = [
        { id: 'metadata', label: 'Metadata', icon: <Tag className="w-4 h-4" /> },
        { id: 'cover', label: 'Cover Specs', icon: <Ruler className="w-4 h-4" /> },
        { id: 'preview', label: 'Preview', icon: <FileText className="w-4 h-4" /> }
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white font-display">KDP Helper</h2>
                        <p className="text-xs text-gray-500">Amazon Publishing Tools</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-2 mx-4 mt-4 bg-white/[0.02] rounded-xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id
                                ? 'bg-orange-500/20 text-orange-300'
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
                {activeTab === 'metadata' && (
                    <div className="space-y-4">
                        {/* Generate Button */}
                        {!kdpMetadata && !isGenerating && (
                            <button
                                onClick={handleGenerate}
                                disabled={!bookMetadata.title}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-3"
                            >
                                <Sparkles className="w-5 h-5" />
                                Generate KDP Metadata
                            </button>
                        )}

                        {/* Progress */}
                        {isGenerating && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-orange-300">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Generating metadata...</span>
                                </div>
                                <ProgressBar progress={progress} variant="warning" />
                            </div>
                        )}

                        {/* Generated Metadata */}
                        {kdpMetadata && (
                            <div className="space-y-4 animate-fade-in-up">
                                {/* Validation Status */}
                                <div className={`p-3 rounded-xl border ${validation?.valid
                                        ? 'bg-emerald-500/10 border-emerald-500/20'
                                        : 'bg-amber-500/10 border-amber-500/20'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        {validation?.valid ? (
                                            <Check className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-amber-400" />
                                        )}
                                        <span className={`text-sm font-medium ${validation?.valid ? 'text-emerald-300' : 'text-amber-300'
                                            }`}>
                                            {validation?.valid ? 'Metadata is valid' : 'Some issues found'}
                                        </span>
                                    </div>
                                    {validation?.errors.map((error, i) => (
                                        <p key={i} className="text-xs text-amber-400/80 mt-1 pl-6">{error}</p>
                                    ))}
                                </div>

                                {/* Keywords */}
                                <div className="space-y-2">
                                    <h4 className="text-xs uppercase tracking-widest text-gray-500 font-mono">
                                        Keywords (7)
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {kdpMetadata.keywords.map((keyword, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 bg-orange-500/10 text-orange-300 text-xs rounded-lg border border-orange-500/20"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="space-y-2">
                                    <h4 className="text-xs uppercase tracking-widest text-gray-500 font-mono">
                                        Categories
                                    </h4>
                                    {kdpMetadata.categories.map((cat, i) => (
                                        <div key={i} className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg">
                                            <List className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-300">{cat}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Description Preview */}
                                <div className="space-y-2">
                                    <h4 className="text-xs uppercase tracking-widest text-gray-500 font-mono">
                                        Description ({kdpMetadata.description.length}/4000)
                                    </h4>
                                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.06] max-h-40 overflow-y-auto">
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                            {kdpMetadata.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="flex-1 py-2 bg-white/10 rounded-xl text-white text-sm font-medium hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy All'}
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        className="px-4 py-2 bg-white/10 rounded-xl text-white text-sm font-medium hover:bg-white/15 transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'cover' && (
                    <div className="space-y-4">
                        {/* Page Count Input */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-mono">
                                Page Count
                            </label>
                            <input
                                type="number"
                                value={pageCount}
                                onChange={(e) => setPageCount(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-orange-500 focus:outline-none"
                            />
                        </div>

                        {/* Cover Specs */}
                        <GlassPanel variant="card" padding="lg">
                            <h4 className="text-sm font-semibold text-white mb-4">Cover Dimensions</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/[0.02] rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Trim Size</p>
                                    <p className="text-lg font-mono text-orange-300">{coverSpecs.trimSize}</p>
                                </div>
                                <div className="p-3 bg-white/[0.02] rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Spine Width</p>
                                    <p className="text-lg font-mono text-orange-300">{coverSpecs.spineWidth}"</p>
                                </div>
                                <div className="p-3 bg-white/[0.02] rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Cover Width</p>
                                    <p className="text-lg font-mono text-orange-300">{coverSpecs.coverWidth}px</p>
                                </div>
                                <div className="p-3 bg-white/[0.02] rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Cover Height</p>
                                    <p className="text-lg font-mono text-orange-300">{coverSpecs.coverHeight}px</p>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 mt-4">
                                At {coverSpecs.dpi} DPI • Includes 0.125" bleed
                            </p>
                        </GlassPanel>
                    </div>
                )}

                {activeTab === 'preview' && kdpMetadata && (
                    <div className="space-y-4">
                        <GlassPanel variant="card" padding="lg">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                                {formatForKDP(kdpMetadata)}
                            </pre>
                        </GlassPanel>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KDPPanel;
