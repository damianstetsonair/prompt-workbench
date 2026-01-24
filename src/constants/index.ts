import type { Settings, ModelInfo, ProviderInfo, Provider } from '../types';

/**
 * Default settings for the application
 */
export const DEFAULT_SETTINGS: Settings = {
  provider: 'anthropic',
  providers: {
    anthropic: {
      apiKey: '',
      model: 'claude-sonnet-4-5-20250929',
    },
    openai: {
      apiKey: '',
      model: 'gpt-4o',
    },
    gemini: {
      apiKey: '',
      model: 'gemini-2.5-flash',
    },
  },
  temperature: 1,
};

/**
 * Anthropic Claude models
 * Updated January 2026
 */
export const ANTHROPIC_MODELS: ModelInfo[] = [
  { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
];

/**
 * OpenAI models
 * Updated January 2026
 */
export const OPENAI_MODELS: ModelInfo[] = [
  { id: 'gpt-5.2', name: 'GPT-5.2' },
  { id: 'gpt-5.1', name: 'GPT-5.1' },
  { id: 'gpt-5', name: 'GPT-5' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano' },
  { id: 'gpt-4.1', name: 'GPT-4.1' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'o3', name: 'O3' },
  { id: 'o3-mini', name: 'O3 Mini' },
  { id: 'o4-mini', name: 'O4 Mini' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
];

/**
 * Google Gemini models
 * Updated January 2026
 */
export const GEMINI_MODELS: ModelInfo[] = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
];

/**
 * All providers with their models
 */
export const PROVIDERS: ProviderInfo[] = [
  { id: 'anthropic', name: 'Anthropic (Claude)', models: ANTHROPIC_MODELS },
  { id: 'openai', name: 'OpenAI', models: OPENAI_MODELS },
  { id: 'gemini', name: 'Google Gemini', models: GEMINI_MODELS },
];

/**
 * Get models for a specific provider
 */
export const getModelsForProvider = (provider: Provider): ModelInfo[] => {
  const providerInfo = PROVIDERS.find((p) => p.id === provider);
  return providerInfo?.models ?? [];
};

/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  DATA: 'prompt-workbench-data',
  SETTINGS: 'prompt-workbench-settings',
} as const;

/**
 * API Configuration per provider
 */
export const API_CONFIG = {
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    version: '2023-06-01',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  maxTokens: 4000,
} as const;
