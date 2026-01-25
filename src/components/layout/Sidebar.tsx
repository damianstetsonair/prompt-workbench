import { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  Download,
  Upload,
  Settings,
  Plus,
  Edit3,
  Trash2,
  FileText,
  GripVertical,
} from 'lucide-react';
import type { WorkbenchData, EditingState, DraggedPromptState } from '../../types';

interface SidebarProps {
  data: WorkbenchData;
  selectedProject: string | null;
  selectedPrompt: string | null;
  expandedProjects: Record<string, boolean>;
  saving: boolean;
  hasApiKey: boolean;
  onSelectProject: (projectId: string) => void;
  onSelectPrompt: (promptId: string) => void;
  onToggleProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDeletePrompt: (projectId: string, promptId: string) => void;
  onRenamePrompt: (projectId: string, promptId: string, newName: string) => void;
  onNewPrompt: (projectId: string) => void;
  onMovePrompt: (promptId: string, sourceProjectId: string, targetProjectId: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onOpenSettings: () => void;
  onDownloadProject: (projectId: string) => void;
}

export function Sidebar({
  data,
  selectedProject,
  selectedPrompt,
  expandedProjects,
  saving,
  hasApiKey,
  onSelectProject,
  onSelectPrompt,
  onToggleProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  onDeletePrompt,
  onRenamePrompt,
  onNewPrompt,
  onMovePrompt,
  onExport,
  onImport,
  onOpenSettings,
  onDownloadProject,
}: SidebarProps) {
  const [editingName, setEditingName] = useState<EditingState | null>(null);
  const [tempName, setTempName] = useState('');
  const [draggedPrompt, setDraggedPrompt] = useState<DraggedPromptState | null>(null);
  const [dragOverProject, setDragOverProject] = useState<string | null>(null);

  const handleStartEdit = (type: 'project' | 'prompt', id: string, currentName: string) => {
    setEditingName({ type, id });
    setTempName(currentName);
  };

  const handleFinishEdit = (type: 'project' | 'prompt', id: string, projectId?: string) => {
    if (tempName.trim()) {
      if (type === 'project') {
        onRenameProject(id, tempName);
      } else if (projectId) {
        onRenamePrompt(projectId, id, tempName);
      }
    }
    setEditingName(null);
  };

  // Drag and drop handlers
  const handleDragStart = (promptId: string, sourceProjectId: string) => {
    setDraggedPrompt({ promptId, sourceProjectId });
  };

  const handleDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    if (draggedPrompt && draggedPrompt.sourceProjectId !== projectId) {
      setDragOverProject(projectId);
    }
  };

  const handleDragLeave = () => {
    setDragOverProject(null);
  };

  const handleDrop = (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    if (draggedPrompt && draggedPrompt.sourceProjectId !== targetProjectId) {
      onMovePrompt(draggedPrompt.promptId, draggedPrompt.sourceProjectId, targetProjectId);
    }
    setDraggedPrompt(null);
    setDragOverProject(null);
  };

  const handleDragEnd = () => {
    setDraggedPrompt(null);
    setDragOverProject(null);
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Prompt Workbench
        </h1>
      </div>

      {/* Projects list */}
      <div className="flex-1 overflow-auto p-2">
        {Object.values(data.projects).map((project) => (
          <div
            key={project.id}
            className={`mb-1 rounded transition-colors ${
              dragOverProject === project.id ? 'bg-purple-900/30 ring-2 ring-purple-500' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, project.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, project.id)}
          >
            {/* Project header */}
            <div
              className={`group flex items-center gap-1 p-2 rounded cursor-pointer hover:bg-gray-800 ${
                selectedProject === project.id ? 'bg-gray-800' : ''
              }`}
              onClick={() => {
                onSelectProject(project.id);
                onToggleProject(project.id);
              }}
            >
              {expandedProjects[project.id] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}

              {editingName?.type === 'project' && editingName?.id === project.id ? (
                <input
                  autoFocus
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onBlur={() => handleFinishEdit('project', project.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit('project', project.id)}
                  className="flex-1 bg-gray-700 px-1 rounded text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-sm truncate">{project.name}</span>
              )}

              <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadProject(project.id);
                  }}
                  className="hover:text-green-400"
                  title="Descargar prompts como ZIP"
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit('project', project.id, project.name);
                  }}
                  className="hover:text-blue-400"
                  title="Renombrar proyecto"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className="hover:text-red-400"
                  title="Eliminar proyecto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Prompts list */}
            {expandedProjects[project.id] && (
              <div className="ml-4 pl-2 border-l border-gray-700">
                {Object.values(project.prompts || {}).map((prompt) => (
                  <div
                    key={prompt.id}
                    draggable
                    onDragStart={() => handleDragStart(prompt.id, project.id)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center gap-2 p-2 rounded cursor-grab hover:bg-gray-800 text-sm ${
                      selectedPrompt === prompt.id
                        ? 'bg-purple-900/30 text-purple-300'
                        : 'text-gray-400'
                    } ${draggedPrompt?.promptId === prompt.id ? 'opacity-50' : ''}`}
                    onClick={() => onSelectPrompt(prompt.id)}
                  >
                    <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 cursor-grab" />
                    <FileText className="w-3 h-3" />

                    {editingName?.type === 'prompt' && editingName?.id === prompt.id ? (
                      <input
                        autoFocus
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => handleFinishEdit('prompt', prompt.id, project.id)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleFinishEdit('prompt', prompt.id, project.id)
                        }
                        className="flex-1 bg-gray-700 px-1 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 truncate">{prompt.name}</span>
                    )}

                    <span className="text-xs text-gray-500">
                      v{prompt.versions?.[prompt.versions.length - 1]?.version || '0.0'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePrompt(project.id, prompt.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 rounded"
                      title="Eliminar prompt"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => onNewPrompt(project.id)}
                  className="flex items-center gap-2 p-2 text-sm text-gray-500 hover:text-white w-full"
                >
                  <Plus className="w-3 h-3" /> Nuevo prompt
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="p-2 border-t border-gray-800 space-y-1">
        <button
          onClick={onCreateProject}
          className="flex items-center gap-2 p-2 text-sm hover:bg-gray-800 rounded w-full"
        >
          <FolderPlus className="w-4 h-4" /> Nuevo proyecto
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-2 p-2 text-sm hover:bg-gray-800 rounded w-full"
        >
          <Download className="w-4 h-4" /> Exportar
        </button>
        <label className="flex items-center gap-2 p-2 text-sm hover:bg-gray-800 rounded w-full cursor-pointer">
          <Upload className="w-4 h-4" /> Importar
          <input type="file" accept=".json" onChange={handleImportChange} className="hidden" />
        </label>
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 p-2 text-sm hover:bg-gray-800 rounded w-full"
        >
          <Settings className="w-4 h-4" /> Settings
          {!hasApiKey && <span className="ml-auto text-xs text-yellow-500">⚠️</span>}
        </button>
      </div>

      {saving && <div className="p-2 text-xs text-center text-gray-500">Guardando...</div>}
    </div>
  );
}
