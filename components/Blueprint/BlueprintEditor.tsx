import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
    BookOpen, GripVertical, Plus, RefreshCw, Save,
    Trash2, ChevronDown, ChevronRight, PenTool, Brain, Sparkles, Users, User, Map, Package
} from 'lucide-react';
import { Blueprint, BlueprintSection, ProjectSettings, CharacterProfile, Location, Item } from '../../types';
import { AGENT_PERSONAS } from '../../services/agentPersonas';
import { GlassPanel } from '../ui/GlassPanel';

interface BlueprintEditorProps {
    blueprint: Blueprint;
    settings: ProjectSettings;
    onUpdateBlueprint: (blueprint: Blueprint) => void;
    onUpdateSettings: (settings: ProjectSettings) => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

export const BlueprintEditor: React.FC<BlueprintEditorProps> = ({
    blueprint,
    settings,
    onUpdateBlueprint,
    onUpdateSettings,
    onGenerate,
    isGenerating
}) => {
    const [activeAccordion, setActiveAccordion] = useState<string>('concept');
    const [sections, setSections] = useState<BlueprintSection[]>(blueprint.sections);

    // Sync state if prop changes (e.g. after synthesis)
    useEffect(() => {
        setSections(blueprint.sections);
    }, [blueprint.sections]);

    // Concept Handlers
    const handleSettingChange = (field: keyof Required<ProjectSettings>['bookMetadata'], value: string) => {
        onUpdateSettings({
            ...settings,
            bookMetadata: {
                ...settings.bookMetadata,
                [field]: value
            }
        });
    };

    const handleBlueprintMetaChange = (field: keyof Blueprint, value: string) => {
        onUpdateBlueprint({
            ...blueprint,
            [field]: value
        });
    };

    // Drag & Drop
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const newSections = Array.from(sections);
        const [reorderedItem] = newSections.splice(result.source.index, 1);
        newSections.splice(result.destination.index, 0, reorderedItem);

        setSections(newSections);
        onUpdateBlueprint({ ...blueprint, sections: newSections });
    };

