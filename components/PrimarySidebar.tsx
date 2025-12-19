import React from 'react';
import { X } from 'lucide-react';
import { ActivityView } from './ActivityBar';
import { InputHub } from './InputHub/InputHub';
import { FolderContextPanel } from './FolderContextPanel';
import { WorkspacePanel } from './WorkspacePanel';
import { KDPPanel } from './KDPPanel';
import { SocialMediaPanel } from './SocialMediaPanel';
import { InputHubState } from '../types/inputs';
import { BookMetadata } from '../services/workspaceManager';
import { ProjectContext } from '../services/folderContext';

interface PrimarySidebarProps {
    activeView: ActivityView;
    collapsed?: boolean;

    // Input Hub props
    inputHubState: InputHubState;
    onInputHubStateChange: (state: InputHubState) => void;
    onSynthesize: () => void;
    isSynthesizing: boolean;

    // Folder context props
    onFolderContextLoaded?: (context: ProjectContext) => void;

    // Workspace props
    projectName: string;

    // Book metadata for KDP/Social
    bookMetadata: BookMetadata;
}

export const PrimarySidebar: React.FC<PrimarySidebarProps> = ({
    activeView,
    collapsed = false,
    inputHubState,
    onInputHubStateChange,
    onSynthesize,
    isSynthesizing,
    onFolderContextLoaded,
    projectName,
    bookMetadata
}) => {
    if (collapsed || activeView === 'settings') {
        return null;
    }

    const renderContent = () => {
        switch (activeView) {
            case 'explorer':
                return (
                    <FolderContextPanel
                        onContextLoaded={onFolderContextLoaded}
                    />
                );

            case 'inputhub':
                return (
                    <InputHub
                        state={inputHubState}
                        onStateChange={onInputHubStateChange}
                        onSynthesize={onSynthesize}
                        isSynthesizing={isSynthesizing}
                    />
                );

            case 'workspace':
                return (
                    <WorkspacePanel
                        projectName={projectName}
                    />
                );

            case 'kdp':
                return (
                    <KDPPanel
                        bookMetadata={bookMetadata}
                    />
                );

            case 'social':
                return (
                    <SocialMediaPanel
                        bookMetadata={bookMetadata}
                    />
                );

            default:
                return null;
        }
    };

    const content = renderContent();
    if (!content) return null;

    return (
        <div className="w-80 h-full border-r border-white/[0.06] bg-[rgba(8,8,12,0.95)] backdrop-blur-xl flex flex-col flex-shrink-0 overflow-hidden">
            {content}
        </div>
    );
};

export default PrimarySidebar;
