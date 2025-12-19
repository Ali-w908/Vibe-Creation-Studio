import React, { useMemo } from 'react';
import { ProjectVersion } from '../../types';
import { Clock, RotateCcw, Trash2, Tag, Save } from 'lucide-react';

interface VersionHistoryPanelProps {
    versions: ProjectVersion[];
    onRestore: (version: ProjectVersion) => void;
    onDelete: (versionId: string) => void;
    onClose: () => void;
    onSaveNow: () => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
    versions,
    onRestore,
    onDelete,
    onClose,
    onSaveNow
}) => {
    const sortedVersions = useMemo(() => {
        return [...versions].sort((a, b) => b.timestamp - a.timestamp);
    }, [versions]);

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-white/10 w-80 shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    Version History
                </h2>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    ×
                </button>
            </div>

            <div className="p-4 border-b border-white/5">
                <button
                    onClick={onSaveNow}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
                >
                    <Save className="w-4 h-4" />
                    Create Checkpoint
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sortedVersions.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No saved versions yet.</p>
                    </div>
                ) : (
                    sortedVersions.map(version => (
                        <div
                            key={version.id}
                            className="group bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 rounded-lg p-3 transition-all"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        {version.type === 'manual' ? (
                                            <Tag className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                            <Clock className="w-3 h-3 text-slate-500" />
                                        )}
                                        <span className={`text-sm font-medium ${version.type === 'manual' ? 'text-emerald-300' : 'text-slate-300'}`}>
                                            {version.label}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 ml-5">
                                        {formatDate(version.timestamp)}
                                    </div>
                                </div>

                                <button
                                    onClick={() => onDelete(version.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-all"
                                    title="Delete Snapshot"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="pl-5">
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to restore this version? Current unsaved changes will be lost.')) {
                                            onRestore(version);
                                        }
                                    }}
                                    className="text-xs flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors py-1"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Restore this version
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
