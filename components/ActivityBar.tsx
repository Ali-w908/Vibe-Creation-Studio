import React from 'react';
import {
    Folder, MessageSquare, BookOpen, Share2, Package,
    Settings, Layers, FileText, Sparkles, History,
    Brain, ChevronLeft, ChevronRight
} from 'lucide-react';

export type ActivityView =
    | 'explorer'
    | 'inputhub'
    | 'workspace'
    | 'kdp'
    | 'social'
    | 'settings';

interface ActivityBarProps {
    activeView: ActivityView;
    onViewChange: (view: ActivityView) => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

interface ActivityItem {
    id: ActivityView;
    icon: React.ReactNode;
    label: string;
    color: string;
}

const ACTIVITY_ITEMS: ActivityItem[] = [
    { id: 'explorer', icon: <Folder className="w-5 h-5" />, label: 'Explorer', color: 'text-amber-400' },
    { id: 'inputhub', icon: <Brain className="w-5 h-5" />, label: 'Input Hub', color: 'text-indigo-400' },
    { id: 'workspace', icon: <Layers className="w-5 h-5" />, label: 'Workspace', color: 'text-violet-400' },
    { id: 'kdp', icon: <Package className="w-5 h-5" />, label: 'KDP Tools', color: 'text-orange-400' },
    { id: 'social', icon: <Share2 className="w-5 h-5" />, label: 'Social Media', color: 'text-pink-400' },
];

const BOTTOM_ITEMS: ActivityItem[] = [
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Settings', color: 'text-gray-400' },
];

export const ActivityBar: React.FC<ActivityBarProps> = ({
    activeView,
    onViewChange,
    collapsed = false,
    onToggleCollapse
}) => {
    return (
        <div className="w-12 h-full bg-[rgba(8,8,12,0.95)] border-r border-white/[0.06] flex flex-col items-center py-2 flex-shrink-0">
            {/* Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-white" />
            </div>

            {/* Divider */}
            <div className="w-6 h-px bg-white/10 mb-2" />

            {/* Main Items */}
            <div className="flex-1 flex flex-col gap-1">
                {ACTIVITY_ITEMS.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`
              relative w-10 h-10 rounded-xl flex items-center justify-center transition-all group
              ${activeView === item.id
                                ? `bg-white/10 ${item.color}`
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }
            `}
                        title={item.label}
                    >
                        {item.icon}

                        {/* Active indicator */}
                        {activeView === item.id && (
                            <div className={`absolute left-0 w-0.5 h-6 rounded-r-full ${item.color.replace('text-', 'bg-')}`} />
                        )}

                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                            {item.label}
                        </div>
                    </button>
                ))}
            </div>

            {/* Bottom Items */}
            <div className="flex flex-col gap-1 mt-auto">
                {/* Collapse Toggle */}
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
                        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                )}

                {BOTTOM_ITEMS.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`
              relative w-10 h-10 rounded-xl flex items-center justify-center transition-all group
              ${activeView === item.id
                                ? 'bg-white/10 text-white'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }
            `}
                        title={item.label}
                    >
                        {item.icon}

                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                            {item.label}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ActivityBar;
