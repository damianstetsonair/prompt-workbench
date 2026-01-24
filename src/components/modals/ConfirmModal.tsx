import { Trash2 } from 'lucide-react';
import { Modal, Button } from '../ui';
import type { ConfirmModalState } from '../../types';

interface ConfirmModalProps {
  state: ConfirmModalState;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ state, onClose, onConfirm }: ConfirmModalProps) {
  const getDescription = () => {
    switch (state.type) {
      case 'project':
        return 'Se eliminarán todos los prompts y versiones del proyecto. Esta acción no se puede deshacer.';
      case 'version':
        return 'Esta versión será eliminada permanentemente. Esta acción no se puede deshacer.';
      case 'prompt':
      default:
        return 'Se eliminarán todas las versiones de este prompt. Esta acción no se puede deshacer.';
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
            Cancelar
          </Button>
          <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={onConfirm}>
            Eliminar
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-900/30 rounded-full">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold">Confirmar eliminación</h2>
      </div>

      <p className="text-gray-300 mb-2">
        ¿Estás seguro de que querés eliminar{' '}
        <span className="font-medium text-white">"{state.name}"</span>?
      </p>
      <p className="text-sm text-gray-500">{getDescription()}</p>
    </Modal>
  );
}
