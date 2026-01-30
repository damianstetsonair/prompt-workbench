import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input, Select } from '../ui';
import { PROVIDERS, DEFAULT_SYSTEM_PROMPTS } from '../../constants';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import type { Settings as SettingsType, ModelInfo, Provider, SystemPrompts } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
  onSave: () => void;
  availableModels: ModelInfo[];
  onProviderChange: (provider: Provider) => void;
  onApiKeyChange: (apiKey: string) => void;
  onModelChange: (model: string) => void;
  openToSystemPrompts?: boolean;
}

const API_KEY_LINKS: Record<Provider, { url: string; label: string }> = {
  anthropic: {
    url: 'https://console.anthropic.com/settings/keys',
    label: 'console.anthropic.com',
  },
  openai: {
    url: 'https://platform.openai.com/api-keys',
    label: 'platform.openai.com',
  },
  gemini: {
    url: 'https://aistudio.google.com/apikey',
    label: 'aistudio.google.com',
  },
};

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onSave,
  availableModels,
  onProviderChange,
  onApiKeyChange,
  onModelChange,
  openToSystemPrompts,
}: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [showSystemPrompts, setShowSystemPrompts] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetTarget, setResetTarget] = useState<keyof SystemPrompts | 'all' | null>(null);
  const systemPromptsRef = useRef<HTMLDivElement>(null);

  // Expand system prompts section and scroll when opening directly to it
  useEffect(() => {
    if (isOpen && openToSystemPrompts) {
      setShowSystemPrompts(true);
      // Wait for the section to expand then scroll
      setTimeout(() => {
        systemPromptsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isOpen, openToSystemPrompts]);

  const handleSave = () => {
    onSave();
    onClose();
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleSystemPromptChange = (key: keyof SystemPrompts, value: string) => {
    onSettingsChange({
      ...settings,
      systemPrompts: {
        ...settings.systemPrompts,
        [key]: value,
      },
    });
  };

  const handleResetPrompt = (key: keyof SystemPrompts | 'all') => {
    setResetTarget(key);
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    if (resetTarget === 'all') {
      onSettingsChange({
        ...settings,
        systemPrompts: { ...DEFAULT_SYSTEM_PROMPTS },
      });
    } else if (resetTarget) {
      onSettingsChange({
        ...settings,
        systemPrompts: {
          ...settings.systemPrompts,
          [resetTarget]: DEFAULT_SYSTEM_PROMPTS[resetTarget],
        },
      });
    }
    setShowResetConfirm(false);
    setResetTarget(null);
  };

  const currentProvider = settings.provider;
  const currentProviderSettings = settings.providers[currentProvider];
  const apiKeyLink = API_KEY_LINKS[currentProvider];
  
  // Ensure systemPrompts exists (for backwards compatibility)
  const systemPrompts = settings.systemPrompts || DEFAULT_SYSTEM_PROMPTS;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSave}
      title={t('settings.title')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('modals.confirm.cancel')}
          </Button>
          <Button onClick={handleSave} icon={<Check className="w-4 h-4" />}>
            {t('settings.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Language selector */}
        <Select
          label={t('settings.language')}
          options={SUPPORTED_LANGUAGES.map((lang) => ({ 
            value: lang.code, 
            label: `${lang.flag} ${lang.name}` 
          }))}
          value={i18n.language.split('-')[0]}
          onChange={(e) => handleLanguageChange(e.target.value)}
        />

        {/* Provider selector */}
        <Select
          label={t('settings.provider')}
          options={PROVIDERS.map((p) => ({ value: p.id, label: p.name }))}
          value={currentProvider}
          onChange={(e) => onProviderChange(e.target.value as Provider)}
        />

        {/* API Key for selected provider */}
        <div>
          <Input
            label={`${t('settings.apiKey')} (${PROVIDERS.find(p => p.id === currentProvider)?.name || currentProvider}) *`}
            type="password"
            value={currentProviderSettings.apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={currentProvider === 'anthropic' ? 'sk-ant-...' : currentProvider === 'openai' ? 'sk-...' : 'AIza...'}
            className="font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('settings.getKey')}:{' '}
            <a
              href={apiKeyLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              {apiKeyLink.label}
            </a>
          </p>
        </div>

        {/* Model selector for selected provider */}
        <Select
          label={t('settings.model')}
          options={availableModels.map((m) => ({ value: m.id, label: m.name }))}
          value={currentProviderSettings.model}
          onChange={(e) => onModelChange(e.target.value)}
          hint={`${availableModels.length} ${t('settings.model').toLowerCase()}s`}
        />

        {/* Temperature slider */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Temperature: {settings.temperature.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.temperature}
            onChange={(e) =>
              onSettingsChange({ ...settings, temperature: parseFloat(e.target.value) })
            }
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 - Deterministic</span>
            <span>1 - Creative</span>
          </div>
        </div>

        {/* API Keys status summary */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">API Keys:</p>
          <div className="space-y-1">
            {PROVIDERS.map((provider) => {
              const hasKey = !!settings.providers[provider.id].apiKey;
              return (
                <div key={provider.id} className="flex items-center gap-2 text-xs">
                  <span className={hasKey ? 'text-green-400' : 'text-gray-500'}>
                    {hasKey ? '✓' : '○'}
                  </span>
                  <span className={hasKey ? 'text-gray-300' : 'text-gray-500'}>
                    {provider.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Prompts Section */}
        <div ref={systemPromptsRef} className="pt-4 border-t border-gray-700">
          <button
            onClick={() => setShowSystemPrompts(!showSystemPrompts)}
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors w-full"
          >
            {showSystemPrompts ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {t('settings.systemPrompts')}
          </button>
          
          {showSystemPrompts && (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-gray-500">{t('settings.systemPromptsHint')}</p>
              
              {/* Generate Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">{t('settings.generatePromptLabel')}</label>
                  <button
                    onClick={() => handleResetPrompt('generatePrompt')}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-400 transition-colors"
                    title={t('settings.reset')}
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('settings.reset')}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">{t('settings.generatePromptHint')}</p>
                <textarea
                  value={systemPrompts.generatePrompt}
                  onChange={(e) => handleSystemPromptChange('generatePrompt', e.target.value)}
                  className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-purple-500 font-mono"
                  placeholder={DEFAULT_SYSTEM_PROMPTS.generatePrompt}
                />
              </div>

              {/* Improve Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">{t('settings.improvePromptLabel')}</label>
                  <button
                    onClick={() => handleResetPrompt('improvePrompt')}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-400 transition-colors"
                    title={t('settings.reset')}
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('settings.reset')}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">{t('settings.improvePromptHint')}</p>
                <textarea
                  value={systemPrompts.improvePrompt}
                  onChange={(e) => handleSystemPromptChange('improvePrompt', e.target.value)}
                  className="w-full h-40 bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-purple-500 font-mono"
                  placeholder={DEFAULT_SYSTEM_PROMPTS.improvePrompt}
                />
              </div>

              {/* Reset All Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleResetPrompt('all')}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('settings.resetAll')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-sm mx-4">
              <p className="text-sm mb-4">
                {resetTarget === 'all' 
                  ? t('settings.confirmResetAll')
                  : t('settings.confirmReset')}
              </p>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    setShowResetConfirm(false);
                    setResetTarget(null);
                  }}
                >
                  {t('modals.confirm.cancel')}
                </Button>
                <Button 
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={confirmReset}
                >
                  {t('settings.reset')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
