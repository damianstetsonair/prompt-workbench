import { Check } from 'lucide-react';
import type { ToastState } from '../../types';

interface ToastProps {
  toast: ToastState;
}

export function Toast({ toast }: ToastProps) {
  if (!toast.show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-pulse">
      <div className="bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
        <Check className="w-5 h-5 text-green-400" />
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
