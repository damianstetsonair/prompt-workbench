import { useState, useCallback } from 'react';
import { replaceVariables, generateId } from '../utils';
import type { Metrics, Version, TestSlot, Provider } from '../types';

interface UsePromptTestingProps {
  executePrompt: (
    prompt: string,
    userInput: string,
    overrideProvider?: Provider | null,
    overrideModel?: string | null
  ) => Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
    responseTime: number;
  } | null>;
  addTestRun: (projectId: string, promptId: string, run: {
    input: string;
    output: string;
    promptVersion: string;
    timestamp: number;
    variables: Record<string, string>;
    metrics: Metrics;
  }) => void;
}

const createEmptySlot = (): TestSlot => ({
  id: generateId(),
  versionIndex: -1, // -1 means latest
  input: '',
  output: '',
  metrics: { inputTokens: 0, outputTokens: 0, responseTime: 0 },
  isExecuting: false,
  provider: null, // null means use default from settings
  model: null, // null means use default from settings
});

export function usePromptTesting({ executePrompt, addTestRun }: UsePromptTestingProps) {
  const [slots, setSlots] = useState<TestSlot[]>([createEmptySlot()]);
  const [promptVariables, setPromptVariables] = useState<Record<string, string>>({});

  // Get aggregated values for backward compatibility
  const firstSlot = slots[0];
  const testInput = firstSlot?.input || '';
  const testOutput = firstSlot?.output || '';
  const metrics = firstSlot?.metrics || { inputTokens: 0, outputTokens: 0, responseTime: 0 };

  const setTestInput = useCallback((input: string) => {
    setSlots(prev => {
      const newSlots = [...prev];
      if (newSlots[0]) {
        newSlots[0] = { ...newSlots[0], input };
      }
      return newSlots;
    });
  }, []);

  const setTestOutput = useCallback((output: string) => {
    setSlots(prev => {
      const newSlots = [...prev];
      if (newSlots[0]) {
        newSlots[0] = { ...newSlots[0], output };
      }
      return newSlots;
    });
  }, []);

  const updateSlot = useCallback((slotId: string, updates: Partial<TestSlot>) => {
    setSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, ...updates } : slot
    ));
  }, []);

  const addSlot = useCallback(() => {
    setSlots(prev => [...prev, createEmptySlot()]);
  }, []);

  const removeSlot = useCallback((slotId: string) => {
    setSlots(prev => {
      // Don't remove if it's the only slot
      if (prev.length === 1) return prev;
      return prev.filter(slot => slot.id !== slotId);
    });
  }, []);

  const handleExecuteSlot = useCallback(async (
    slotId: string,
    versions: Version[],
    selectedProject: string | null,
    selectedPrompt: string | null
  ) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot || !selectedProject || !selectedPrompt || versions.length === 0) return;

    // Get the version to use (latest or specific)
    const versionIndex = slot.versionIndex === -1 ? versions.length - 1 : slot.versionIndex;
    const version = versions[versionIndex];
    if (!version) return;

    // Mark as executing
    updateSlot(slotId, { isExecuting: true });

    const processedPrompt = replaceVariables(version.content, promptVariables);
    // Pass provider and model overrides if set
    const result = await executePrompt(processedPrompt, slot.input || '', slot.provider, slot.model);

    if (result) {
      updateSlot(slotId, {
        output: result.text,
        metrics: {
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          responseTime: result.responseTime,
        },
        isExecuting: false,
      });

      addTestRun(selectedProject, selectedPrompt, {
        input: slot.input,
        output: result.text,
        promptVersion: version.version,
        timestamp: Date.now(),
        variables: { ...promptVariables },
        metrics: {
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          responseTime: result.responseTime,
        },
      });
    } else {
      updateSlot(slotId, { isExecuting: false });
    }
  }, [slots, promptVariables, executePrompt, addTestRun, updateSlot]);

  // Legacy handler for backward compatibility
  const handleExecutePrompt = useCallback(async (
    currentVersion: Version | undefined,
    selectedProject: string | null,
    selectedPrompt: string | null
  ) => {
    if (!currentVersion || !selectedProject || !selectedPrompt) return;
    
    const firstSlotId = slots[0]?.id;
    if (firstSlotId) {
      await handleExecuteSlot(firstSlotId, [currentVersion], selectedProject, selectedPrompt);
    }
  }, [slots, handleExecuteSlot]);

  const resetTestState = useCallback(() => {
    setSlots([createEmptySlot()]);
    setPromptVariables({});
  }, []);

  return {
    // State
    slots,
    testInput,
    testOutput,
    promptVariables,
    metrics,
    // Actions
    setTestInput,
    setTestOutput,
    setPromptVariables,
    updateSlot,
    addSlot,
    removeSlot,
    handleExecuteSlot,
    handleExecutePrompt,
    resetTestState,
  };
}
