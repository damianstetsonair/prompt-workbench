import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input, Select } from '../ui';
import { PROVIDERS } from '../../constants';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import type { Settings as SettingsType, ModelInfo, Provider } from '../../types';

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
}: SettingsModalProps) {
  const { t, i18n } = useTranslation();

  const handleSave = () => {
    onSave();
    onClose();
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const currentProvider = settings.provider;
  const currentProviderSettings = settings.providers[currentProvider];
  const apiKeyLink = API_KEY_LINKS[currentProvider];

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
      </div>
    </Modal>
  );
}