    // Section Management
    const addSection = () => {
        const newSection: BlueprintSection = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'New Chapter',
            description: 'Describe what happens in this chapter...',
            type: 'chapter'
        };
        const newSections = [...sections, newSection];
        setSections(newSections);
        onUpdateBlueprint({ ...blueprint, sections: newSections });
    };

    const updateSection = (id: string, field: keyof BlueprintSection, value: string) => {
        const newSections = sections.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        );
        setSections(newSections);
        onUpdateBlueprint({ ...blueprint, sections: newSections });
    };

    const removeSection = (id: string) => {
        const newSections = sections.filter(s => s.id !== id);
        setSections(newSections);
        onUpdateBlueprint({ ...blueprint, sections: newSections });
    };

    // Character Management
    const addCharacter = () => {
        const newChar: CharacterProfile = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'New Character',
            role: 'Supporting',
            description: 'Brief description...',
            traits: []
        };
        const newChars = [...(blueprint.characters || []), newChar];
        onUpdateBlueprint({ ...blueprint, characters: newChars });
    };

    const updateCharacter = (id: string, field: keyof CharacterProfile, value: any) => {
        const newChars = (blueprint.characters || []).map(c =>
            c.id === id ? { ...c, [field]: value } : c
        );
        onUpdateBlueprint({ ...blueprint, characters: newChars });
    };

    const removeCharacter = (id: string) => {
        const newChars = (blueprint.characters || []).filter(c => c.id !== id);
        onUpdateBlueprint({ ...blueprint, characters: newChars });
    };

    // --- Location Management ---
    const addLocation = () => {
        const newLocation: Location = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'New Place',
            description: 'A vivid description...',
            sensoryDetails: 'Sights, sounds, smells...'
        };
        const updatedLocations = [...(blueprint.locations || []), newLocation];
        onUpdateBlueprint({ ...blueprint, locations: updatedLocations });
    };

    const updateLocation = (id: string, updates: Partial<Location>) => {
        const updatedLocations = (blueprint.locations || []).map(l =>
            l.id === id ? { ...l, ...updates } : l
        );
        onUpdateBlueprint({ ...blueprint, locations: updatedLocations });
    };

    const removeLocation = (id: string) => {
        const updatedLocations = (blueprint.locations || []).filter(l => l.id !== id);
        onUpdateBlueprint({ ...blueprint, locations: updatedLocations });
    };

    // --- Item Management ---
    const addItem = () => {
        const newItem: Item = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'Mysterious Artifact',
            description: 'Description...',
            usage: 'How it is used or why it matters'
        };
        const updatedItems = [...(blueprint.items || []), newItem];
        onUpdateBlueprint({ ...blueprint, items: updatedItems });
    };

    const updateItem = (id: string, updates: Partial<Item>) => {
        const updatedItems = (blueprint.items || []).map(i =>
            i.id === id ? { ...i, ...updates } : i
        );
        onUpdateBlueprint({ ...blueprint, items: updatedItems });
    };

    const removeItem = (id: string) => {
        const updatedItems = (blueprint.items || []).filter(i => i.id !== id);
        onUpdateBlueprint({ ...blueprint, items: updatedItems });
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white font-display">Book Blueprint</h2>
                            <p className="text-sm text-gray-400">Step 2: Define Structure & Concept</p>
                        </div>
                    </div>

                    <button
                        onClick={onGenerate}
                        disabled={isGenerating || sections.length === 0}
                        className="px-6 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Building...
                            </>
                        ) : (
                            <>
                                <Brain className="w-4 h-4" />
                                Generate Book
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* 1. CONCEPT SECTION */}
                <GlassPanel className="p-6">
                    <button
                        onClick={() => setActiveAccordion(activeAccordion === 'concept' ? '' : 'concept')}
                        className="w-full flex items-center justify-between mb-4 group"
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-lg font-semibold text-white">Concept & Metadata</h3>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${activeAccordion === 'concept' ? 'rotate-180' : ''}`} />
                    </button>

                    {activeAccordion === 'concept' && (
                        <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                            <div className="col-span-2 space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Title</label>
                                <input
                                    value={blueprint.title}
                                    onChange={(e) => handleBlueprintMetaChange('title', e.target.value)}
                                    className="w-full px-4 py-2 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="The Epic Saga of..."
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Writing Style / Persona</label>
                                <select
                                    value={blueprint.personaId || AGENT_PERSONAS[0].id}
                                    onChange={(e) => handleBlueprintMetaChange('personaId', e.target.value)}
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white focus:border-indigo-500 focus:outline-none appearance-none"
                                >
                                    {AGENT_PERSONAS.map(persona => (
                                        <option key={persona.id} value={persona.id} className="bg-gray-900 text-white">
                                            {persona.name} - {persona.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Genre</label>
                                <input
                                    value={settings.bookMetadata?.genre || ''}
                                    onChange={(e) => handleSettingChange('genre', e.target.value)}
                                    className="w-full px-4 py-2 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="Sci-Fi, Romance..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Tone</label>
                                <input
                                    value={settings.bookMetadata?.tone || ''}
                                    onChange={(e) => handleSettingChange('tone', e.target.value)}
                                    className="w-full px-4 py-2 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="Dark, Humorous..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Audience</label>
                                <input
                                    value={settings.bookMetadata?.targetAudience || ''}
                                    onChange={(e) => handleSettingChange('targetAudience', e.target.value)}
                                    className="w-full px-4 py-2 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="YA, Adults..."
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Summary / Premise</label>
                                <textarea
                                    value={blueprint.description}
                                    onChange={(e) => handleBlueprintMetaChange('description', e.target.value)}
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white focus:border-indigo-500 focus:outline-none h-24 resize-none"
                                    placeholder="What is this story about?"
                                />
                            </div>
                        </div>
                    )}
                </GlassPanel>

                {/* 2. CHARACTERS SECTION */}
                <GlassPanel className="p-6">
                    <button
                        onClick={() => setActiveAccordion(activeAccordion === 'characters' ? '' : 'characters')}
                        className="w-full flex items-center justify-between mb-4 group"
                    >
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-lg font-semibold text-white">Characters</h3>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${activeAccordion === 'characters' ? 'rotate-180' : ''}`} />
                    </button>

                    {activeAccordion === 'characters' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                            <div className="grid grid-cols-1 gap-4">
                                {(blueprint.characters || []).map((char) => (
                                    <div key={char.id} className="bg-white/[0.03] border border-white/[0.1] rounded-xl p-4 flex gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                            <User className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex gap-3">
                                                <input
                                                    value={char.name}
                                                    onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                                                    className="flex-1 bg-transparent text-white font-bold text-lg focus:outline-none border-b border-transparent focus:border-indigo-500/50"
                                                    placeholder="Character Name"
                                                />
                                                <select
                                                    value={char.role}
                                                    onChange={(e) => updateCharacter(char.id, 'role', e.target.value)}
                                                    className="bg-black/20 text-xs text-indigo-300 px-2 py-1 rounded border border-indigo-500/20 focus:outline-none"
                                                >
                                                    <option value="Protagonist">Protagonist</option>
                                                    <option value="Antagonist">Antagonist</option>
                                                    <option value="Supporting">Supporting</option>
                                                </select>
                                                <button
                                                    onClick={() => removeCharacter(char.id)}
                                                    className="text-gray-600 hover:text-red-400 p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <textarea
                                                value={char.description}
                                                onChange={(e) => updateCharacter(char.id, 'description', e.target.value)}
                                                className="w-full bg-black/20 rounded-lg p-2 text-sm text-gray-400 focus:text-gray-200 focus:outline-none resize-none"
                                                rows={2}
                                                placeholder="Character description, motivation, and role in the story..."
                                            />
                                            <input
                                                value={char.traits.join(', ')}
                                                onChange={(e) => updateCharacter(char.id, 'traits', e.target.value.split(',').map(t => t.trim()))}
                                                className="w-full bg-transparent text-sm text-gray-500 focus:text-gray-300 focus:outline-none border-b border-white/[0.05] focus:border-indigo-500/30 pb-1"
                                                placeholder="Traits (comma separated)..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addCharacter}
                                className="w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-500 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" /> Add Character
                            </button>
                        </div>
                    )}
                </GlassPanel>

                {/* 2. STRUCTURE EDITOR */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <GripVertical className="w-5 h-5 text-indigo-400" />
                            Structural Outline
                        </h3>
                        <button
                            onClick={addSection}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Chapter
                        </button>
                    </div>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="blueprint-sections">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-3"
                                >
                                    {sections.map((section, index) => (
                                        <Draggable key={section.id} draggableId={section.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`
                            bg-[#12121a] border border-white/[0.08] rounded-xl overflow-hidden transition-all
                            ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500 z-50 scale-105' : 'hover:border-white/20'}
                          `}
                                                >
                                                    <div className="flex items-start">
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="px-3 py-4 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400"
                                                        >
                                                            <GripVertical className="w-5 h-5" />
                                                            <span className="block text-[10px] text-center mt-1 font-mono text-gray-700">{index + 1}</span>
                                                        </div>

                                                        <div className="flex-1 p-4 pl-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] uppercase font-bold tracking-wider border border-indigo-500/20">
                                                                    {section.type}
                                                                </span>
                                                                <input
                                                                    value={section.title}
                                                                    onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                                                                    className="flex-1 bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-indigo-500/50 transition-colors placeholder-gray-600"
                                                                    placeholder="Chapter Title"
                                                                />
                                                                <button
                                                                    onClick={() => removeSection(section.id)}
                                                                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <textarea
                                                                value={section.description}
                                                                onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                                                                className="w-full bg-white/[0.02] rounded-lg p-2 text-sm text-gray-400 focus:text-gray-200 focus:bg-white/[0.05] focus:outline-none resize-none transition-all"
                                                                rows={2}
                                                                placeholder="Describe what happens specifically in this chapter (the AI will use this as instructions)..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </div >
        </div >
    );
};
