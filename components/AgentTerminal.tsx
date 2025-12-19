import React, { useEffect, useRef } from 'react';
import { AgentLog } from '../types';
import { Terminal, Cpu, PenTool, Eye, CheckCircle, Database } from 'lucide-react';

interface AgentTerminalProps {
  logs: AgentLog[];
}

export const AgentTerminal: React.FC<AgentTerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (role: string) => {
    switch (role) {
      case 'ARCHITECT': return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'WRITER': return <PenTool className="w-4 h-4 text-emerald-400" />;
      case 'VISIONARY': return <Eye className="w-4 h-4 text-purple-400" />;
      case 'CRITIC': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'INTEGRATOR': return <Database className="w-4 h-4 text-gray-400" />;
      default: return <Terminal className="w-4 h-4 text-gray-400" />;
    }
  };

  const getColor = (role: string) => {
    switch (role) {
      case 'ARCHITECT': return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
      case 'WRITER': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
      case 'VISIONARY': return 'text-purple-400 border-purple-400/20 bg-purple-400/5';
      case 'CRITIC': return 'text-blue-400 border-blue-400/20 bg-blue-400/5';
      case 'INTEGRATOR': return 'text-gray-300 border-gray-400/20 bg-gray-400/5';
      default: return 'text-gray-400';
    }
  };

  if (logs.length === 0) return null;

  return (
    <div className="flex flex-col border-t border-vibe-700 bg-[#0a0a0f] max-h-64 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center px-4 py-2 border-b border-vibe-800 bg-vibe-900/50 backdrop-blur">
        <Terminal className="w-3 h-3 text-vibe-glow mr-2" />
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Agent Swarm Uplink</span>
      </div>
      
      <div className="overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {logs.map((log) => (
          <div key={log.id} className="relative pl-6">
            {/* Timeline Line */}
            <div className="absolute left-2 top-2 bottom-[-12px] w-px bg-vibe-800 last:hidden"></div>
            
            <div className={`flex items-start gap-3`}>
               <div className={`mt-0.5 relative z-10 rounded-full bg-[#0a0a0f] p-1 ring-1 ring-inset ${getColor(log.agent).split(' ')[1]}`}>
                 {getIcon(log.agent)}
               </div>
               
               <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                   <span className={`font-bold ${getColor(log.agent).split(' ')[0]}`}>{log.agent}</span>
                   <span className="text-gray-600 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                 </div>
                 <div className="text-gray-300 leading-relaxed">
                   {log.message}
                 </div>
                 
                 {log.metadata && (
                   <div className="mt-2 p-2 rounded bg-vibe-800/30 border border-vibe-800 text-gray-500 text-[10px] whitespace-pre-wrap font-mono">
                     <span className="text-vibe-glow/50 opacity-50 block mb-1">DATA_PACKET // HELPER_SCRIPT</span>
                     {log.metadata}
                   </div>
                 )}
               </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};