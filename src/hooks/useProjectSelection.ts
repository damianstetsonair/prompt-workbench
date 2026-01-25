import { useState, useCallback } from 'react';
import type { WorkbenchData, ActiveTab } from '../types';

interface UseProjectSelectionProps {
  data: WorkbenchData;
}

export function useProjectSelection({ data }: UseProjectSelectionProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(() => {
    // Auto-select first project on initial load
    const projectIds = Object.keys(data.projects);
    return projectIds.length > 0 ? projectIds[0] || null : null;
  });
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(() => {
    // Auto-expand first project
    const projectIds = Object.keys(data.projects);
    if (projectIds.length > 0 && projectIds[0]) {
      return { [projectIds[0]]: true };
    }
    return {};
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('edit');

  // Derived data
  const currentProject = selectedProject ? data.projects[selectedProject] : null;
  const currentPrompt = currentProject && selectedPrompt ? currentProject.prompts[selectedPrompt] : null;
  const currentVersion = currentPrompt?.versions?.[currentPrompt.versions.length - 1];

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProject(projectId);
  }, []);

  const handleSelectPrompt = useCallback((promptId: string) => {
    setSelectedPrompt(promptId);
    setActiveTab('edit');
  }, []);

  const handleToggleProject = useCallback((projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  }, []);

  const handleTabChange = useCallback((tab: ActiveTab, onBeforeChange?: () => void) => {
    onBeforeChange?.();
    setActiveTab(tab);
  }, []);

  const clearProjectSelection = useCallback(() => {
    setSelectedProject(null);
    setSelectedPrompt(null);
  }, []);

  const clearPromptSelection = useCallback(() => {
    setSelectedPrompt(null);
  }, []);

  const selectNewProject = useCallback((projectId: string) => {
    setSelectedProject(projectId);
    setSelectedPrompt(null);
    setExpandedProjects((prev) => ({ ...prev, [projectId]: true }));
  }, []);

  const selectNewPrompt = useCallback((promptId: string) => {
    setSelectedPrompt(promptId);
    setActiveTab('edit');
  }, []);

  const updateProjectAfterMove = useCallback((promptId: string, targetProjectId: string) => {
    if (selectedPrompt === promptId) {
      setSelectedProject(targetProjectId);
    }
  }, [selectedPrompt]);

  return {
    // State
    selectedProject,
    selectedPrompt,
    expandedProjects,
    activeTab,
    // Derived
    currentProject,
    currentPrompt,
    currentVersion,
    // Actions
    handleSelectProject,
    handleSelectPrompt,
    handleToggleProject,
    handleTabChange,
    clearProjectSelection,
    clearPromptSelection,
    selectNewProject,
    selectNewPrompt,
    updateProjectAfterMove,
    setActiveTab,
  };
}
