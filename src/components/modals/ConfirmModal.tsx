import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '../ui';
import type { ConfirmModalState } from '../../types';

interface ConfirmModalProps {
  state: ConfirmModalState;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ state, onClose, onConfirm }: ConfirmModalProps) {
  const { t } = useTranslation();

  const getMessage = () => {
    switch (state.type) {
      case 'project':
        return t('modals.confirm.deleteProject', { name: state.name });
      case 'version':
        return t('modals.confirm.deleteVersion', { name: state.name });
      case 'prompt':
      default:
        return t('modals.confirm.deletePrompt', { name: state.name });
    }
  };

  return (
    <Modal
      isOpen={state.show}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('modals.confirm.cancel')}
          </Button>
          <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={onConfirm}>
            {t('modals.confirm.delete')}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-900/30 rounded-full">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold">{t('modals.confirm.delete')}</h2>
      </div>

      <p className="text-gray-300">{getMessage()}</p>
    </Modal>
  );
}
