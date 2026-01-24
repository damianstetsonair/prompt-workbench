import { Copy, Check, Trash2, Edit3, Play, History } from 'lucide-react';
import { Button } from '../ui';
import type { Prompt, Version, ActiveTab } from '../../types';

interface HeaderProps {
  prompt: Prompt;
  currentVersion: Version | undefined;
  activeTab: ActiveTab;
  copied: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onTabChange: (tab: ActiveTab) => void;
}

export function Header({
  prompt,
  currentVersion,
  activeTab,
  copied,
  onCopy,
  onDelete,
  onTabChange,
}: HeaderProps) {
  return (
    <div className="p-4 border-b border-gray-800 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold">{prompt.name}</h2>
          <p className="text-sm text-gray-500">
            Versión {currentVersion?.version} • {prompt.versions?.length || 0} versiones
          </p>
        </div>
        <button
          onClick={onCopy}
          className={`p-1.5 rounded transition-colors ${
            copied
              ? 'text-green-400 bg-green-900/20'
              : 'text-gray-500 hover:text-blue-400 hover:bg-blue-900/20'
          }`}
          title={copied ? '¡Copiado!' : 'Copiar prompt'}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded"
          title="Eliminar prompt"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'edit' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => onTabChange('edit')}
          icon={<Edit3 className="w-4 h-4" />}
        >
          Editar
        </Button>
        <Button
          variant={activeTab === 'test' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => onTabChange('test')}
          icon={<Play className="w-4 h-4" />}
        >
          Probar
        </Button>
        <Button
          variant={activeTab === 'history' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => onTabChange('history')}
          icon={<History className="w-4 h-4" />}
        >
          Historial
        </Button>
      </div>
    </div>
  );
}
