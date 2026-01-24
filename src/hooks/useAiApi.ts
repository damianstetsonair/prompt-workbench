import { useState, useCallback } from 'react';
import { aiApi } from '../services/ai-api';
import { getModelsForProvider } from '../constants';
import type { Settings, Provider } from '../types';
import type { ApiResult } from '../services';

interface UseAiApiOptions {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function useAiApi({ settings, onSettingsChange }: UseAiApiOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Get models for current provider
  const availableModels = getModelsForProvider(settings.provider);

  // Get current provider's API key
  const currentApiKey = settings.providers[settings.provider].apiKey;

  // Change provider
  const handleProviderChange = useCallback(
    (provider: Provider) => {
      onSettingsChange({
        ...settings,
        provider,
      });
    },
    [settings, onSettingsChange]
  );

  // Change API key for current provider
  const handleApiKeyChange = useCallback(
    (newApiKey: string) => {
      onSettingsChange({
        ...settings,
        providers: {
          ...settings.providers,
          [settings.provider]: {
            ...settings.providers[settings.provider],
            apiKey: newApiKey,
          },
        },
      });
    },
    [settings, onSettingsChange]
  );

  // Change model for current provider
  const handleModelChange = useCallback(
    (model: string) => {
      onSettingsChange({
        ...settings,
        providers: {
          ...settings.providers,
          [settings.provider]: {
            ...settings.providers[settings.provider],
            model,
          },
        },
      });
    },
    [settings, onSettingsChange]
  );

  // Execute prompt with input
  const executePrompt = useCallback(
    async (
      systemPrompt: string,
      userInput: string
    ): Promise<ApiResult | null> => {
      if (!currentApiKey) {
        setApiError('Configura tu API key en Settings');
        return null;
      }

      setIsExecuting(true);
      setApiError(null);

      try {
        const result = await aiApi.sendMessage(
          [{ role: 'user', content: userInput }],
          settings,
          systemPrompt,
          true
        );

        setIsExecuting(false);
        return result as ApiResult;
      } catch (error) {
        setApiError(`Error ejecutando: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsExecuting(false);
        return null;
      }
    },
    [settings, currentApiKey]
  );

  // Generate prompt from description
  const generatePrompt = useCallback(
    async (description: string): Promise<string | null> => {
      if (!currentApiKey) {
        setApiError('Configura tu API key en Settings');
        return null;
      }

      setIsGenerating(true);
      setApiError(null);

      try {
        const result = await aiApi.generatePrompt(description, settings);
        setIsGenerating(false);
        return result;
      } catch (error) {
        setApiError(`Error generando prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsGenerating(false);
        return null;
      }
    },
    [settings, currentApiKey]
  );

  // Improve prompt based on feedback
  const improvePrompt = useCallback(
    async (
      currentContent: string,
      feedback: string,
      lastOutput: string | null
    ): Promise<string | null> => {
      if (!currentApiKey) {
        setApiError('Configura tu API key en Settings');
        return null;
      }

      setIsGenerating(true);
      setApiError(null);

      try {
        const result = await aiApi.improvePrompt(
          currentContent,
          feedback,
          lastOutput,
          settings
        );
        setIsGenerating(false);
        return result;
      } catch (error) {
        setApiError(`Error generando versión: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsGenerating(false);
        return null;
      }
    },
    [settings, currentApiKey]
  );

  return {
    availableModels,
    isGenerating,
    isExecuting,
    apiError,
    setApiError,
    handleProviderChange,
    handleApiKeyChange,
    handleModelChange,
    executePrompt,
    generatePrompt,
    improvePrompt,
  };
}
