import { RefreshCw, Sparkles, X } from 'lucide-react';

import {
  useWorkbenchData,
  useAiApi,
  useToast,
  useProjectSelection,
  useModals,
  usePromptTesting,
  usePromptEditor,
  useClipboard,
  useProjectActions,
} from './hooks';
import { extractVariables, getVersionNumber } from './utils';
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

export default function App() {
  // Core data hook
  const workbench = useWorkbenchData();
  
  // Toast notifications
  const { toast, showToast } = useToast();

  // AI API hook
  const aiApi = useAiApi({
    settings: workbench.settings,
    onSettingsChange: workbench.saveSettings,
  });

  // Get current provider info
  const currentProviderName = PROVIDERS.find(p => p.id === workbench.settings.provider)?.name || workbench.settings.provider;
  const currentApiKey = workbench.settings.providers[workbench.settings.provider].apiKey;

  // Project selection state
  const selection = useProjectSelection({ data: workbench.data });

  // Modal state
  const modals = useModals();

  // Clipboard functionality
  const clipboard = useClipboard({ showToast });

  // Prompt testing
  const testing = usePromptTesting({
    executePrompt: aiApi.executePrompt,
    addTestRun: workbench.addTestRun,
  });

  // Prompt editor
  const editor = usePromptEditor({
    currentVersion: selection.currentVersion,
    selectedPrompt: selection.selectedPrompt,
    versionsLength: selection.currentPrompt?.versions.length || 0,
    updateCurrentVersionContent: workbench.updateCurrentVersionContent,
    updatePromptContent: workbench.updatePromptContent,
    saveCurrentData: workbench.saveCurrentData,
    improvePrompt: aiApi.improvePrompt,
    generatePrompt: aiApi.generatePrompt,
    showToast,
    currentProviderName,
  });

  // Project actions
  const actions = useProjectActions({
    data: workbench.data,
    createProject: workbench.createProject,
    deleteProject: workbench.deleteProject,
    deletePrompt: workbench.deletePrompt,
    deleteVersion: workbench.deleteVersion,
    createPrompt: workbench.createPrompt,
    movePromptToProject: workbench.movePromptToProject,
    rollbackToVersion: workbench.rollbackToVersion,
    importData: workbench.importData,
    exportData: workbench.exportData,
    showToast,
    generatePrompt: aiApi.generatePrompt,
    currentProviderName,
  });

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
        selectedProject={selection.selectedProject}
        selectedPrompt={selection.selectedPrompt}
        expandedProjects={selection.expandedProjects}
        saving={workbench.saving}
        hasApiKey={!!currentApiKey}
        onSelectProject={selection.handleSelectProject}
        onSelectPrompt={selection.handleSelectPrompt}
        onToggleProject={selection.handleToggleProject}
        onCreateProject={() => actions.handleCreateProject(selection.selectNewProject)}
        onDeleteProject={(projectId) => {
          const project = workbench.data.projects[projectId];
          modals.openDeleteProjectModal(projectId, project?.name || '');
        }}
        onRenameProject={workbench.renameProject}
        onDeletePrompt={(projectId, promptId) => {
          const prompt = workbench.data.projects[projectId]?.prompts[promptId];
          modals.openDeletePromptModal(projectId, promptId, prompt?.name || '');
        }}
        onRenamePrompt={workbench.renamePrompt}
        onNewPrompt={(projectId) => {
          selection.handleSelectProject(projectId);
          modals.openNewPromptModal();
        }}
        onMovePrompt={(promptId, sourceProjectId, targetProjectId) => {
          actions.handleMovePrompt(promptId, sourceProjectId, targetProjectId, selection.updateProjectAfterMove);
        }}
        onExport={actions.exportData}
        onImport={actions.handleImport}
        onOpenSettings={modals.openSettingsModal}
        onDownloadProject={actions.handleDownloadProject}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selection.currentPrompt && selection.currentVersion ? (
          <>
            {/* Header */}
            <Header
              prompt={selection.currentPrompt}
              currentVersion={selection.currentVersion}
              activeTab={selection.activeTab}
              copied={clipboard.copied}
              onCopy={() => clipboard.copyToClipboard(selection.currentVersion?.content)}
              onDelete={() => {
                if (selection.selectedProject) {
                  const prompt = selection.currentPrompt;
                  modals.openDeletePromptModal(selection.selectedProject, prompt!.id, prompt?.name || '');
                }
              }}
              onTabChange={(tab) => selection.handleTabChange(tab, workbench.saveCurrentData)}
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
              {selection.activeTab === 'edit' && (
                <PromptEditor
                  content={selection.currentVersion.content}
                  feedback={editor.feedback}
                  isGenerating={aiApi.isGenerating}
                  promptId={selection.selectedPrompt || undefined}
                  closePopupTrigger={modals.showSettingsModal}
                  hasUnsavedChanges={editor.hasUnsavedChanges}
                  onContentChange={(content) => editor.handleContentChange(content, selection.selectedProject, selection.selectedPrompt)}
                  onContentBlur={editor.handleContentBlur}
                  onFeedbackChange={editor.setFeedback}
                  onGenerateFromFeedback={() => editor.handleGenerateFromFeedback(selection.selectedProject, selection.selectedPrompt, testing.testOutput)}
                  onGenerateFromDescription={(desc) => editor.handleGenerateFromDescription(desc, selection.selectedProject, selection.selectedPrompt)}
                  onSaveVersion={(note) => editor.handleSaveVersion(note, selection.selectedProject, selection.selectedPrompt)}
                />
              )}

              {selection.activeTab === 'test' && (
                <PromptTester
                  slots={testing.slots}
                  versions={selection.currentPrompt.versions}
                  settings={workbench.settings}
                  feedback={editor.feedback}
                  variables={extractVariables(selection.currentVersion.content)}
                  variableValues={testing.promptVariables}
                  isGenerating={aiApi.isGenerating}
                  nextVersion={getVersionNumber(selection.currentPrompt.versions)}
                  onUpdateSlot={testing.updateSlot}
                  onAddSlot={testing.addSlot}
                  onRemoveSlot={testing.removeSlot}
                  onExecuteSlot={(slotId) => testing.handleExecuteSlot(slotId, selection.currentPrompt!.versions, selection.selectedProject, selection.selectedPrompt)}
                  onFeedbackChange={editor.setFeedback}
                  onVariablesChange={testing.setPromptVariables}
                  onGenerateFromFeedback={() => editor.handleGenerateFromFeedback(selection.selectedProject, selection.selectedPrompt, testing.testOutput)}
                />
              )}

              {selection.activeTab === 'history' && (
                <PromptHistory
                  versions={selection.currentPrompt.versions}
                  testRuns={selection.currentPrompt.testRuns}
                  currentVersion={selection.currentVersion}
                  onRollback={(version) => actions.handleRollbackVersion(version, selection.selectedProject, selection.selectedPrompt)}
                  onDeleteVersion={(version) => {
                    if (selection.selectedProject && selection.selectedPrompt) {
                      modals.openDeleteVersionModal(selection.selectedProject, selection.selectedPrompt, version);
                    }
                  }}
                  onDeleteTestRun={(runId) => {
                    if (selection.selectedProject && selection.selectedPrompt) {
                      workbench.deleteTestRun(selection.selectedProject, selection.selectedPrompt, runId);
                    }
                  }}
                  onDeleteAllTestRuns={() => {
                    if (selection.selectedProject && selection.selectedPrompt) {
                      workbench.deleteAllTestRuns(selection.selectedProject, selection.selectedPrompt);
                    }
                  }}
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
        isOpen={modals.showNewPromptModal}
        onClose={modals.closeNewPromptModal}
        onCreate={(name, description) => {
          actions.handleNewPrompt(name, description, selection.selectedProject, (promptId) => {
            selection.selectNewPrompt(promptId);
            modals.closeNewPromptModal();
          });
        }}
        isGenerating={aiApi.isGenerating}
      />

      <SettingsModal
        isOpen={modals.showSettingsModal}
        onClose={modals.closeSettingsModal}
        settings={workbench.settings}
        onSettingsChange={workbench.saveSettings}
        onSave={() => aiApi.setApiError(null)}
        availableModels={aiApi.availableModels}
        onProviderChange={aiApi.handleProviderChange}
        onApiKeyChange={aiApi.handleApiKeyChange}
        onModelChange={aiApi.handleModelChange}
      />

      <ConfirmModal
        state={modals.confirmModal}
        onClose={modals.closeConfirmModal}
        onConfirm={() => {
          actions.handleConfirmDelete(
            modals.confirmModal,
            selection.selectedProject,
            selection.selectedPrompt,
            selection.clearProjectSelection,
            selection.clearPromptSelection
          );
          modals.closeConfirmModal();
        }}
      />

      {/* Toast */}
      <Toast toast={toast} />
    </div>
  );
}
