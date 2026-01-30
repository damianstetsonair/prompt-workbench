import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';
import { DEFAULT_SETTINGS } from '../constants';
import { generateId } from '../utils/id';
import { getVersionNumber } from '../utils/version';
import type {
  WorkbenchData,
  Settings,
  Project,
  Prompt,
  Version,
  TestRun,
} from '../types';

const INITIAL_DATA: WorkbenchData = { projects: {} };

export function useWorkbenchData() {
  const [data, setData] = useState<WorkbenchData>(INITIAL_DATA);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = storage.getData();
        if (savedData) {
          setData(savedData);
        }

        const savedSettings = storage.getSettings();
        if (savedSettings) {
          // Merge with defaults to ensure all fields exist (backwards compatibility)
          const mergedSettings: Settings = {
            ...DEFAULT_SETTINGS,
            ...savedSettings,
            providers: {
              ...DEFAULT_SETTINGS.providers,
              ...savedSettings.providers,
            },
            systemPrompts: {
              ...DEFAULT_SETTINGS.systemPrompts,
              ...savedSettings.systemPrompts,
            },
          };
          setSettings(mergedSettings);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  // Save data
  const saveData = useCallback((newData: WorkbenchData) => {
    setSaving(true);
    setData(newData);
    storage.setData(newData);
    setSaving(false);
  }, []);

  // Save settings
  const saveSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    storage.setSettings(newSettings);
  }, []);

  // ============================================
  // Project Operations
  // ============================================

  const createProject = useCallback((): string => {
    const id = generateId();
    const newProject: Project = {
      id,
      name: 'Nuevo Proyecto',
      createdAt: Date.now(),
      prompts: {},
    };

    const newData = {
      ...data,
      projects: {
        ...data.projects,
        [id]: newProject,
      },
    };

    saveData(newData);
    return id;
  }, [data, saveData]);

  const deleteProject = useCallback(
    (projectId: string) => {
      const { [projectId]: _, ...rest } = data.projects;
      saveData({ ...data, projects: rest });
    },
    [data, saveData]
  );

  const renameProject = useCallback(
    (projectId: string, newName: string) => {
      const project = data.projects[projectId];
      if (!project) return;

      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [projectId]: { ...project, name: newName },
        },
      };
      saveData(newData);
    },
    [data, saveData]
  );

  // ============================================
  // Prompt Operations
  // ============================================

  const createPrompt = useCallback(
    (
      projectId: string,
      name: string,
      initialContent: string,
      note: string = 'Inicial'
    ): string | null => {
      const project = data.projects[projectId];
      if (!project) return null;

      const promptId = generateId();
      const newPrompt: Prompt = {
        id: promptId,
        name,
        versions: [
          {
            version: '0.0',
            content: initialContent,
            timestamp: Date.now(),
            note,
          },
        ],
        testRuns: [],
      };

      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [projectId]: {
            ...project,
            prompts: {
              ...project.prompts,
              [promptId]: newPrompt,
            },
          },
        },
      };

      saveData(newData);
      return promptId;
    },
    [data, saveData]
  );

  const deletePrompt = useCallback(
    (projectId: string, promptId: string) => {
      const project = data.projects[projectId];
      if (!project) return;

      const { [promptId]: _, ...restPrompts } = project.prompts;
      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [projectId]: {
            ...project,
            prompts: restPrompts,
          },
        },
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const renamePrompt = useCallback(
    (projectId: string, promptId: string, newName: string) => {
      const project = data.projects[projectId];
      const prompt = project?.prompts[promptId];
      if (!project || !prompt) return;

      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [projectId]: {
            ...project,
            prompts: {
              ...project.prompts,
              [promptId]: { ...prompt, name: newName },
            },
          },
        },
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const movePromptToProject = useCallback(
    (promptId: string, sourceProjectId: string, targetProjectId: string) => {
      const sourceProject = data.projects[sourceProjectId];
      const targetProject = data.projects[targetProjectId];
      const prompt = sourceProject?.prompts[promptId];

      if (!sourceProject || !targetProject || !prompt) return;

      const { [promptId]: removed, ...sourcePrompts } = sourceProject.prompts;

      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [sourceProjectId]: {
            ...sourceProject,
            prompts: sourcePrompts,
          },
          [targetProjectId]: {
            ...targetProject,
            prompts: {
              ...targetProject.prompts,
              [promptId]: prompt,
            },
          },
        },
      };

      saveData(newData);
    },
    [data, saveData]
  );

  // ============================================
  // Version Operations
  // ============================================

  const updatePromptContent = useCallback(
    (
      projectId: string,
      promptId: string,
      newContent: string,
      note: string = 'Edición manual',
      forceNewVersion: boolean = false
    ) => {
      const project = data.projects[projectId];
      const prompt = project?.prompts[promptId];
      if (!project || !prompt) return;

      const currentVersion = prompt.versions[prompt.versions.length - 1];
      // Skip if content is the same, unless forced
      if (!forceNewVersion && currentVersion?.content === newContent) return;

      const newVersion: Version = {
        version: getVersionNumber(prompt.versions),
        content: newContent,
        timestamp: Date.now(),
        note,
      };

      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [projectId]: {
            ...project,
            prompts: {
              ...project.prompts,
              [promptId]: {
                ...prompt,
                versions: [...prompt.versions, newVersion],
              },
            },
          },
        },
      };

      saveData(newData);
    },
    [data, saveData]
  );

  const updateCurrentVersionContent = useCallback(
    (projectId: string, promptId: string, newContent: string) => {
      const project = data.projects[projectId];
      const prompt = project?.prompts[promptId];
      if (!project || !prompt) return;

      const newVersions = prompt.versions.map((v, i) =>
        i === prompt.versions.length - 1 ? { ...v, content: newContent } : v
      );

      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [projectId]: {
            ...project,
            prompts: {
              ...project.prompts,
              [promptId]: {
                ...prompt,
                versions: newVersions,
              },
            },
          },
        },
      };

      setData(newData);
    },
    [data]
  );

  const saveCurrentData = useCallback(() => {
    storage.setData(data);
  }, [data]);

  const rollbackToVersion = useCallback(
    (projectId: string, promptId: string, version: Version) => {
      const project = data.projects[projectId];
      const prompt = project?.prompts[promptId];
      if (!project || !prompt) return;

      const newVersion: Version = {
        version: getVersionNumber(prompt.versions),
        content: version.content,
        timestamp: Date.now(),
        note: `Rollback a v${version.version}`,
      };

      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [projectId]: {
            ...project,
            prompts: {
              ...project.prompts,
              [promptId]: {
                ...prompt,
                versions: [...prompt.versions, newVersion],
              },
            },
          },
        },
      };

      saveData(newData);
    },
    [data, saveData]
  );

  const deleteVersion = useCallback(
    (projectId: string, promptId: string, versionId: string) => {
      const project = data.projects[projectId];
      const prompt = project?.prompts[promptId];
      if (!project || !prompt || prompt.versions.length <= 1) return;

      const newVersions = prompt.versions.filter((v) => v.version !== versionId);

      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [projectId]: {
            ...project,
            prompts: {
              ...project.prompts,
              [promptId]: {
                ...prompt,
                versions: newVersions,
              },
            },
          },
        },
      };

      saveData(newData);
    },
    [data, saveData]
  );

  // ============================================
  // Test Run Operations
  // ============================================

  const addTestRun = useCallback(
    (projectId: string, promptId: string, testRun: Omit<TestRun, 'id'>) => {
      const project = data.projects[projectId];
      const prompt = project?.prompts[promptId];
      if (!project || !prompt) return;

      const newTestRun: TestRun = {
        ...testRun,
        id: generateId(),
      };

      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [projectId]: {
            ...project,
            prompts: {
              ...project.prompts,
              [promptId]: {
                ...prompt,
                testRuns: [...prompt.testRuns, newTestRun],
              },
            },
          },
        },
      };

      saveData(newData);
    },
    [data, saveData]
  );

  const deleteTestRun = useCallback(
    (projectId: string, promptId: string, testRunId: string) => {
      const project = data.projects[projectId];
      const prompt = project?.prompts[promptId];
      if (!project || !prompt) return;

      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [projectId]: {
            ...project,
            prompts: {
              ...project.prompts,
              [promptId]: {
                ...prompt,
                testRuns: prompt.testRuns.filter((run) => run.id !== testRunId),
              },
            },
          },
        },
      };

      saveData(newData);
    },
    [data, saveData]
  );

  const deleteAllTestRuns = useCallback(
    (projectId: string, promptId: string) => {
      const project = data.projects[projectId];
      const prompt = project?.prompts[promptId];
      if (!project || !prompt) return;

      const newData = {
        ...data,
        projects: {
          ...data.projects,
          [projectId]: {
            ...project,
            prompts: {
              ...project.prompts,
              [promptId]: {
                ...prompt,
                testRuns: [],
              },
            },
          },
        },
      };

      saveData(newData);
    },
    [data, saveData]
  );

  // ============================================
  // Import/Export
  // ============================================

  const exportData = useCallback(() => {
    const jsonString = storage.exportData(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-workbench-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importData = useCallback(
    (jsonString: string): { success: boolean; added: number; updated: number } => {
      const imported = storage.importData(jsonString);
      if (!imported) {
        return { success: false, added: 0, updated: 0 };
      }

      let added = 0;
      let updated = 0;

      // Create a map of existing projects by name for quick lookup
      const existingProjectsByName: Record<string, Project> = {};
      Object.values(data.projects).forEach((project) => {
        existingProjectsByName[project.name.toLowerCase()] = project;
      });

      const mergedProjects = { ...data.projects };

      // Process imported projects
      Object.values(imported.projects).forEach((importedProject) => {
        const existingProject = existingProjectsByName[importedProject.name.toLowerCase()];

        if (!existingProject) {
          // Project doesn't exist - add it with a new ID
          const newId = generateId();
          mergedProjects[newId] = {
            ...importedProject,
            id: newId,
            prompts: Object.fromEntries(
              Object.values(importedProject.prompts || {}).map((p) => {
                const newPromptId = generateId();
                return [newPromptId, { ...p, id: newPromptId }];
              })
            ),
          };
          added++;
        } else {
          // Project exists - merge prompts
          const existingPromptsByName: Record<string, Prompt> = {};
          Object.values(existingProject.prompts || {}).forEach((prompt) => {
            existingPromptsByName[prompt.name.toLowerCase()] = prompt;
          });

          const mergedPrompts = { ...existingProject.prompts };
          let projectUpdated = false;

          Object.values(importedProject.prompts || {}).forEach((importedPrompt) => {
            const existingPrompt = existingPromptsByName[importedPrompt.name.toLowerCase()];

            if (!existingPrompt) {
              // Prompt doesn't exist - add it
              const newPromptId = generateId();
              mergedPrompts[newPromptId] = { ...importedPrompt, id: newPromptId };
              projectUpdated = true;
            } else {
              // Prompt exists - merge versions (add only newer versions)
              const existingVersionIds = new Set(existingPrompt.versions.map((v) => v.version));
              const newVersions = importedPrompt.versions.filter(
                (v) => !existingVersionIds.has(v.version)
              );

              if (newVersions.length > 0) {
                mergedPrompts[existingPrompt.id] = {
                  ...existingPrompt,
                  versions: [...existingPrompt.versions, ...newVersions].sort(
                    (a, b) => a.timestamp - b.timestamp
                  ),
                  testRuns: [
                    ...existingPrompt.testRuns,
                    ...importedPrompt.testRuns.filter(
                      (tr) => !existingPrompt.testRuns.some((etr) => etr.timestamp === tr.timestamp)
                    ),
                  ],
                };
                projectUpdated = true;
              }
            }
          });

          if (projectUpdated) {
            mergedProjects[existingProject.id] = {
              ...existingProject,
              prompts: mergedPrompts,
            };
            updated++;
          }
        }
      });

      saveData({ projects: mergedProjects });
      return { success: true, added, updated };
    },
    [data, saveData]
  );

  return {
    data,
    settings,
    loading,
    saving,
    saveSettings,
    saveData,
    saveCurrentData,
    // Projects
    createProject,
    deleteProject,
    renameProject,
    // Prompts
    createPrompt,
    deletePrompt,
    renamePrompt,
    movePromptToProject,
    // Versions
    updatePromptContent,
    updateCurrentVersionContent,
    rollbackToVersion,
    deleteVersion,
    // Test runs
    addTestRun,
    deleteTestRun,
    deleteAllTestRuns,
    // Import/Export
    exportData,
    importData,
  };
}
