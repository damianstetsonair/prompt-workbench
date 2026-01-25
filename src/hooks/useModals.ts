import { useState, useCallback } from 'react';
import type { ConfirmModalState, Version } from '../types';

const INITIAL_CONFIRM_STATE: ConfirmModalState = {
  show: false,
  type: null,
  id: null,
  projectId: null,
  name: '',
};

export function useModals() {
  const [showNewPromptModal, setShowNewPromptModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(INITIAL_CONFIRM_STATE);

  const openNewPromptModal = useCallback(() => {
    setShowNewPromptModal(true);
  }, []);

  const closeNewPromptModal = useCallback(() => {
    setShowNewPromptModal(false);
  }, []);

  const openSettingsModal = useCallback(() => {
    setShowSettingsModal(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setShowSettingsModal(false);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal(INITIAL_CONFIRM_STATE);
  }, []);

  const openDeleteProjectModal = useCallback((projectId: string, projectName: string) => {
    setConfirmModal({
      show: true,
      type: 'project',
      id: projectId,
      projectId: null,
      name: projectName || 'este proyecto',
    });
  }, []);

  const openDeletePromptModal = useCallback((projectId: string, promptId: string, promptName: string) => {
    setConfirmModal({
      show: true,
      type: 'prompt',
      id: promptId,
      projectId: projectId,
      name: promptName || 'este prompt',
    });
  }, []);

  const openDeleteVersionModal = useCallback((
    selectedProject: string,
    selectedPrompt: string,
    version: Version
  ) => {
    setConfirmModal({
      show: true,
      type: 'version',
      id: version.version,
      projectId: selectedProject,
      promptId: selectedPrompt,
      name: `v${version.version}`,
    });
  }, []);

  return {
    // State
    showNewPromptModal,
    showSettingsModal,
    confirmModal,
    // Actions
    openNewPromptModal,
    closeNewPromptModal,
    openSettingsModal,
    closeSettingsModal,
    closeConfirmModal,
    openDeleteProjectModal,
    openDeletePromptModal,
    openDeleteVersionModal,
  };
}
