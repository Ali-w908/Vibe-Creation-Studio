import React from 'react';
import { Project } from '../types';
import { Plus, Book, Image as ImageIcon, Layout, Trash2 } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, 
  activeId, 
  onSelect, 
  onCreate,
  onDelete
}) => {
  return (
    <div className="flex flex-col h-full bg-vibe-900 border-r border-vibe-700 w-64 p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold font-mono tracking-tighter text-white">
          <span className="text-vibe-accent">VIBE</span>.STUDIO
        </h1>
      </div>

      <button 
        onClick={onCreate}
        className="flex items-center justify-center w-full py-3 mb-6 rounded-xl border border-dashed border-vibe-600 text-vibe-glow hover:border-vibe-accent hover:bg-vibe-800 transition-all group"
      >
        <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
        New Creation
      </button>

      <div className="space-y-1 overflow-y-auto flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Projects</h3>
        {projects.map(project => (
          <div 
            key={project.id}
            onClick={() => onSelect(project.id)}
            className={`
              group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors
              ${activeId === project.id ? 'bg-vibe-800 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-vibe-800/50'}
            `}
          >
            <div className="flex items-center overflow-hidden">
              <Book className="w-4 h-4 mr-3 flex-shrink-0 opacity-70" />
              <span className="truncate text-sm font-medium">{project.title}</span>
            </div>
            <button 
              onClick={(e) => onDelete(project.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {projects.length === 0 && (
          <div className="text-center py-10 text-gray-600 text-xs">
            No active vibes. <br/>Start creating.
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-vibe-700">
        <div className="flex items-center text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
          Gemini 2.5 Active
        </div>
      </div>
    </div>
  );
};