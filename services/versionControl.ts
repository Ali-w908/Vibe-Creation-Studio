import { Project, ProjectVersion } from '../types';

const STORAGE_PREFIX = 'vibe_versions_';

export const saveVersion = (project: Project, type: 'auto' | 'manual', label: string = 'Checkpoint'): ProjectVersion => {
    const versionId = Math.random().toString(36).substr(2, 9);
    const version: ProjectVersion = {
        id: versionId,
        projectId: project.id,
        timestamp: Date.now(),
        label,
        type,
        snapshot: project
    };

    try {
        const key = `${STORAGE_PREFIX}${project.id}`;
        const existing = getVersions(project.id);

        // Limit auto-saves to last 10 to prevent storage overflow
        let updated = [version, ...existing];
        if (type === 'auto') {
            const manual = updated.filter(v => v.type === 'manual');
            const auto = updated.filter(v => v.type === 'auto').slice(0, 10);
            updated = [...manual, ...auto].sort((a, b) => b.timestamp - a.timestamp);
        }

        localStorage.setItem(key, JSON.stringify(updated));
        console.log(`[VersionControl] Saved version: ${label} (${versionId})`);
        return version;
    } catch (error) {
        console.error('[VersionControl] Failed to save version (likely storage limit):', error);
        throw error;
    }
};

export const getVersions = (projectId: string): ProjectVersion[] => {
    try {
        const key = `${STORAGE_PREFIX}${projectId}`;
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        return JSON.parse(raw) as ProjectVersion[];
    } catch (error) {
        console.error('[VersionControl] Failed to load versions:', error);
        return [];
    }
};

export const deleteVersion = (projectId: string, versionId: string): void => {
    const versions = getVersions(projectId);
    const updated = versions.filter(v => v.id !== versionId);
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(updated));
};

export const clearHistory = (projectId: string): void => {
    localStorage.removeItem(`${STORAGE_PREFIX}${projectId}`);
};
