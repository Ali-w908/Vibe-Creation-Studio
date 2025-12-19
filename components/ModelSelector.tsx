import React from 'react';
import { ModelProvider, ModelConfig } from '../types';
import { getAllModels, getAvailableProviders } from '../services/providers';
import { Cpu, Zap, Brain, Sparkles, ChevronDown } from 'lucide-react';

interface ModelSelectorProps {
    selectedProvider: ModelProvider | 'auto';
    onSelectProvider: (provider: ModelProvider | 'auto') => void;
    compact?: boolean;
}

const PROVIDER_ICONS: Record<ModelProvider | 'auto', React.ReactNode> = {
    auto: <Sparkles className="w-4 h-4" />,
    [ModelProvider.GEMINI]: <Sparkles className="w-4 h-4" />,
    [ModelProvider.GROQ]: <Zap className="w-4 h-4" />,
    [ModelProvider.DEEPSEEK]: <Brain className="w-4 h-4" />,
    [ModelProvider.MISTRAL]: <Cpu className="w-4 h-4" />,
    [ModelProvider.OPENROUTER]: <Cpu className="w-4 h-4" />,
    [ModelProvider.HUGGINGFACE]: <Cpu className="w-4 h-4" />
};

const PROVIDER_COLORS: Record<ModelProvider | 'auto', string> = {
    auto: 'text-vibe-accent',
    [ModelProvider.GEMINI]: 'text-blue-400',
    [ModelProvider.GROQ]: 'text-orange-400',
    [ModelProvider.DEEPSEEK]: 'text-purple-400',
    [ModelProvider.MISTRAL]: 'text-cyan-400',
    [ModelProvider.OPENROUTER]: 'text-green-400',
    [ModelProvider.HUGGINGFACE]: 'text-yellow-400'
};

const PROVIDER_NAMES: Record<ModelProvider | 'auto', string> = {
    auto: 'Auto (Best for Task)',
    [ModelProvider.GEMINI]: 'Gemini',
    [ModelProvider.GROQ]: 'Groq (Ultra Fast)',
    [ModelProvider.DEEPSEEK]: 'DeepSeek (Reasoning)',
    [ModelProvider.MISTRAL]: 'Mistral (Quality)',
    [ModelProvider.OPENROUTER]: 'OpenRouter',
    [ModelProvider.HUGGINGFACE]: 'Hugging Face'
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedProvider,
    onSelectProvider,
    compact = false
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const availableProviders = getAvailableProviders();

    const allOptions: (ModelProvider | 'auto')[] = [
        'auto',
        ...Object.values(ModelProvider)
    ];

    const handleSelect = (provider: ModelProvider | 'auto') => {
        onSelectProvider(provider);
        setIsOpen(false);
    };

    const isProviderAvailable = (provider: ModelProvider | 'auto'): boolean => {
        if (provider === 'auto') return availableProviders.length > 0;
        return availableProviders.includes(provider);
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-vibe-800/60 hover:bg-vibe-700 
          border border-vibe-700 hover:border-vibe-600
          transition-all duration-200
          ${compact ? 'text-xs' : 'text-sm'}
        `}
            >
                <span className={PROVIDER_COLORS[selectedProvider]}>
                    {PROVIDER_ICONS[selectedProvider]}
                </span>
                {!compact && (
                    <span className="text-gray-300">
                        {PROVIDER_NAMES[selectedProvider]}
                    </span>
                )}
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute top-full left-0 mt-2 w-64 bg-vibe-900 border border-vibe-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-2">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 px-3 py-2">
                                Select AI Provider
                            </p>

                            {allOptions.map((provider) => {
                                const available = isProviderAvailable(provider);
                                return (
                                    <button
                                        key={provider}
                                        onClick={() => available && handleSelect(provider)}
                                        disabled={!available}
                                        className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-150
                      ${selectedProvider === provider
                                                ? 'bg-vibe-accent/20 text-vibe-accent'
                                                : available
                                                    ? 'hover:bg-vibe-800 text-gray-300'
                                                    : 'opacity-40 cursor-not-allowed text-gray-500'
                                            }
                    `}
                                    >
                                        <span className={available ? PROVIDER_COLORS[provider] : 'text-gray-600'}>
                                            {PROVIDER_ICONS[provider]}
                                        </span>
                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-medium">
                                                {PROVIDER_NAMES[provider]}
                                            </div>
                                            {!available && provider !== 'auto' && (
                                                <div className="text-[10px] text-gray-600">
                                                    API key not configured
                                                </div>
                                            )}
                                        </div>
                                        {selectedProvider === provider && (
                                            <div className="w-2 h-2 rounded-full bg-vibe-accent" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer hint */}
                        <div className="border-t border-vibe-800 px-4 py-3 bg-vibe-800/30">
                            <p className="text-[10px] text-gray-500">
                                Add API keys in <code className="text-vibe-accent">.env.local</code> to enable more providers
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ModelSelector;
