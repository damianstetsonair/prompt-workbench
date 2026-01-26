import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input, Textarea } from '../ui';

interface NewPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
  isGenerating: boolean;
}

export function NewPromptModal({
  isOpen,
  onClose,
  onCreate,
  isGenerating,
}: NewPromptModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name, description);
      setName('');
      setDescription('');
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={name.trim() && !isGenerating ? handleCreate : undefined}
      title={t('modals.newPrompt.title')}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('modals.confirm.cancel')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isGenerating}
            loading={isGenerating}
            icon={!isGenerating ? <Plus className="w-4 h-4" /> : undefined}
          >
            {isGenerating ? t('modals.newPrompt.creating') : t('modals.newPrompt.create')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label={t('modals.newPrompt.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim() && !isGenerating) {
              handleCreate();
            }
          }}
          placeholder={t('modals.newPrompt.namePlaceholder')}
          autoFocus
        />

        <Textarea
          label={t('modals.newPrompt.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('modals.newPrompt.descriptionPlaceholder')}
          className="h-32"
        />
      </div>
    </Modal>
  );
}
