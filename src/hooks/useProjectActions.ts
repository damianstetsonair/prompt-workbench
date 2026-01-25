import { useCallback } from 'react';
import JSZip from 'jszip';
import type { WorkbenchData, Version } from '../types';

interface UseProjectActionsProps {
  data: WorkbenchData;
  createProject: () => string;
  deleteProject: (projectId: string) => void;
  deletePrompt: (projectId: string, promptId: string) => void;
  deleteVersion: (projectId: string, promptId: string, version: string) => void;
  createPrompt: (projectId: string, name: string, content: string, note?: string) => string | null;
  movePromptToProject: (promptId: string, sourceProjectId: string, targetProjectId: string) => void;
  rollbackToVersion: (projectId: string, promptId: string, version: Version) => void;
  importData: (jsonString: string) => { success: boolean; added: number; updated: number };
  exportData: () => void;
  showToast: (message: string) => void;
  generatePrompt: (description: string) => Promise<string | null>;
  currentProviderName: string;
}

export function useProjectActions({
  data,
  createProject,
  deleteProject,
  deletePrompt,
  deleteVersion,
  createPrompt,
  movePromptToProject,
  rollbackToVersion,
  importData,
  exportData,
  showToast,
  generatePrompt,
  currentProviderName,
}: UseProjectActionsProps) {

  const handleCreateProject = useCallback((
    onProjectCreated: (projectId: string) => void
  ) => {
    const id = createProject();
    onProjectCreated(id);
  }, [createProject]);

  const handleConfirmDelete = useCallback((
    confirmModal: {
      type: 'project' | 'prompt' | 'version' | null;
      id: string | null;
      projectId: string | null;
      promptId?: string;
    },
    selectedProject: string | null,
    selectedPrompt: string | null,
    onProjectDeleted: () => void,
    onPromptDeleted: () => void
  ) => {
    if (confirmModal.type === 'project' && confirmModal.id) {
      deleteProject(confirmModal.id);
      if (selectedProject === confirmModal.id) {
        onProjectDeleted();
      }
    } else if (confirmModal.type === 'prompt' && confirmModal.projectId && confirmModal.id) {
      deletePrompt(confirmModal.projectId, confirmModal.id);
      if (selectedPrompt === confirmModal.id) {
        onPromptDeleted();
      }
    } else if (confirmModal.type === 'version' && confirmModal.projectId && confirmModal.promptId && confirmModal.id) {
      deleteVersion(confirmModal.projectId, confirmModal.promptId, confirmModal.id);
    }
  }, [deleteProject, deletePrompt, deleteVersion]);

  const handleNewPrompt = useCallback(async (
    name: string,
    description: string,
    selectedProject: string | null,
    onPromptCreated: (promptId: string) => void
  ) => {
    if (!selectedProject) return;

    let initialContent = `# ${name}\n\n[Describe el comportamiento del sistema aquí]`;

    if (description.trim()) {
      const generated = await generatePrompt(description);
      if (generated) {
        initialContent = generated;
      }
    }

    const promptId = createPrompt(
      selectedProject,
      name,
      initialContent,
      description ? `Generado por ${currentProviderName}` : 'Inicial'
    );

    if (promptId) {
      onPromptCreated(promptId);
    }
  }, [createPrompt, generatePrompt, currentProviderName]);

  const handleMovePrompt = useCallback((
    promptId: string,
    sourceProjectId: string,
    targetProjectId: string,
    onMoved: (promptId: string, targetProjectId: string) => void
  ) => {
    movePromptToProject(promptId, sourceProjectId, targetProjectId);
    onMoved(promptId, targetProjectId);
  }, [movePromptToProject]);

  const handleRollbackVersion = useCallback((
    version: Version,
    selectedProject: string | null,
    selectedPrompt: string | null
  ) => {
    if (!selectedProject || !selectedPrompt) return;
    rollbackToVersion(selectedProject, selectedPrompt, version);
  }, [rollbackToVersion]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const importResult = importData(result);
        if (importResult.success) {
          const messages: string[] = [];
          if (importResult.added > 0) {
            messages.push(`${importResult.added} proyecto(s) añadido(s)`);
          }
          if (importResult.updated > 0) {
            messages.push(`${importResult.updated} proyecto(s) actualizado(s)`);
          }
          if (messages.length === 0) {
            showToast('No hay cambios nuevos para importar');
          } else {
            showToast(`Importación exitosa: ${messages.join(', ')}`);
          }
        } else {
          showToast('Error al importar: archivo inválido');
        }
      }
    };
    reader.readAsText(file);
  }, [importData, showToast]);

  const handleDownloadProject = useCallback(async (projectId: string) => {
    const project = data.projects[projectId];
    if (!project) return;

    const zip = new JSZip();
    const prompts = Object.values(project.prompts);

    if (prompts.length === 0) {
      showToast('No hay prompts para descargar');
      return;
    }

    // Add each prompt's latest version as a .txt file
    prompts.forEach((prompt) => {
      const latestVersion = prompt.versions[prompt.versions.length - 1];
      if (latestVersion) {
        // Sanitize filename: remove special characters
        const safeName = prompt.name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]/g, '').trim() || 'prompt';
        zip.file(`${safeName}.txt`, latestVersion.content);
      }
    });

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Sanitize project name for filename
      const safeProjectName = project.name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]/g, '').trim() || 'project';
      link.download = `${safeProjectName}-prompts.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Descargado ${prompts.length} prompt(s)`);
    } catch {
      showToast('Error al crear el ZIP');
    }
  }, [data.projects, showToast]);

  return {
    handleCreateProject,
    handleConfirmDelete,
    handleNewPrompt,
    handleMovePrompt,
    handleRollbackVersion,
    handleImport,
    handleDownloadProject,
    exportData,
  };
}
