import React, { useState } from 'react';
import { VersionHistoryPanel } from './components/VersionHistory/VersionHistoryPanel';
import { saveVersion, getVersions, deleteVersion } from './services/versionControl';
import { ProjectVersion } from './types';
import { ChatInterface } from './components/ChatInterface';
import { Canvas } from './components/Canvas';
import { ModelSelector } from './components/ModelSelector';
import { ReviewPanel } from './components/ReviewPanel';
import { GlassPanel } from './components/ui/GlassPanel';
import { AnimatedBackground } from './components/ui/AnimatedBackground';
import { InputHub } from './components/InputHub/InputHub';
import { BlueprintEditor } from './components/Blueprint/BlueprintEditor';
import { ActivityBar, ActivityView } from './components/ActivityBar';
import { PrimarySidebar } from './components/PrimarySidebar';
import {
  Project, Message, MessageRole, BlockType, ContentBlock, AgentLog, AgentRole,
  ModelProvider, BlockStatus, WorkflowPhase, ProjectSettings, RevisionEntry, Blueprint, EditorAction
} from './types';
import { InputHubState, InputStatus, InputType } from './types/inputs';
import { generateChatMessage, generateBlockContent, suggestImprovement } from './services/geminiService';
import { runMultiAgentWorkflow, refineContent } from './services/agentOrchestrator';
import { downloadAsHtml, downloadMetadata } from './services/bookExporter';
import { synthesizeInputs } from './services/synthesizer';
import { BookMetadata } from './services/workspaceManager';
import { ProjectContext } from './services/folderContext';
import {
  PanelLeftClose, PanelRightClose, Download, FileText,
  BookOpen, ClipboardList, Sparkles, Brain, Zap, Menu, Save, Clock,
  MessageSquare
} from 'lucide-react';

// Import design system
import './styles/design-system.css';

// Initialize AI providers
import './services/providers';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultBlock = (): ContentBlock => ({
  id: generateId(),
  type: BlockType.TEXT,
  content: '# Welcome to Vibe Studio v2.0\n\nYour AI-powered book creation engine. Start by adding inputs to the Input Hub, or just describe what you want to create!',
  status: BlockStatus.APPROVED,
  revisionHistory: []
});

const createDefaultSettings = (): ProjectSettings => ({
  autoSelectModel: true,
  bookMetadata: {
    author: '',
    genre: '',
    targetAudience: '',
    tone: ''
  }
});

const createDefaultInputHubState = (): InputHubState => ({
  items: [],
  isProcessing: false
});

