import { useState } from 'react';
import { Plus } from 'lucide-react';
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
      title="Nuevo Prompt"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isGenerating}
            loading={isGenerating}
            icon={!isGenerating ? <Plus className="w-4 h-4" /> : undefined}
          >
            Crear
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim() && !isGenerating) {
              handleCreate();
            }
          }}
          placeholder="ej: Orchestrator, Email Writer..."
          autoFocus
        />

        <Textarea
          label="Descripción (opcional - Claude generará el prompt inicial)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe qué debe hacer el prompt... ej: 'Un agente que analiza datos de CRM y genera recomendaciones de outreach personalizadas'"
          className="h-32"
        />
      </div>
    </Modal>
  );
}
