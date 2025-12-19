import React, { useState, useCallback } from 'react';
import {
    FileText, Image, MessageSquare, Music, Video, Link2,
    BookOpen, PenTool, Plus, Sparkles, Trash2, ChevronRight,
    Upload, Zap, Brain
} from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { FileDropzone } from '../ui/FileDropzone';
import { InputType, InputItem, InputStatus, InputHubState, GUIDELINE_PRESETS } from '../../types/inputs';
import { scrapeUrl } from '../../services/urlScraper';

const generateId = () => Math.random().toString(36).substr(2, 9);

const INPUT_CATEGORIES = [
    { type: InputType.DOCUMENT, icon: FileText, label: 'Documents', color: 'text-blue-400', accept: '.pdf,.docx,.txt,.md,.rtf' },
    { type: InputType.IMAGE, icon: Image, label: 'Images', color: 'text-purple-400', accept: 'image/*' },
    { type: InputType.CONVERSATION, icon: MessageSquare, label: 'AI Chats', color: 'text-green-400', accept: '.json,.txt' },
    { type: InputType.AUDIO, icon: Music, label: 'Audio', color: 'text-yellow-400', accept: 'audio/*' },
    { type: InputType.VIDEO, icon: Video, label: 'Video', color: 'text-pink-400', accept: 'video/*' },
    { type: InputType.URL, icon: Link2, label: 'URLs', color: 'text-cyan-400', accept: '' },
    { type: InputType.GUIDELINE, icon: BookOpen, label: 'Guidelines', color: 'text-orange-400', accept: '' },
    { type: InputType.NOTE, icon: PenTool, label: 'Notes', color: 'text-indigo-400', accept: '' }
];

interface InputHubProps {
    state: InputHubState;
    onStateChange: (state: InputHubState) => void;
    onSynthesize: () => void;
    isSynthesizing?: boolean;
}

