import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface UseClipboardProps {
  showToast: (message: string) => void;
}

export function useClipboard({ showToast }: UseClipboardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string | undefined) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast(t('toast.promptCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(t('toast.copyError'));
    }
  }, [showToast, t]);

  return {
    copied,
    copyToClipboard,
  };
}
