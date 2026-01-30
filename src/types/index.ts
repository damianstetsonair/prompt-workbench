// ============================================
// Core Data Types
// ============================================

export interface Version {
  version: string;
  content: string;
  timestamp: number;
  note: string;
}

export interface TestRunMetrics {
  inputTokens: number;
  outputTokens: number;
  responseTime: number;
}

export interface TestRun {
  id: string;
  input: string;
  output: string;
  promptVersion: string;
  timestamp: number;
  variables: Record<string, string>;
  metrics?: TestRunMetrics;
}

export interface Prompt {
  id: string;
  name: string;
  versions: Version[];
  testRuns: TestRun[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  prompts: Record<string, Prompt>;
}

export interface WorkbenchData {
  projects: Record<string, Project>;
}

// ============================================
// Settings & Configuration
// ============================================

export type Provider = 'anthropic' | 'openai' | 'gemini';

export interface ProviderSettings {
  apiKey: string;
  model: string;
}

export interface SystemPrompts {
  generatePrompt: string;
  improvePrompt: string;
}

export interface Settings {
  provider: Provider;
  providers: Record<Provider, ProviderSettings>;
  temperature: number;
  systemPrompts: SystemPrompts;
}

export interface ModelInfo {
  id: string;
  name: string;
}

export interface ProviderInfo {
  id: Provider;
  name: string;
  models: ModelInfo[];
}

// ============================================
// UI State Types
// ============================================

export type ActiveTab = 'edit' | 'test' | 'history';

export interface EditingState {
  type: 'project' | 'prompt';
  id: string;
}

export interface DraggedPromptState {
  promptId: string;
  sourceProjectId: string;
}

export interface CompareVersionsState {
  old: Version | null;
  new: Version | null;
}

export interface ToastState {
  show: boolean;
  message: string;
}

export interface ConfirmModalState {
  show: boolean;
  type: 'project' | 'prompt' | 'version' | null;
  id: string | null;
  projectId: string | null;
  promptId?: string;
  name: string;
}

export interface Metrics {
  inputTokens: number;
  outputTokens: number;
  responseTime: number;
}

export interface TestSlot {
  id: string;
  versionIndex: number; // Index into versions array, -1 means latest
  input: string;
  output: string;
  metrics: Metrics;
  isExecuting: boolean;
  provider: Provider | null; // null means use default from settings
  model: string | null; // null means use default from settings
}

// ============================================
// API Types
// ============================================

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeApiResponse {
  content?: Array<{ text: string }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  error?: {
    message: string;
  };
}

export interface ClaudeApiResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  responseTime: number;
}

export interface ModelsApiResponse {
  data?: Array<{
    id: string;
    display_name?: string;
  }>;
  error?: {
    message: string;
  };
}
