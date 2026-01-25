import { useState, useCallback } from 'react';
import { replaceVariables } from '../utils';
import type { Metrics, Version } from '../types';

interface UsePromptTestingProps {
  executePrompt: (prompt: string, userInput: string) => Promise<{
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

export function usePromptTesting({ executePrompt, addTestRun }: UsePromptTestingProps) {
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [promptVariables, setPromptVariables] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState<Metrics>({ inputTokens: 0, outputTokens: 0, responseTime: 0 });

  const handleExecutePrompt = useCallback(async (
    currentVersion: Version | undefined,
    selectedProject: string | null,
    selectedPrompt: string | null
  ) => {
    if (!currentVersion?.content || !selectedProject || !selectedPrompt) return;

    const processedPrompt = replaceVariables(currentVersion.content, promptVariables);
    const result = await executePrompt(processedPrompt, testInput || '');

    if (result) {
      setTestOutput(result.text);
      setMetrics({
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        responseTime: result.responseTime,
      });

      addTestRun(selectedProject, selectedPrompt, {
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
  }, [testInput, promptVariables, executePrompt, addTestRun]);

  const resetTestState = useCallback(() => {
    setTestInput('');
    setTestOutput('');
    setPromptVariables({});
    setMetrics({ inputTokens: 0, outputTokens: 0, responseTime: 0 });
  }, []);

  return {
    // State
    testInput,
    testOutput,
    promptVariables,
    metrics,
    // Actions
    setTestInput,
    setTestOutput,
    setPromptVariables,
    handleExecutePrompt,
    resetTestState,
  };
}
