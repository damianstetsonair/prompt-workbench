import { useRef, useEffect } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '../ui';

interface PromptEditorProps {
  content: string;
  feedback: string;
  isGenerating: boolean;
  onContentChange: (content: string) => void;
  onContentBlur: () => void;
  onFeedbackChange: (feedback: string) => void;
  onGenerateFromFeedback: () => void;
}

export function PromptEditor({
  content,
  feedback,
  isGenerating,
  onContentChange,
  onContentBlur,
  onFeedbackChange,
  onGenerateFromFeedback,
}: PromptEditorProps) {
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const feedbackRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus prompt textarea on mount
  useEffect(() => {
    promptRef.current?.focus();
  }, []);

  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      feedbackRef.current?.focus();
    }
  };

  const handleFeedbackKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      promptRef.current?.focus();
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        ref={promptRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        onBlur={onContentBlur}
        onKeyDown={handlePromptKeyDown}
        className="w-full h-96 bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:border-purple-500"
        placeholder="Escribe tu prompt aquí..."
      />

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Feedback para nueva versión
        </h3>
        <textarea
          ref={feedbackRef}
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          onKeyDown={handleFeedbackKeyDown}
          className="w-full h-24 bg-gray-800 border border-gray-600 rounded p-3 text-sm resize-none focus:outline-none focus:border-purple-500"
          placeholder="Describe qué cambios querés hacer..."
        />
        <Button
          onClick={onGenerateFromFeedback}
          disabled={isGenerating || !feedback.trim()}
          loading={isGenerating}
          icon={!isGenerating ? <Sparkles className="w-4 h-4" /> : undefined}
          className="mt-2"
        >
          Generar nueva versión
        </Button>
      </div>
    </div>
  );
}
