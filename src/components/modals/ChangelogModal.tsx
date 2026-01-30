import { useTranslation } from 'react-i18next';
import { Modal, Button } from '../ui';
import { CHANGELOG } from '../../constants';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('changelog.title')}
      footer={
        <Button onClick={onClose}>
          {t('editor.close')}
        </Button>
      }
    >
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {CHANGELOG.map((entry, index) => (
          <div key={index} className="border-b border-gray-700 pb-4 last:border-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-semibold text-purple-400">v{entry.version}</span>
              <span className="text-xs text-gray-500">{entry.date}</span>
            </div>
            <ul className="space-y-1.5">
              {entry.changes.map((change, changeIndex) => (
                <li key={changeIndex} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
