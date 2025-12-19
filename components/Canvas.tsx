import React, { useState } from 'react';
import { Project, ContentBlock, BlockType, BlockStatus, EditorAction } from '../types';
import { Edit3, Image as ImageIcon, Move, Plus, Wand2, X, Check, Clock, AlertCircle, BookOpen, FileText, Download, Printer, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import ReactMarkdown from 'react-markdown';

// Enhanced Status badge component with glow
const StatusBadge: React.FC<{ status: BlockStatus }> = ({ status }) => {
  const configs: Record<BlockStatus, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
    [BlockStatus.DRAFT]: {
      icon: <Edit3 className="w-2.5 h-2.5" />,
      color: 'text-gray-300',
      bgColor: 'bg-gray-500/10 border-gray-500/20',
      label: 'Draft'
    },
    [BlockStatus.PENDING_REVIEW]: {
      icon: <Clock className="w-2.5 h-2.5" />,
      color: 'text-amber-300',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      label: 'Review'
    },
    [BlockStatus.APPROVED]: {
      icon: <Check className="w-2.5 h-2.5" />,
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      label: 'OK'
    },
    [BlockStatus.NEEDS_REVISION]: {
      icon: <AlertCircle className="w-2.5 h-2.5" />,
      color: 'text-orange-300',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
      label: 'Edit'
    }
  };

  const config = configs[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] uppercase tracking-wider font-semibold border ${config.color} ${config.bgColor} transition-all duration-200 hover:scale-105`}>
      {config.icon}
      {config.label}
    </span>
  );
};

interface CanvasProps {
  project: Project | null;
  onUpdateBlock: (blockId: string, content: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onAddBlock: (type: BlockType) => void;
  onAutoExpand: (blockId: string) => void;
  onMagicEdit?: (blockId: string, action: EditorAction) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  project,
  onUpdateBlock,
  onRemoveBlock,
  onAddBlock,
  onAutoExpand,
  onMagicEdit
}) => {
  const [readMode, setReadMode] = useState(false);
  const [activeMagicBlock, setActiveMagicBlock] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#050507] to-[#0a0a12] text-gray-500">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/[0.05] flex items-center justify-center mb-6 animate-glow-pulse">
          <Wand2 className="w-9 h-9 text-indigo-400/60" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Select or create a project</p>
        <p className="text-xs text-gray-600 mt-1">to begin your creative journey</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleMagicAction = (blockId: string, action: EditorAction) => {
    if (onMagicEdit) {
      onMagicEdit(blockId, action);
      setActiveMagicBlock(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-[#050507] to-[#08080c] overflow-hidden relative print:bg-white print:text-black">
      {/* Canvas Header - Premium Design */}
      <div className="h-16 border-b border-white/[0.06] flex items-center justify-between px-8 bg-gradient-to-r from-[#0a0a12]/80 to-[#0f0f18]/80 backdrop-blur-xl z-10 sticky top-0 print:hidden">
        <div>
          <h1 className="text-xl font-serif italic text-white font-display">{project.title}</h1>
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {project.blocks.length} Blocks • Auto-saving
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReadMode(!readMode)}
            icon={readMode ? <Edit3 className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
          >
            {readMode ? 'Edit Mode' : 'Read Mode'}
          </Button>
          <div className="h-4 w-px bg-white/10 my-auto mx-2" />
          <Button variant="ghost" size="sm" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Canvas Content */}
      <div className="flex-1 overflow-y-auto p-8 sm:p-12 md:p-16 scroll-smooth print:p-0 print:overflow-visible">
        <div className="max-w-4xl mx-auto space-y-8 min-h-[500px] pb-20 print:space-y-4">

          {project.blocks.length === 0 && (
            <div className="border-2 border-dashed border-vibe-800 rounded-xl p-12 text-center">
              <p className="text-gray-500 mb-4">Empty canvas.</p>
              <div className="flex justify-center gap-4">
                <Button variant="secondary" size="sm" onClick={() => onAddBlock(BlockType.TEXT)}>Add Text</Button>
                <Button variant="secondary" size="sm" onClick={() => onAddBlock(BlockType.IMAGE)}>Add Image</Button>
              </div>
            </div>
          )}

          {project.blocks.map((block, index) => (
            <div
              key={block.id}
              className={`group relative rounded-lg transition-all duration-300 ${!readMode ? 'hover:bg-vibe-900/30 p-2 -mx-2' : ''} print:p-0`}
            >
              {/* Block Controls - Only visible in Edit Mode */}
              {!readMode && (
                <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-vibe-800 rounded-bl-lg px-2 py-1 shadow-lg z-20 print:hidden">
                  {/* Status Badge */}
                  {block.status && <StatusBadge status={block.status} />}

                  {block.type === BlockType.TEXT && (
                    <div className="relative">
                      <button
                        onClick={() => setActiveMagicBlock(activeMagicBlock === block.id ? null : block.id)}
                        className={`p-1.5 hover:text-vibe-accent ${activeMagicBlock === block.id ? 'text-vibe-accent' : 'text-gray-400'}`}
                        title="Magic Edit"
                      >
                        <Wand2 className="w-3 h-3" />
                      </button>

                      {/* Magic Menu */}
                      {activeMagicBlock === block.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-vibe-700 rounded-xl shadow-2xl p-1 z-30 flex flex-col gap-1">
                          <button onClick={() => handleMagicAction(block.id, 'expand')} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-vibe-800 rounded-lg w-full text-left">
                            <Plus className="w-3 h-3" /> Expand
                          </button>
                          <button onClick={() => handleMagicAction(block.id, 'rewrite')} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-vibe-800 rounded-lg w-full text-left">
                            <Edit3 className="w-3 h-3" /> Rewrite
                          </button>
                          <button onClick={() => handleMagicAction(block.id, 'shorten')} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-vibe-800 rounded-lg w-full text-left">
                            <ChevronDown className="w-3 h-3" /> Shorten
                          </button>
                          <div className="h-px bg-white/10 my-1" />
                          <button onClick={() => handleMagicAction(block.id, 'grammar')} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-vibe-800 rounded-lg w-full text-left">
                            <Check className="w-3 h-3" /> Fix Grammar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => onRemoveBlock(block.id)}
                    className="p-1.5 hover:text-red-400 text-gray-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Block Content */}
              {block.type === BlockType.TEXT ? (
                readMode ? (
                  <div className="prose prose-invert prose-lg max-w-none font-serif leading-loose text-gray-300 print:text-black">
                    <ReactMarkdown>{typeof block.content === 'string' ? block.content : ''}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      value={typeof block.content === 'string' ? block.content : ''}
                      onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                      className="w-full bg-transparent text-gray-300 font-serif text-lg leading-loose resize-none focus:outline-none focus:ring-0 p-4 border-l-2 border-transparent focus:border-vibe-600 transition-colors"
                      placeholder="Write something... or ask the vibe to create it."
                      rows={Math.max(3, (typeof block.content === 'string' ? block.content : '').split('\n').length)}
                    />
                  </div>
                )
              ) : block.type === BlockType.IMAGE ? (
                <div className={`relative rounded-lg overflow-hidden border border-vibe-800 bg-black aspect-video flex items-center justify-center transition-colors ${!readMode ? 'group-hover:border-vibe-600' : ''}`}>
                  {block.content ? (
                    <img src={block.content} alt="Visual block" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-600">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Waiting for generation...</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}

          {/* Add Block Trigger - Hidden in Print */}
          {!readMode && (
            <div className="h-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 print:hidden">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onAddBlock(BlockType.TEXT)} icon={<Plus className="w-3 h-3" />}>Text</Button>
                <Button variant="ghost" size="sm" onClick={() => onAddBlock(BlockType.IMAGE)} icon={<ImageIcon className="w-3 h-3" />}>Visual</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};