const INITIAL_PROJECT: Project = {
  id: 'demo-1',
  title: 'My New Book',
  description: 'A new creative journey',
  blocks: [createDefaultBlock()],
  lastModified: Date.now(),
  settings: createDefaultSettings(),
  workflowPhase: WorkflowPhase.INPUT_GATHERING
};

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([INITIAL_PROJECT]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(INITIAL_PROJECT.id);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    [INITIAL_PROJECT.id]: [{
      id: generateId(),
      role: MessageRole.MODEL,
      content: "Welcome to **Vibe Studio v2.0** ✨\n\nI'm your AI creative partner. You can:\n• Add inputs to the **Input Hub** (left panel)\n• Or just tell me what you want to create!\n\nWhat shall we build today?",
      timestamp: Date.now()
    }]
  });

  const [agentLogs, setAgentLogs] = useState<Record<string, AgentLog[]>>({});
  const [inputHubStates, setInputHubStates] = useState<Record<string, InputHubState>>({
    [INITIAL_PROJECT.id]: createDefaultInputHubState()
  });

  // UI State - Antigravity Style
  const [activeView, setActiveView] = useState<ActivityView>('inputhub');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [viewMode, setViewMode] = useState<'input' | 'blueprint' | 'canvas'>('input');

  // Folder Context
  const [folderContext, setFolderContext] = useState<ProjectContext | null>(null);

  // Model selection
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider | 'auto'>('auto');

  // Version Control State
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>([]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // Create book metadata from current project
  const bookMetadata: BookMetadata = {
    title: activeProject?.title || 'Untitled',
    author: activeProject?.settings.bookMetadata?.author || 'Unknown Author',
    description: activeProject?.description || '',
    genre: activeProject?.settings.bookMetadata?.genre || 'General',
    language: 'en',
    keywords: [],
    chapters: []
  };

  // Version Control Handlers
  const handleToggleHistory = () => {
    if (!showVersionHistory && activeProject) {
      setProjectVersions(getVersions(activeProject.id));
    }
    setShowVersionHistory(!showVersionHistory);
  };

  const handleSaveVersion = () => {
    if (!activeProject) return;
    try {
      const label = prompt('Name this version (optional):') || 'Manual Save';
      saveVersion(activeProject, 'manual', label);
      setProjectVersions(getVersions(activeProject.id));
      alert('Version saved successfully!');
    } catch (e) {
      alert('Failed to save version. Storage limit may be reached.');
    }
  };

  const handleRestoreVersion = (version: ProjectVersion) => {
    if (!activeProject) return;
    saveVersion(activeProject, 'auto', 'Pre-Restore Backup');
    const restored = { ...version.snapshot, id: activeProject.id };
    setProjects(prev => prev.map(p => p.id === activeProject.id ? restored : p));
    setShowVersionHistory(false);
    alert(`Restored version: ${version.label}`);
  };

  const handleDeleteVersion = (versionId: string) => {
    if (!activeProject) return;
    deleteVersion(activeProject.id, versionId);
    setProjectVersions(getVersions(activeProject.id));
  };

  const currentMessages = activeProjectId ? (messages[activeProjectId] || []) : [];
  const currentLogs = activeProjectId ? (agentLogs[activeProjectId] || []) : [];
  const currentInputHubState = activeProjectId
    ? (inputHubStates[activeProjectId] || createDefaultInputHubState())
    : createDefaultInputHubState();

  const handleCreateProject = () => {
    const newProject: Project = {
      id: generateId(),
      title: 'New Book ' + (projects.length + 1),
      description: '',
      blocks: [],
      lastModified: Date.now(),
      settings: createDefaultSettings(),
      workflowPhase: WorkflowPhase.INPUT_GATHERING
    };
    setProjects([...projects, newProject]);
    setActiveProjectId(newProject.id);
    setMessages(prev => ({
      ...prev,
      [newProject.id]: [{
        id: generateId(),
        role: MessageRole.MODEL,
        content: "New project created! What would you like to create?",
        timestamp: Date.now()
      }]
    }));
    setInputHubStates(prev => ({
      ...prev,
      [newProject.id]: createDefaultInputHubState()
    }));
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    if (activeProjectId === id) {
      setActiveProjectId(newProjects.length > 0 ? newProjects[0].id : null);
    }
  };

  const addAgentLog = (projectId: string, log: AgentLog) => {
    setAgentLogs(prev => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), log]
    }));
  };

  const handleInputHubStateChange = (state: InputHubState) => {
    if (!activeProjectId) return;
    setInputHubStates(prev => ({
      ...prev,
      [activeProjectId]: state
    }));
  };

  const handleFolderContextLoaded = (context: ProjectContext) => {
    setFolderContext(context);
    // Auto-switch to explorer view
    setActiveView('explorer');
  };

  const handleSynthesize = async () => {
    if (!activeProjectId || currentInputHubState.items.length === 0) return;

    setIsSynthesizing(true);

    try {
      const result = await synthesizeInputs(currentInputHubState.items);

      setInputHubStates(prev => ({
        ...prev,
        [activeProjectId]: {
          ...prev[activeProjectId],
          synthesisResult: result,
          lastSynthesized: Date.now()
        }
      }));

      // Add synthesis summary to chat
      const summaryMsg: Message = {
        id: generateId(),
        role: MessageRole.MODEL,
        content: `## 🧠 Synthesis Complete!\n\n**Themes:** ${result.themes.join(', ')}\n\n**Suggested Structure:** ${result.suggestedStructure.chapters?.length || 0} chapters\n\n**Key Ideas:** ${result.keyIdeas.slice(0, 3).join(', ')}...\n\nReady to start creating! Just say "create the book" or refine the structure first.`,
        timestamp: Date.now()
      };

      setMessages(prev => ({
        ...prev,
        [activeProjectId]: [...(prev[activeProjectId] || []), summaryMsg]
      }));

      // AUTO-CREATE BLUEPRINT & SWITCH VIEW
      if (activeProject) {
        const blueprint: Blueprint = {
          title: result.suggestedStructure.title || activeProject.title,
          description: result.contextSummary,
          genre: result.suggestedStructure.genre,
          tone: result.suggestedStructure.tone,
          targetAudience: activeProject.settings.bookMetadata?.targetAudience,
          characters: result.characters.map(c => ({
            id: generateId(),
            name: c.name,
            role: c.role,
            description: c.description,
            traits: c.traits
          })),
          locations: result.locations?.map(l => ({
            id: generateId(),
            name: l.name,
            description: l.description,
            sensoryDetails: l.sensoryDetails
          })) || [],
          items: result.items?.map(i => ({
            id: generateId(),
            name: i.name,
            description: i.description,
            usage: i.usage
          })) || [],
          sections: result.suggestedStructure.chapters.map(ch => ({
            id: generateId(),
            type: 'chapter',
            title: ch.title,
            description: `${ch.summary}\n\nKey Points:\n${ch.keyPoints.map(kp => `- ${kp}`).join('\n')}`
          }))
        };

        const updatedProject = {
          ...activeProject,
          blueprint,
          workflowPhase: WorkflowPhase.PLANNING,
          settings: {
            ...activeProject.settings,
            bookMetadata: {
              ...activeProject.settings.bookMetadata,
              genre: result.suggestedStructure.genre || activeProject.settings.bookMetadata?.genre,
              tone: result.suggestedStructure.tone || activeProject.settings.bookMetadata?.tone
            }
          }
        };

        setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));
        setViewMode('blueprint');
        setActiveView('workspace');
      }

    } catch (error) {
      console.error('Synthesis error:', error);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeProjectId) return;

    const userMsg: Message = { id: generateId(), role: MessageRole.USER, content: text, timestamp: Date.now() };
    const updatedMessages = [...currentMessages, userMsg];

    setMessages(prev => ({ ...prev, [activeProjectId]: updatedMessages }));
    setIsGenerating(true);

    try {
      const lowerText = text.toLowerCase();
      const isCreationRequest = lowerText.includes('create') || lowerText.includes('design') || lowerText.includes('build') || lowerText.includes('write') || lowerText.includes('book') || lowerText.includes('chapter');

      let responseText = "";

      if (isCreationRequest && activeProject) {
        const initialBotMsg: Message = { id: generateId(), role: MessageRole.MODEL, content: "🚀 **Activating Agent Swarm...**\n\nDecomposing your request into tasks.", timestamp: Date.now() };
        setMessages(prev => ({ ...prev, [activeProjectId]: [...updatedMessages, initialBotMsg] }));

        const synthesisContext = currentInputHubState.synthesisResult?.contextSummary || '';
        const guidelines = currentInputHubState.synthesisResult?.guidelines || [];
        const enhancedRequest = synthesisContext
          ? `${text}\n\n[SYNTHESIS CONTEXT]\n${synthesisContext}\n\n[GUIDELINES]\n${guidelines.join('\n')}`
          : text;

        const newBlocks = await runMultiAgentWorkflow(enhancedRequest, activeProject, (log) => {
          addAgentLog(activeProjectId, log);
        });

        if (newBlocks.length > 0) {
          const blocksWithStatus: ContentBlock[] = newBlocks.map(block => ({
            ...block,
            status: BlockStatus.PENDING_REVIEW,
            revisionHistory: []
          }));

          const updatedProject = {
            ...activeProject,
            blocks: [...activeProject.blocks, ...blocksWithStatus],
            lastModified: Date.now()
          };
          setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));
          responseText = `✅ **Created ${blocksWithStatus.length} piece(s)!**\n\nOpen the Review Panel to approve or refine each one.`;
          setShowReviewPanel(true);
        } else {
          responseText = "The swarm encountered an issue. Try again or rephrase your request.";
        }

      } else {
        responseText = await generateChatMessage(updatedMessages, text, activeProject || undefined);
      }

      const finalBotMsg: Message = { id: generateId(), role: MessageRole.MODEL, content: responseText, timestamp: Date.now() };
      setMessages(prev => ({
        ...prev,
        [activeProjectId]: [...prev[activeProjectId], finalBotMsg]
      }));

    } catch (error) {
      console.error(error);
      const errorMsg: Message = { id: generateId(), role: MessageRole.MODEL, content: "Connection interrupted. Please try again.", timestamp: Date.now() };
      setMessages(prev => ({ ...prev, [activeProjectId]: [...updatedMessages, errorMsg] }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    if (!activeProjectId || !activeProject) return;

    const placeholderId = generateId();
    const placeholderBlock: ContentBlock = {
      id: placeholderId,
      type: BlockType.IMAGE,
      content: '',
      status: BlockStatus.DRAFT,
      revisionHistory: []
    };

    const updatedProjectWithPlaceholder = {
      ...activeProject,
      blocks: [...activeProject.blocks, placeholderBlock]
    };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProjectWithPlaceholder : p));
    setIsGenerating(true);

    try {
      const userMsg: Message = { id: generateId(), role: MessageRole.USER, content: `/image ${prompt}`, timestamp: Date.now() };
      setMessages(prev => ({ ...prev, [activeProjectId]: [...currentMessages, userMsg] }));

      addAgentLog(activeProjectId, {
        id: generateId(),
        timestamp: Date.now(),
        agent: AgentRole.VISIONARY,
        message: 'Generating visual...',
        status: 'working'
      });

      const base64Image = await generateBlockContent(prompt, activeProject.blocks, 'image');

      if (base64Image) {
        const updatedBlock: ContentBlock = {
          ...placeholderBlock,
          content: base64Image,
          status: BlockStatus.PENDING_REVIEW,
          metadata: { prompt, agentSignature: 'Visionary Agent' }
        };

        const finalProject = {
          ...activeProject,
          blocks: activeProject.blocks.map(b => b.id === placeholderId ? updatedBlock : b)
        };
        setProjects(prev => prev.map(p => p.id === activeProjectId ? finalProject : p));

        addAgentLog(activeProjectId, {
          id: generateId(),
          timestamp: Date.now(),
          agent: AgentRole.VISIONARY,
          message: 'Visual rendered successfully.',
          status: 'success'
        });

        const modelMsg: Message = { id: generateId(), role: MessageRole.MODEL, content: "✨ Image generated!", timestamp: Date.now() };
        setMessages(prev => ({ ...prev, [activeProjectId]: [...currentMessages, userMsg, modelMsg] }));
      } else {
        addAgentLog(activeProjectId, {
          id: generateId(),
          timestamp: Date.now(),
          agent: AgentRole.VISIONARY,
          message: 'Generation failed.',
          status: 'failed'
        });
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, blocks: p.blocks.filter(b => b.id !== placeholderId) } : p));
      }

    } catch (e) {
      console.error(e);
      setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, blocks: p.blocks.filter(b => b.id !== placeholderId) } : p));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateBlueprint = (blueprint: Blueprint) => {
    if (!activeProject) return;
    const updatedProject = { ...activeProject, blueprint, lastModified: Date.now() };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));
  };

  const handleUpdateSettings = (settings: ProjectSettings) => {
    if (!activeProject) return;
    const updatedProject = { ...activeProject, settings, lastModified: Date.now() };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));
  };

  const handleGenerateFromBlueprint = async () => {
    if (!activeProject || !activeProject.blueprint) return;

    setIsGenerating(true);
    setViewMode('canvas');
    setShowReviewPanel(true);

    try {
      const userMsg: Message = {
        id: generateId(),
        role: MessageRole.USER,
        content: "Generate book from blueprint",
        timestamp: Date.now()
      };
      setMessages(prev => ({
        ...prev,
        [activeProjectId!]: [...currentMessages, userMsg]
      }));

      const newBlocks = await runMultiAgentWorkflow(
        "Generate content based on the attached blueprint.",
        activeProject,
        (log) => addAgentLog(activeProjectId!, log),
        activeProject.blueprint
      );

      if (newBlocks.length > 0) {
        const blocksWithStatus: ContentBlock[] = newBlocks.map(block => ({
          ...block,
          status: BlockStatus.PENDING_REVIEW,
          revisionHistory: []
        }));

        const updatedProject = {
          ...activeProject,
          blocks: [...activeProject.blocks, ...blocksWithStatus],
          lastModified: Date.now(),
          workflowPhase: WorkflowPhase.EXECUTION
        };
        setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));

        const successMsg: Message = {
          id: generateId(),
          role: MessageRole.MODEL,
          content: `✅ Generated ${blocksWithStatus.length} chapters from your blueprint!`,
          timestamp: Date.now()
        };
        setMessages(prev => ({ ...prev, [activeProjectId!]: [...(messages[activeProjectId!] || []), successMsg] }));

      } else {
        const errorMsg: Message = {
          id: generateId(),
          role: MessageRole.MODEL,
          content: "Generation failed or produced no content.",
          timestamp: Date.now()
        };
        setMessages(prev => ({ ...prev, [activeProjectId!]: [...(messages[activeProjectId!] || []), errorMsg] }));
      }

    } catch (error) {
      console.error("Blueprint generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMagicEdit = async (blockId: string, action: EditorAction) => {
    if (!activeProject) return;

    const block = activeProject.blocks.find(b => b.id === blockId);
    if (!block || typeof block.content !== 'string') return;

    try {
      const result = await refineContent(
        block.content,
        action,
        (msg) => console.log('[Editor]', msg)
      );

      setProjects(prev => prev.map(p => {
        if (p.id !== activeProjectId) return p;
        return {
          ...p,
          blocks: p.blocks.map(b => b.id === blockId ? { ...b, content: result.content, status: BlockStatus.NEEDS_REVISION } : b),
          lastModified: Date.now()
        };
      }));

    } catch (error) {
      console.error("Magic Edit failed", error);
    }
  };

  const handleUpdateBlock = (blockId: string, content: string) => {
    if (!activeProject) return;
    const updatedBlocks = activeProject.blocks.map(b => b.id === blockId ? { ...b, content } : b);
    const updatedProject = { ...activeProject, blocks: updatedBlocks, lastModified: Date.now() };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));
  };

  const handleRemoveBlock = (blockId: string) => {
    if (!activeProject) return;
    const updatedBlocks = activeProject.blocks.filter(b => b.id !== blockId);
    const updatedProject = { ...activeProject, blocks: updatedBlocks, lastModified: Date.now() };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));
  };

  const handleAddBlock = (type: BlockType) => {
    if (!activeProject) return;
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: type === BlockType.TEXT ? 'New text block...' : '',
      status: BlockStatus.DRAFT,
      revisionHistory: []
    };
    const updatedProject = { ...activeProject, blocks: [...activeProject.blocks, newBlock] };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));
  };

  const handleAutoExpand = async (blockId: string) => {
    if (!activeProject) return;
    const block = activeProject.blocks.find(b => b.id === blockId);
    if (!block || block.type !== BlockType.TEXT) return;

    setIsGenerating(true);
    addAgentLog(activeProjectId!, {
      id: generateId(),
      timestamp: Date.now(),
      agent: AgentRole.WRITER,
      message: 'Refining content...',
      status: 'working'
    });

    try {
      const expandedContent = await suggestImprovement(block.content);
      handleUpdateBlock(blockId, expandedContent);
      addAgentLog(activeProjectId!, {
        id: generateId(),
        timestamp: Date.now(),
        agent: AgentRole.WRITER,
        message: 'Refinement complete.',
        status: 'success'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveBlock = (blockId: string) => {
    if (!activeProject) return;
    const updatedBlocks = activeProject.blocks.map(b =>
      b.id === blockId ? { ...b, status: BlockStatus.APPROVED } : b
    );
    const updatedProject = { ...activeProject, blocks: updatedBlocks, lastModified: Date.now() };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));
  };

  const handleRequestRevision = async (blockId: string, feedback: string) => {
    if (!activeProject || !activeProjectId) return;

    const block = activeProject.blocks.find(b => b.id === blockId);
    if (!block) return;

    const revisionEntry: RevisionEntry = {
      id: generateId(),
      content: block.content,
      timestamp: Date.now(),
      feedback
    };

    const updatedBlocks = activeProject.blocks.map(b =>
      b.id === blockId ? {
        ...b,
        status: BlockStatus.NEEDS_REVISION,
        revisionHistory: [...(b.revisionHistory || []), revisionEntry]
      } : b
    );
    let updatedProject = { ...activeProject, blocks: updatedBlocks, lastModified: Date.now() };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));

    setIsGenerating(true);
    addAgentLog(activeProjectId, {
      id: generateId(),
      timestamp: Date.now(),
      agent: AgentRole.EDITOR,
      message: `Revising based on: "${feedback.substring(0, 50)}..."`,
      status: 'working'
    });

    try {
      const revisedContent = await suggestImprovement(
        `Original:\n${block.content}\n\nFeedback:\n${feedback}\n\nPlease revise addressing the feedback.`
      );

      const finalBlocks = updatedProject.blocks.map(b =>
        b.id === blockId ? {
          ...b,
          content: revisedContent,
          status: BlockStatus.PENDING_REVIEW
        } : b
      );
      updatedProject = { ...updatedProject, blocks: finalBlocks };
      setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));

      addAgentLog(activeProjectId, {
        id: generateId(),
        timestamp: Date.now(),
        agent: AgentRole.EDITOR,
        message: 'Revision complete.',
        status: 'success'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewHistory = (blockId: string) => {
    console.log('View history for block:', blockId);
  };

  const handleExportHtml = () => {
    if (!activeProject) return;
    downloadAsHtml(activeProject);
  };

  const handleExportMetadata = () => {
    if (!activeProject) return;
    downloadMetadata(activeProject);
  };

  return (
    <div className="flex h-screen overflow-hidden font-body">
      {/* Animated Background */}
      <AnimatedBackground variant="default" particleCount={40} />

      {/* Activity Bar (Left Icon Bar) */}
      <ActivityBar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Primary Sidebar (Content based on Activity) */}
      <PrimarySidebar
        activeView={activeView}
        collapsed={sidebarCollapsed}
        inputHubState={currentInputHubState}
        onInputHubStateChange={handleInputHubStateChange}
        onSynthesize={handleSynthesize}
        isSynthesizing={isSynthesizing}
        onFolderContextLoaded={handleFolderContextLoaded}
        projectName={activeProject?.title || 'New Project'}
        bookMetadata={bookMetadata}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Top Header Bar */}
        <header className="h-12 border-b border-white/[0.06] bg-[rgba(10,10,15,0.9)] backdrop-blur-xl flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-3">
            {/* Project Title */}
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-white">{activeProject?.title || 'Untitled'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500 font-mono">
                {activeProject?.blocks.length || 0} blocks
              </span>
            </div>

            <div className="h-5 w-px bg-white/10" />

            {/* Version Control */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleSaveVersion}
                className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                title="Save Version"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleHistory}
                className={`p-1.5 rounded-lg transition-colors ${showVersionHistory ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title="Version History"
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>

            <div className="h-5 w-px bg-white/10" />

            {/* Model Selector */}
            <ModelSelector
              selectedProvider={selectedProvider}
              onSelectProvider={setSelectedProvider}
              compact
            />
          </div>

          <div className="flex items-center gap-2">
            {/* AI Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">AI Ready</span>
            </div>

            {/* Review Panel */}
            <button
              onClick={() => setShowReviewPanel(!showReviewPanel)}
              className={`p-1.5 rounded-lg transition-all ${showReviewPanel ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              title="Review Panel"
            >
              <ClipboardList className="w-4 h-4" />
            </button>

            {/* Export */}
            <div className="relative group">
              <button className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors" title="Export">
                <Download className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f0f18] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <button
                  onClick={handleExportHtml}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  Export eBook
                </button>
                <button
                  onClick={handleExportMetadata}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  Export Metadata
                </button>
              </div>
            </div>

            <div className="h-5 w-px bg-white/10" />

            {/* Toggle Chat */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-1.5 rounded-lg transition-all ${showChat ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              title="Toggle Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative flex flex-col min-w-0">
            {viewMode === 'blueprint' && activeProject?.blueprint ? (
              <BlueprintEditor
                blueprint={activeProject.blueprint}
                settings={activeProject.settings}
                onUpdateBlueprint={handleUpdateBlueprint}
                onUpdateSettings={handleUpdateSettings}
                onGenerate={handleGenerateFromBlueprint}
                isGenerating={isGenerating}
              />
            ) : (
              <Canvas
                project={activeProject}
                onUpdateBlock={handleUpdateBlock}
                onRemoveBlock={handleRemoveBlock}
                onAddBlock={handleAddBlock}
                onAutoExpand={(id) => handleMagicEdit(id, 'expand')}
                onMagicEdit={handleMagicEdit}
              />
            )}
          </div>

          {/* Review Panel */}
          {showReviewPanel && activeProject && (
            <div className="w-72 border-l border-white/[0.06] bg-[rgba(10,10,15,0.95)] backdrop-blur-xl flex-shrink-0">
              <div className="h-10 border-b border-white/[0.06] flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-medium text-white">Review</span>
                </div>
                <button
                  onClick={() => setShowReviewPanel(false)}
                  className="p-1 hover:bg-white/10 rounded text-gray-500 transition-colors"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
              </div>
              <ReviewPanel
                blocks={activeProject.blocks}
                onApprove={handleApproveBlock}
                onRequestRevision={handleRequestRevision}
                onViewHistory={handleViewHistory}
                isGenerating={isGenerating}
              />
            </div>
          )}

          {/* Chat (Right) */}
          {showChat && (
            <div className="w-80 border-l border-white/[0.06] bg-[rgba(10,10,15,0.95)] backdrop-blur-xl flex-shrink-0 z-10">
              <ChatInterface
                messages={currentMessages}
                agentLogs={currentLogs}
                onSendMessage={handleSendMessage}
                isGenerating={isGenerating}
                onGenerateImage={handleGenerateImage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;