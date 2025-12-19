import React, { useState } from 'react';
import {
    Share2, Twitter, Instagram, Linkedin, Hash,
    Calendar, Copy, Check, Loader2, RefreshCw,
    MessageSquare, Image, Sparkles, ChevronRight
} from 'lucide-react';
import { GlassPanel } from './ui/GlassPanel';
import { ProgressBar } from './ui/ProgressBar';
import {
    generatePost,
    generateTwitterThread,
    generateHashtags,
    formatPost,
    SocialPost,
    Platform,
    PLATFORM_LIMITS
} from '../services/socialMediaGenerator';
import { BookMetadata } from '../services/workspaceManager';

interface SocialMediaPanelProps {
    bookMetadata: BookMetadata;
}

const PLATFORMS: { id: Platform; name: string; icon: React.ReactNode; color: string }[] = [
    { id: 'twitter', name: 'X/Twitter', icon: <Twitter className="w-4 h-4" />, color: 'text-sky-400' },
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-4 h-4" />, color: 'text-pink-400' },
    { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="w-4 h-4" />, color: 'text-blue-400' },
];

const POST_TYPES = [
    { id: 'announcement', label: 'Launch Announcement' },
    { id: 'teaser', label: 'Teaser/Hook' },
    { id: 'quote', label: 'Quote/Excerpt' },
    { id: 'behind-the-scenes', label: 'Behind the Scenes' },
    { id: 'review-request', label: 'Review Request' },
];

export const SocialMediaPanel: React.FC<SocialMediaPanelProps> = ({ bookMetadata }) => {
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>('twitter');
    const [selectedType, setSelectedType] = useState('announcement');
    const [generatedPost, setGeneratedPost] = useState<SocialPost | null>(null);
    const [thread, setThread] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'single' | 'thread' | 'hashtags'>('single');

    const handleGeneratePost = async () => {
        setIsGenerating(true);
        try {
            const post = await generatePost(
                bookMetadata,
                selectedPlatform,
                selectedType as any
            );
            setGeneratedPost(post);
        } catch (error) {
            console.error('Error generating post:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateThread = async () => {
        setIsGenerating(true);
        try {
            const tweets = await generateTwitterThread(bookMetadata, 5);
            setThread(tweets);
        } catch (error) {
            console.error('Error generating thread:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const platformLimit = PLATFORM_LIMITS[selectedPlatform];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white font-display">Social Media</h2>
                        <p className="text-xs text-gray-500">Marketing Content Generator</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-2 mx-4 mt-4 bg-white/[0.02] rounded-xl">
                {[
                    { id: 'single', label: 'Single Post', icon: <MessageSquare className="w-4 h-4" /> },
                    { id: 'thread', label: 'Thread', icon: <Twitter className="w-4 h-4" /> },
                    { id: 'hashtags', label: 'Hashtags', icon: <Hash className="w-4 h-4" /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id
                                ? 'bg-pink-500/20 text-pink-300'
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
                {activeTab === 'single' && (
                    <div className="space-y-4">
                        {/* Platform Selection */}
                        <div className="space-y-2">
                            <h4 className="text-xs uppercase tracking-widest text-gray-500 font-mono">
                                Platform
                            </h4>
                            <div className="flex gap-2">
                                {PLATFORMS.map(platform => (
                                    <button
                                        key={platform.id}
                                        onClick={() => setSelectedPlatform(platform.id)}
                                        className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl border transition-all
                      ${selectedPlatform === platform.id
                                                ? `bg-white/10 border-white/20 ${platform.color}`
                                                : 'border-white/[0.06] text-gray-500 hover:border-white/10'
                                            }
                    `}
                                    >
                                        {platform.icon}
                                        <span className="text-sm">{platform.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Post Type */}
                        <div className="space-y-2">
                            <h4 className="text-xs uppercase tracking-widest text-gray-500 font-mono">
                                Post Type
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {POST_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className={`
                      px-3 py-2 rounded-lg text-xs text-left transition-all
                      ${selectedType === type.id
                                                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                                : 'bg-white/[0.02] text-gray-400 border border-white/[0.06] hover:border-white/10'
                                            }
                    `}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGeneratePost}
                            disabled={isGenerating || !bookMetadata.title}
                            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Post
                                </>
                            )}
                        </button>

                        {/* Generated Post */}
                        {generatedPost && (
                            <div className="space-y-3 animate-fade-in-up">
                                <GlassPanel variant="card" padding="md">
                                    <p className="text-sm text-gray-200 whitespace-pre-wrap mb-3">
                                        {generatedPost.content}
                                    </p>

                                    {/* Hashtags */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {generatedPost.hashtags.map((tag, i) => (
                                            <span key={i} className="text-xs text-pink-400">#{tag}</span>
                                        ))}
                                    </div>

                                    {/* Character count */}
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`
                      ${formatPost(generatedPost).length > platformLimit.maxChars
                                                ? 'text-red-400'
                                                : 'text-gray-500'
                                            }
                    `}>
                                            {formatPost(generatedPost).length}/{platformLimit.maxChars}
                                        </span>
                                        <button
                                            onClick={() => handleCopy(formatPost(generatedPost))}
                                            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </GlassPanel>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'thread' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400">
                            Generate a 5-tweet thread to promote your book on Twitter/X.
                        </p>

                        <button
                            onClick={handleGenerateThread}
                            disabled={isGenerating || !bookMetadata.title}
                            className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl text-white font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-sky-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating Thread...
                                </>
                            ) : (
                                <>
                                    <Twitter className="w-4 h-4" />
                                    Generate Thread
                                </>
                            )}
                        </button>

                        {thread.length > 0 && (
                            <div className="space-y-3">
                                {thread.map((tweet, i) => (
                                    <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                                        <GlassPanel variant="card" padding="md">
                                            <div className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-xs text-sky-400 font-mono">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-200">{tweet}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-gray-500">{tweet.length}/280</span>
                                                        <button
                                                            onClick={() => handleCopy(tweet)}
                                                            className="text-xs text-gray-400 hover:text-white"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </GlassPanel>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'hashtags' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400">
                            Platform-optimized hashtags for your book.
                        </p>

                        {PLATFORMS.map(platform => (
                            <HashtagSection
                                key={platform.id}
                                platform={platform}
                                bookMetadata={bookMetadata}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Hashtag Section Component
const HashtagSection: React.FC<{
    platform: typeof PLATFORMS[0];
    bookMetadata: BookMetadata;
}> = ({ platform, bookMetadata }) => {
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const tags = await generateHashtags(bookMetadata, platform.id);
            setHashtags(tags);
        } catch (error) {
            console.error('Error generating hashtags:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(hashtags.map(t => `#${t}`).join(' '));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <GlassPanel variant="subtle" padding="md">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={platform.color}>{platform.icon}</span>
                    <span className="text-sm font-medium text-white">{platform.name}</span>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Generate
                </button>
            </div>

            {hashtags.length > 0 ? (
                <>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {hashtags.map((tag, i) => (
                            <span key={i} className={`text-xs ${platform.color}`}>#{tag}</span>
                        ))}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="text-xs text-gray-500 hover:text-white flex items-center gap-1"
                    >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy all'}
                    </button>
                </>
            ) : (
                <p className="text-xs text-gray-600">Click generate to create hashtags</p>
            )}
        </GlassPanel>
    );
};

export default SocialMediaPanel;
