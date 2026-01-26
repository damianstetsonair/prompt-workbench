import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { aiApi } from '../services/ai-api';
import { getModelsForProvider } from '../constants';
import type { Settings, Provider } from '../types';
import type { ApiResult } from '../services';

interface UseAiApiOptions {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function useAiApi({ settings, onSettingsChange }: UseAiApiOptions) {
  const { t } = useTranslation();
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
      userInput: string,
      overrideProvider?: Provider | null,
      overrideModel?: string | null
    ): Promise<ApiResult | null> => {
      // Determine which provider/model to use
      const effectiveProvider = overrideProvider || settings.provider;
      const effectiveApiKey = settings.providers[effectiveProvider].apiKey;
      const effectiveModel = overrideModel || settings.providers[effectiveProvider].model;

      if (!effectiveApiKey) {
        setApiError(t('errors.configureApiKey', { provider: effectiveProvider }));
        return null;
      }

      setIsExecuting(true);
      setApiError(null);

      try {
        // Create effective settings with overrides
        const effectiveSettings: Settings = {
          ...settings,
          provider: effectiveProvider,
          providers: {
            ...settings.providers,
            [effectiveProvider]: {
              ...settings.providers[effectiveProvider],
              model: effectiveModel,
            },
          },
        };

        // Use a default message if no input provided
        const messageContent = userInput.trim() || 'Execute the prompt';
        const result = await aiApi.sendMessage(
          [{ role: 'user', content: messageContent }],
          effectiveSettings,
          systemPrompt,
          true
        );

        setIsExecuting(false);
        return result as ApiResult;
      } catch (error) {
        setApiError(t('errors.executionError', { message: error instanceof Error ? error.message : 'Unknown error' }));
        setIsExecuting(false);
        return null;
      }
    },
    [settings, t]
  );

  // Generate prompt from description
  const generatePrompt = useCallback(
    async (description: string): Promise<string | null> => {
      if (!currentApiKey) {
        setApiError(t('errors.configureApiKey', { provider: settings.provider }));
        return null;
      }

      setIsGenerating(true);
      setApiError(null);

      try {
        const result = await aiApi.generatePrompt(description, settings);
        setIsGenerating(false);
        return result;
      } catch (error) {
        setApiError(t('errors.generationError', { message: error instanceof Error ? error.message : 'Unknown error' }));
        setIsGenerating(false);
        return null;
      }
    },
    [settings, currentApiKey, t]
  );

  // Improve prompt based on feedback
  const improvePrompt = useCallback(
    async (
      currentContent: string,
      feedback: string,
      lastOutput: string | null
    ): Promise<string | null> => {
      if (!currentApiKey) {
        setApiError(t('errors.configureApiKey', { provider: settings.provider }));
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
        setApiError(t('errors.generationError', { message: error instanceof Error ? error.message : 'Unknown error' }));
        setIsGenerating(false);
        return null;
      }
    },
    [settings, currentApiKey, t]
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
