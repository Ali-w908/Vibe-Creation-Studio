import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, MessageRole, AgentLog } from '../types';
import {
  Send, RefreshCw, ThumbsUp, ThumbsDown, Copy, Check,
  ChevronUp, Sparkles, Mic, Plus
} from 'lucide-react';
import { AgentTerminal } from './AgentTerminal';

interface ChatInterfaceProps {
  messages: Message[];
  agentLogs: AgentLog[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  onGenerateImage: (prompt: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  agentLogs,
  onSendMessage,
  isGenerating,
  onGenerateImage
}) => {
  const [input, setInput] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'good' | 'bad'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      if (input.startsWith('/image')) {
        onGenerateImage(input.replace('/image', '').trim());
      } else {
        onSendMessage(input);
      }
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'good' | 'bad') => {
    setFeedbackGiven(prev => ({ ...prev, [id]: type }));
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d14]">
      {/* Minimal Header */}
      <div className="h-11 border-b border-white/[0.06] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-white">Chat</span>
        </div>

        {agentLogs.length > 0 && (
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`text-[10px] px-2 py-1 rounded-md transition-colors ${showTerminal
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            {agentLogs.length} logs
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-indigo-400/70" />
            </div>
            <h3 className="text-sm font-medium text-gray-300 mb-1">Start Creating</h3>
            <p className="text-xs text-gray-500 max-w-[200px]">
              Tell me what you want to build. I'll help you create it.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="group">
                {msg.role === MessageRole.USER ? (
                  // User Message
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  // AI Message
                  <div className="space-y-2">
                    <div className="prose prose-invert prose-sm max-w-none text-gray-200">
                      <ReactMarkdown
                        components={{
                          // Custom code block styling
                          code: ({ node, className, children, ...props }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 text-xs" {...props}>
                                {children}
                              </code>
                            ) : (
                              <code className="block bg-[#0a0a10] border border-white/[0.06] rounded-lg p-3 text-xs overflow-x-auto" {...props}>
                                {children}
                              </code>
                            );
                          },
                          // Table styling
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3">
                              <table className="w-full text-xs border-collapse">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="bg-white/5 px-3 py-2 text-left text-gray-300 border border-white/[0.08]">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3 py-2 border border-white/[0.06] text-gray-400">
                              {children}
                            </td>
                          ),
                          // Links
                          a: ({ href, children }) => (
                            <a href={href} className="text-indigo-400 hover:text-indigo-300 underline" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                          // Lists
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside space-y-1 my-2">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside space-y-1 my-2">
                              {children}
                            </ol>
                          ),
                          // Paragraphs
                          p: ({ children }) => (
                            <p className="my-2 leading-relaxed">
                              {children}
                            </p>
                          ),
                          // Headings
                          h1: ({ children }) => <h1 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-semibold text-white mt-3 mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-200 mt-2 mb-1">{children}</h3>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* Feedback Row (Antigravity style) */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                        title="Copy"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="h-3 w-px bg-white/10" />

                      <button
                        onClick={() => handleFeedback(msg.id, 'good')}
                        className={`p-1 transition-colors ${feedbackGiven[msg.id] === 'good'
                            ? 'text-green-400'
                            : 'text-gray-500 hover:text-gray-300'
                          }`}
                        title="Good response"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleFeedback(msg.id, 'bad')}
                        className={`p-1 transition-colors ${feedbackGiven[msg.id] === 'bad'
                            ? 'text-red-400'
                            : 'text-gray-500 hover:text-gray-300'
                          }`}
                        title="Bad response"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>

                      {feedbackGiven[msg.id] && (
                        <span className="text-[10px] text-gray-500 ml-1">
                          {feedbackGiven[msg.id] === 'good' ? 'Good' : 'Bad'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isGenerating && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Terminal (minimized) */}
      {showTerminal && agentLogs.length > 0 && (
        <div className="border-t border-white/[0.06] max-h-32 overflow-y-auto">
          <AgentTerminal logs={agentLogs} />
        </div>
      )}

      {/* Input Area - Antigravity Style */}
      <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
        {/* Mode Indicator (like Antigravity's Planning indicator) */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
              <Plus className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-gray-600">∧</span>
            <span className="text-[10px] text-gray-500">Creative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-600">∧</span>
            <span className="text-[10px] text-gray-500">Vibe Engine</span>
            <span className="text-[10px] text-gray-600">(Writing)</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2 bg-[#0a0a10] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-indigo-500/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={isGenerating}
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 resize-none focus:outline-none min-h-[24px] max-h-[150px]"
            />

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/5"
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className={`
                  p-1.5 rounded-lg transition-all
                  ${input.trim() && !isGenerating
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : 'text-gray-600'
                  }
                `}
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;