export const InputHub: React.FC<InputHubProps> = ({
    state,
    onStateChange,
    onSynthesize,
    isSynthesizing = false
}) => {
    const [activeTab, setActiveTab] = useState<InputType>(InputType.DOCUMENT);
    const [urlInput, setUrlInput] = useState('');
    const [noteInput, setNoteInput] = useState('');
    const [selectedGuidelines, setSelectedGuidelines] = useState<string[]>([]);
    const [customGuideline, setCustomGuideline] = useState('');

    const activeCategory = INPUT_CATEGORIES.find(c => c.type === activeTab)!;

    const addItem = useCallback((item: Omit<InputItem, 'id' | 'createdAt'>) => {
        const newItem: InputItem = {
            ...item,
            id: generateId(),
            createdAt: Date.now()
        };
        onStateChange({
            ...state,
            items: [...state.items, newItem]
        });
    }, [state, onStateChange]);

    const removeItem = useCallback((id: string) => {
        onStateChange({
            ...state,
            items: state.items.filter(item => item.id !== id)
        });
    }, [state, onStateChange]);

    const handleFilesSelected = useCallback((files: File[]) => {
        files.forEach(file => {
            const reader = new FileReader();
            const isImage = file.type.startsWith('image/');
            const isPdf = file.type === 'application/pdf';

            reader.onload = (e) => {
                const result = e.target?.result as string || '';

                // For images and PDFs, we keep the base64 data
                // For text files, we keep the text content
                let content = result;
                let rawContent = undefined;

                if (isImage || isPdf) {
                    content = isImage ? result : `[PDF: ${file.name}]`; // Placeholder content for display
                    rawContent = result; // Full base64 string
                }

                addItem({
                    type: isImage ? InputType.IMAGE : (isPdf ? InputType.DOCUMENT : activeTab),
                    name: file.name,
                    content: content,
                    rawContent: rawContent,
                    metadata: {
                        fileType: file.type,
                        fileSize: file.size
                    },
                    status: InputStatus.READY
                });
            };

            if (isImage || isPdf) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    }, [activeTab, addItem]);

    const handleAddUrl = useCallback(async () => {
        if (!urlInput.trim()) return;

        const newItemId = generateId();
        const urlToScrape = urlInput;

        // 1. Add item immediately as PROCESSING
        const newItem: InputItem = {
            id: newItemId,
            type: InputType.URL,
            name: urlToScrape,
            content: '',
            metadata: { url: urlToScrape },
            status: InputStatus.PROCESSING,
            createdAt: Date.now()
        };

        // Optimistic update
        const updatedItems = [...state.items, newItem];
        onStateChange({ ...state, items: updatedItems });
        setUrlInput('');

        try {
            // 2. Scrape content
            const scraped = await scrapeUrl(urlToScrape);

            // 3. Update item with result
            onStateChange({
                ...state,
                items: updatedItems.map(item =>
                    item.id === newItemId
                        ? {
                            ...item,
                            name: scraped.title || item.name,
                            content: scraped.content,
                            metadata: {
                                ...item.metadata,
                                title: scraped.title,
                                description: scraped.description,
                                imageUrl: scraped.image
                            },
                            status: InputStatus.READY
                        }
                        : item
                )
            });
        } catch (error) {
            console.error('Scraping failed:', error);
            // Update to error state
            onStateChange({
                ...state,
                items: updatedItems.map(item =>
                    item.id === newItemId
                        ? { ...item, status: InputStatus.ERROR, content: 'Failed to fuzzy fetch content.' }
                        : item
                )
            });
        }
    }, [urlInput, state, onStateChange]);

    const handleAddNote = useCallback(() => {
        if (!noteInput.trim()) return;
        addItem({
            type: InputType.NOTE,
            name: `Note ${state.items.filter(i => i.type === InputType.NOTE).length + 1}`,
            content: noteInput,
            metadata: {},
            status: InputStatus.READY
        });
        setNoteInput('');
    }, [noteInput, addItem, state.items]);

    const handleAddGuideline = useCallback((guideline: string) => {
        if (selectedGuidelines.includes(guideline)) {
            setSelectedGuidelines(prev => prev.filter(g => g !== guideline));
        } else {
            setSelectedGuidelines(prev => [...prev, guideline]);
            addItem({
                type: InputType.GUIDELINE,
                name: guideline.substring(0, 40) + '...',
                content: guideline,
                metadata: { category: 'custom' },
                status: InputStatus.READY
            });
        }
    }, [selectedGuidelines, addItem]);

    const handleAddCustomGuideline = useCallback(() => {
        if (!customGuideline.trim()) return;
        handleAddGuideline(customGuideline);
        setCustomGuideline('');
    }, [customGuideline, handleAddGuideline]);

    const itemsByType = state.items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
    }, {} as Record<InputType, number>);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white font-display">Input Hub</h2>
                        <p className="text-xs text-gray-500">The Brain Dump Zone</p>
                    </div>
                </div>
                <p className="text-sm text-gray-400 mt-3">
                    Drop in everything related to your creation. The AI will synthesize it all.
                </p>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 p-2 mx-4 mt-4 bg-white/[0.02] rounded-xl overflow-x-auto">
                {INPUT_CATEGORIES.map(category => {
                    const Icon = category.icon;
                    const count = itemsByType[category.type] || 0;
                    const isActive = activeTab === category.type;

                    return (
                        <button
                            key={category.type}
                            onClick={() => setActiveTab(category.type)}
                            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                transition-all duration-200 whitespace-nowrap
                ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                                }
              `}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? category.color : ''}`} />
                            <span>{category.label}</span>
                            {count > 0 && (
                                <span className={`
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${isActive ? 'bg-white/20' : 'bg-white/10'}
                `}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 overflow-y-auto">
                {/* File Upload Categories */}
                {[InputType.DOCUMENT, InputType.IMAGE, InputType.CONVERSATION, InputType.AUDIO, InputType.VIDEO].includes(activeTab) && (
                    <FileDropzone
                        onFilesSelected={handleFilesSelected}
                        accept={activeCategory.accept}
                        label={`Drop ${activeCategory.label.toLowerCase()} here`}
                        sublabel="PDF, DOCX, TXT, MD, and more"
                    />
                )}

                {/* URL Input */}
                {activeTab === InputType.URL && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="Paste a URL to analyze..."
                                className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                            />
                            <button
                                onClick={handleAddUrl}
                                disabled={!urlInput.trim()}
                                className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Add articles, blog posts, Wikipedia pages, or any web content for the AI to analyze.
                        </p>
                    </div>
                )}

                {/* Guidelines */}
                {activeTab === InputType.GUIDELINE && (
                    <div className="space-y-6">
                        {/* Preset Guidelines */}
                        {Object.entries(GUIDELINE_PRESETS).map(([category, guidelines]) => (
                            <div key={category}>
                                <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-mono">
                                    {category}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {guidelines.map(guideline => {
                                        const isSelected = state.items.some(i => i.content === guideline);
                                        return (
                                            <button
                                                key={guideline}
                                                onClick={() => handleAddGuideline(guideline)}
                                                className={`
                          px-3 py-1.5 rounded-lg text-xs transition-all
                          ${isSelected
                                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                                        : 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:border-white/10'
                                                    }
                        `}
                                            >
                                                {guideline}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Custom Guideline */}
                        <div>
                            <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-mono">
                                Custom
                            </h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customGuideline}
                                    onChange={(e) => setCustomGuideline(e.target.value)}
                                    placeholder="Add your own guideline..."
                                    className="flex-1 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomGuideline()}
                                />
                                <button
                                    onClick={handleAddCustomGuideline}
                                    disabled={!customGuideline.trim()}
                                    className="px-3 py-2 bg-white/10 rounded-xl text-white disabled:opacity-50 hover:bg-white/15 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes */}
                {activeTab === InputType.NOTE && (
                    <div className="space-y-4">
                        <textarea
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="Dump your thoughts, ideas, fragments... anything goes!"
                            className="w-full h-40 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none"
                        />
                        <button
                            onClick={handleAddNote}
                            disabled={!noteInput.trim()}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Note
                        </button>
                    </div>
                )}

                {/* Items List */}
                {state.items.filter(i => i.type === activeTab).length > 0 && (
                    <div className="mt-6 space-y-2">
                        <h4 className="text-xs uppercase tracking-widest text-gray-500 font-mono mb-3">
                            Added Items
                        </h4>
                        {state.items.filter(i => i.type === activeTab).map(item => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-white/10 transition-colors group"
                            >
                                <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${activeCategory.color}`}>
                                    <activeCategory.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-200 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {item.status === InputStatus.READY ? 'Ready' : item.status}
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Synthesize Button */}
            <div className="p-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">
                        {state.items.length} items ready
                    </span>
                    {state.synthesisResult && (
                        <span className="text-xs text-green-400">
                            ✓ Synthesized
                        </span>
                    )}
                </div>
                <button
                    onClick={onSynthesize}
                    disabled={state.items.length === 0 || isSynthesizing}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-3 group"
                >
                    {isSynthesizing ? (
                        <>
                            <Zap className="w-5 h-5 animate-pulse" />
                            Synthesizing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                            Synthesize All Inputs
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default InputHub;
