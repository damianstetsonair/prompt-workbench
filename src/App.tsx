import { useState, useCallback } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

import { useWorkbenchData, useAiApi, useToast } from './hooks';
import { extractVariables, replaceVariables, getVersionNumber } from './utils';
import { PROVIDERS } from './constants';

import {
  Sidebar,
  Header,
  Toast,
  ConfirmModal,
  NewPromptModal,
  SettingsModal,
  PromptEditor,
  PromptTester,
  PromptHistory,
} from './components';

import type { ActiveTab, ConfirmModalState, Metrics, Version } from './types';

const INITIAL_CONFIRM_STATE: ConfirmModalState = {
  show: false,
  type: null,
  id: null,
  projectId: null,
  name: '',
};

export default function App() {
  // Data hooks
  const workbench = useWorkbenchData();
  const aiApi = useAiApi({
    settings: workbench.settings,
    onSettingsChange: workbench.saveSettings,
  });
  const { toast, showToast } = useToast();

  // UI State
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('edit');

  // Modal states
  const [showNewPromptModal, setShowNewPromptModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(INITIAL_CONFIRM_STATE);

  // Test states
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [promptVariables, setPromptVariables] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState<Metrics>({ inputTokens: 0, outputTokens: 0, responseTime: 0 });

  // Copy state
  const [copied, setCopied] = useState(false);

  // Derived data
  const currentProject = selectedProject ? workbench.data.projects[selectedProject] : null;
  const currentPrompt = currentProject && selectedPrompt ? currentProject.prompts[selectedPrompt] : null;
  const currentVersion = currentPrompt?.versions?.[currentPrompt.versions.length - 1];
  
  // Get current provider name for display
  const currentProviderName = PROVIDERS.find(p => p.id === workbench.settings.provider)?.name || workbench.settings.provider;
  const currentApiKey = workbench.settings.providers[workbench.settings.provider].apiKey;

  // Auto-select first project on initial load
  useState(() => {
    if (!workbench.loading) {
      const projectIds = Object.keys(workbench.data.projects);
      if (projectIds.length > 0 && !selectedProject) {
        const firstId = projectIds[0];
        if (firstId) {
          setSelectedProject(firstId);
          setExpandedProjects({ [firstId]: true });
        }
      }
    }
  });

  // ============================================
  // Handlers
  // ============================================

  const handleCopyToClipboard = useCallback(async () => {
    if (!currentVersion?.content) return;
    try {
      await navigator.clipboard.writeText(currentVersion.content);
      setCopied(true);
      showToast('¡Prompt copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Error al copiar');
    }
  }, [currentVersion, showToast]);

  const handleCreateProject = useCallback(() => {
    const id = workbench.createProject();
    setSelectedProject(id);
    setSelectedPrompt(null);
    setExpandedProjects((prev) => ({ ...prev, [id]: true }));
  }, [workbench]);

  const handleDeleteProject = useCallback((projectId: string) => {
    const project = workbench.data.projects[projectId];
    setConfirmModal({
      show: true,
      type: 'project',
      id: projectId,
      projectId: null,
      name: project?.name || 'este proyecto',
    });
  }, [workbench.data.projects]);

  const handleDeletePrompt = useCallback((projectId: string, promptId: string) => {
    const prompt = workbench.data.projects[projectId]?.prompts[promptId];
    setConfirmModal({
      show: true,
      type: 'prompt',
      id: promptId,
      projectId: projectId,
      name: prompt?.name || 'este prompt',
    });
  }, [workbench.data.projects]);

  const handleDeleteVersion = useCallback((version: Version) => {
    if (!selectedProject || !selectedPrompt) return;
    setConfirmModal({
      show: true,
      type: 'version',
      id: version.version,
      projectId: selectedProject,
      promptId: selectedPrompt,
      name: `v${version.version}`,
    });
  }, [selectedProject, selectedPrompt]);

  const handleConfirmDelete = useCallback(() => {
    if (confirmModal.type === 'project' && confirmModal.id) {
      workbench.deleteProject(confirmModal.id);
      if (selectedProject === confirmModal.id) {
        setSelectedProject(null);
        setSelectedPrompt(null);
      }
    } else if (confirmModal.type === 'prompt' && confirmModal.projectId && confirmModal.id) {
      workbench.deletePrompt(confirmModal.projectId, confirmModal.id);
      if (selectedPrompt === confirmModal.id) {
        setSelectedPrompt(null);
      }
    } else if (confirmModal.type === 'version' && confirmModal.projectId && confirmModal.promptId && confirmModal.id) {
      workbench.deleteVersion(confirmModal.projectId, confirmModal.promptId, confirmModal.id);
    }
    setConfirmModal(INITIAL_CONFIRM_STATE);
  }, [confirmModal, workbench, selectedProject, selectedPrompt]);

  const handleNewPrompt = useCallback(async (name: string, description: string) => {
    if (!selectedProject) return;

    let initialContent = `# ${name}\n\n[Describe el comportamiento del sistema aquí]`;

    if (description.trim()) {
      const generated = await aiApi.generatePrompt(description);
      if (generated) {
        initialContent = generated;
      }
    }

    const promptId = workbench.createPrompt(
      selectedProject,
      name,
      initialContent,
      description ? `Generado por ${currentProviderName}` : 'Inicial'
    );

    if (promptId) {
      setSelectedPrompt(promptId);
      setActiveTab('edit');
      setShowNewPromptModal(false);
    }
  }, [selectedProject, aiApi, workbench, currentProviderName]);

  const handleMovePrompt = useCallback((promptId: string, sourceProjectId: string, targetProjectId: string) => {
    workbench.movePromptToProject(promptId, sourceProjectId, targetProjectId);
    if (selectedPrompt === promptId) {
      setSelectedProject(targetProjectId);
    }
  }, [workbench, selectedPrompt]);

  const handleContentChange = useCallback((content: string) => {
    if (!selectedProject || !selectedPrompt) return;
    workbench.updateCurrentVersionContent(selectedProject, selectedPrompt, content);
  }, [workbench, selectedProject, selectedPrompt]);

  const handleContentBlur = useCallback(() => {
    workbench.saveCurrentData();
  }, [workbench]);

  const handleExecutePrompt = useCallback(async () => {
    if (!currentVersion?.content || !testInput.trim() || !selectedProject || !selectedPrompt) return;

    const processedPrompt = replaceVariables(currentVersion.content, promptVariables);
    const result = await aiApi.executePrompt(processedPrompt, testInput);

    if (result) {
      setTestOutput(result.text);
      setMetrics({
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        responseTime: result.responseTime,
      });

      workbench.addTestRun(selectedProject, selectedPrompt, {
        input: testInput,
        output: result.text,
        promptVersion: currentVersion.version,
        timestamp: Date.now(),
        variables: { ...promptVariables },
        metrics: {
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          responseTime: result.responseTime,
        },
      });
    }
  }, [currentVersion, testInput, promptVariables, aiApi, workbench, selectedProject, selectedPrompt]);

  const handleGenerateFromFeedback = useCallback(async () => {
    if (!feedback.trim() || !currentVersion?.content || !selectedProject || !selectedPrompt) return;

    const newContent = await aiApi.improvePrompt(currentVersion.content, feedback, testOutput || null);

    if (newContent) {
      workbench.updatePromptContent(
        selectedProject,
        selectedPrompt,
        newContent,
        `Feedback: ${feedback.substring(0, 50)}...`
      );
      setFeedback('');
    }
  }, [feedback, currentVersion, testOutput, aiApi, workbench, selectedProject, selectedPrompt]);

  const handleGenerateFromDescription = useCallback(async (description: string) => {
    if (!description.trim() || !selectedProject || !selectedPrompt) return;

    const generated = await aiApi.generatePrompt(description);
    if (generated) {
      workbench.updatePromptContent(
        selectedProject,
        selectedPrompt,
        generated,
        `Generado por ${currentProviderName}`
      );
    }
  }, [aiApi, workbench, selectedProject, selectedPrompt, currentProviderName]);

  const handleRollbackVersion = useCallback((version: Version) => {
    if (!selectedProject || !selectedPrompt) return;
    workbench.rollbackToVersion(selectedProject, selectedPrompt, version);
  }, [workbench, selectedProject, selectedPrompt]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const importResult = workbench.importData(result);
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
  }, [workbench, showToast]);

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

  // Loading state
  if (workbench.loading) {
    return (
      <div className="h-screen bg-gray-950 text-white flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 text-white flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        data={workbench.data}
        selectedProject={selectedProject}
        selectedPrompt={selectedPrompt}
        expandedProjects={expandedProjects}
        saving={workbench.saving}
        hasApiKey={!!currentApiKey}
        onSelectProject={handleSelectProject}
        onSelectPrompt={handleSelectPrompt}
        onToggleProject={handleToggleProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={workbench.renameProject}
        onDeletePrompt={handleDeletePrompt}
        onRenamePrompt={workbench.renamePrompt}
        onNewPrompt={(projectId) => {
          setSelectedProject(projectId);
          setShowNewPromptModal(true);
        }}
        onMovePrompt={handleMovePrompt}
        onExport={workbench.exportData}
        onImport={handleImport}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentPrompt && currentVersion ? (
          <>
            {/* Header */}
            <Header
              prompt={currentPrompt}
              currentVersion={currentVersion}
              activeTab={activeTab}
              copied={copied}
              onCopy={handleCopyToClipboard}
              onDelete={() => selectedProject && handleDeletePrompt(selectedProject, currentPrompt.id)}
              onTabChange={setActiveTab}
            />

            {/* Error Banner */}
            {aiApi.apiError && (
              <div className="mx-4 mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-300 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{aiApi.apiError}</span>
                </div>
                <button onClick={() => aiApi.setApiError(null)} className="text-red-400 hover:text-red-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content area */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'edit' && (
                <PromptEditor
                  content={currentVersion.content}
                  feedback={feedback}
                  isGenerating={aiApi.isGenerating}
                  promptId={selectedPrompt || undefined}
                  closePopupTrigger={showSettingsModal}
                  onContentChange={handleContentChange}
                  onContentBlur={handleContentBlur}
                  onFeedbackChange={setFeedback}
                  onGenerateFromFeedback={handleGenerateFromFeedback}
                  onGenerateFromDescription={handleGenerateFromDescription}
                />
              )}

              {activeTab === 'test' && (
                <PromptTester
                  testInput={testInput}
                  testOutput={testOutput}
                  feedback={feedback}
                  variables={extractVariables(currentVersion.content)}
                  variableValues={promptVariables}
                  metrics={metrics}
                  isExecuting={aiApi.isExecuting}
                  isGenerating={aiApi.isGenerating}
                  nextVersion={getVersionNumber(currentPrompt.versions)}
                  onInputChange={setTestInput}
                  onFeedbackChange={setFeedback}
                  onVariablesChange={setPromptVariables}
                  onExecute={handleExecutePrompt}
                  onGenerateFromFeedback={handleGenerateFromFeedback}
                />
              )}

              {activeTab === 'history' && (
                <PromptHistory
                  versions={currentPrompt.versions}
                  testRuns={currentPrompt.testRuns}
                  currentVersion={currentVersion}
                  onRollback={handleRollbackVersion}
                  onDeleteVersion={handleDeleteVersion}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Selecciona o crea un prompt para comenzar</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewPromptModal
        isOpen={showNewPromptModal}
        onClose={() => setShowNewPromptModal(false)}
        onCreate={handleNewPrompt}
        isGenerating={aiApi.isGenerating}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={workbench.settings}
        onSettingsChange={workbench.saveSettings}
        onSave={() => aiApi.setApiError(null)}
        availableModels={aiApi.availableModels}
        onProviderChange={aiApi.handleProviderChange}
        onApiKeyChange={aiApi.handleApiKeyChange}
        onModelChange={aiApi.handleModelChange}
      />

      <ConfirmModal
        state={confirmModal}
        onClose={() => setConfirmModal(INITIAL_CONFIRM_STATE)}
        onConfirm={handleConfirmDelete}
      />

      {/* Toast */}
      <Toast toast={toast} />
    </div>
  );
}
