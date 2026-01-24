import { useState, useCallback } from 'react';
import type { ToastState } from '../types';

const TOAST_DURATION = 2000;

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const showToast = useCallback((message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, TOAST_DURATION);
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: '' });
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
