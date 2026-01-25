import { useState, useCallback } from 'react';

interface UseClipboardProps {
  showToast: (message: string) => void;
}

export function useClipboard({ showToast }: UseClipboardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string | undefined) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('¡Prompt copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Error al copiar');
    }
  }, [showToast]);

  return {
    copied,
    copyToClipboard,
  };
}
