import { useRef, useEffect, useState, useCallback } from 'react';
import { MessageSquare, Sparkles, X, GripVertical, Save, FileText, Edit3 } from 'lucide-react';
import { Button, MarkdownRenderer } from '../ui';

interface PromptEditorProps {
  content: string;
  feedback: string;
  isGenerating: boolean;
  promptId?: string;
  closePopupTrigger?: boolean;
  hasUnsavedChanges?: boolean;
  onContentChange: (content: string) => void;
  onContentBlur: () => void;
  onFeedbackChange: (feedback: string) => void;
  onGenerateFromFeedback: () => void;
  onGenerateFromDescription: (description: string) => Promise<void>;
  onSaveVersion: (note: string) => void;
}

export function PromptEditor({
  content,
  feedback,
  isGenerating,
  promptId,
  closePopupTrigger,
  hasUnsavedChanges,
  onContentChange,
  onContentBlur,
  onFeedbackChange,
  onGenerateFromFeedback,
  onGenerateFromDescription,
  onSaveVersion,
}: PromptEditorProps) {
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const feedbackRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [showGeneratePopup, setShowGeneratePopup] = useState(false);
  const [description, setDescription] = useState('');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [versionNote, setVersionNote] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  
  // Textarea height state
  const [textareaHeight, setTextareaHeight] = useState(384); // 96 * 4 = 384px (h-96)
  const [feedbackHeight, setFeedbackHeight] = useState(120); // Altura por defecto más alta
  const [isResizingTextarea, setIsResizingTextarea] = useState(false);
  const [isResizingFeedback, setIsResizingFeedback] = useState(false);
  const textareaResizeStart = useRef({ y: 0, height: 0 });
  
  // Popup position and size state
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [popupSize, setPopupSize] = useState({ width: 420, height: 220 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0, width: 0, height: 0 });

  // Auto-focus prompt textarea on mount
  useEffect(() => {
    promptRef.current?.focus();
  }, []);

  // Close popups when prompt changes or when triggered externally
  useEffect(() => {
    setShowGeneratePopup(false);
    setDescription('');
    setShowSavePopup(false);
    setVersionNote('');
  }, [promptId, closePopupTrigger]);

  // Reset textarea sizes when pressing "r" outside of inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement?.tagName === 'INPUT' || 
                               activeElement?.tagName === 'TEXTAREA';
        if (!isInputFocused) {
          setTextareaHeight(384);
          setFeedbackHeight(120);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus description textarea when popup opens and set initial position
  useEffect(() => {
    if (showGeneratePopup) {
      descriptionRef.current?.focus();
      // Position popup at bottom-right of container (using fixed positioning)
      const container = promptRef.current?.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        setPopupPos({
          x: rect.right - popupSize.width - 16,
          y: rect.bottom - popupSize.height - 16
        });
      }
    }
  }, [showGeneratePopup]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: popupPos.x,
      posY: popupPos.y,
      width: popupSize.width,
      height: popupSize.height
    };
  }, [popupPos, popupSize]);

  // Resize handlers for popup
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: popupPos.x,
      posY: popupPos.y,
      width: popupSize.width,
      height: popupSize.height
    };
  }, [popupPos, popupSize]);

  // Resize handler for textarea
  const handleTextareaResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingTextarea(true);
    textareaResizeStart.current = {
      y: e.clientY,
      height: textareaHeight
    };
  }, [textareaHeight]);

  // Handle textarea resize mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingTextarea) {
        const deltaY = e.clientY - textareaResizeStart.current.y;
        const newHeight = Math.max(200, textareaResizeStart.current.height + deltaY);
        setTextareaHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingTextarea(false);
    };

    if (isResizingTextarea) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingTextarea]);

  // Resize handler for feedback textarea
  const handleFeedbackResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingFeedback(true);
    textareaResizeStart.current = {
      y: e.clientY,
      height: feedbackHeight
    };
  }, [feedbackHeight]);

  // Handle feedback resize mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingFeedback) {
        const deltaY = e.clientY - textareaResizeStart.current.y;
        const newHeight = Math.max(80, textareaResizeStart.current.height + deltaY);
        setFeedbackHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingFeedback(false);
    };

    if (isResizingFeedback) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingFeedback]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        setPopupPos({
          x: dragStart.current.posX + deltaX,
          y: dragStart.current.posY + deltaY
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        
        let newWidth = dragStart.current.width;
        let newHeight = dragStart.current.height;
        let newX = dragStart.current.posX;
        let newY = dragStart.current.posY;

        if (isResizing.includes('left')) {
          newWidth = Math.max(300, dragStart.current.width - deltaX);
          newX = dragStart.current.posX + (dragStart.current.width - newWidth);
        }
        if (isResizing.includes('top')) {
          newHeight = Math.max(200, dragStart.current.height - deltaY);
          newY = dragStart.current.posY + (dragStart.current.height - newHeight);
        }
        if (isResizing.includes('right')) {
          newWidth = Math.max(300, dragStart.current.width + deltaX);
        }
        if (isResizing.includes('bottom')) {
          newHeight = Math.max(200, dragStart.current.height + deltaY);
        }

        setPopupSize({ width: newWidth, height: newHeight });
        setPopupPos({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

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

  const handleGenerate = async () => {
    if (description.trim() && !isGenerating) {
      await onGenerateFromDescription(description);
      setDescription('');
      setShowGeneratePopup(false);
    }
  };

  const isContentEmpty = !content.trim() || content.trim().startsWith('# ') && content.split('\n').length <= 3;

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* View mode toggle */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-gray-800/90 rounded p-0.5">
          <button
            onClick={() => {
              setViewMode('edit');
              setTimeout(() => promptRef.current?.focus(), 0);
            }}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'edit' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Editar (Ctrl+Z para deshacer)"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'preview' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Vista previa Markdown"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>

        {viewMode === 'edit' ? (
          <textarea
            ref={promptRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onBlur={onContentBlur}
            onKeyDown={handlePromptKeyDown}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg rounded-b-none p-4 pr-20 font-mono text-sm resize-none focus:outline-none focus:border-purple-500 focus:border-b-gray-600"
            style={{ height: textareaHeight }}
            placeholder="Escribe tu prompt aquí..."
          />
        ) : (
          <div 
            className="w-full bg-gray-900 border border-gray-700 rounded-lg rounded-b-none p-4 pr-20 overflow-auto cursor-pointer"
            style={{ height: textareaHeight }}
            onClick={() => {
              setViewMode('edit');
              setTimeout(() => promptRef.current?.focus(), 0);
            }}
            title="Click para editar"
          >
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <span className="text-gray-500">Escribe tu prompt aquí...</span>
            )}
          </div>
        )}
        
        {/* Resize handle for textarea */}
        <div
          onMouseDown={handleTextareaResizeStart}
          className="w-full h-1.5 bg-gray-800 hover:bg-gray-700 cursor-ns-resize rounded-b-lg transition-colors flex items-center justify-center group"
        >
          <div className="w-10 h-px bg-gray-600 group-hover:bg-purple-400 rounded-full transition-colors" />
        </div>

        {/* Floating button when content is empty */}
        {isContentEmpty && !showGeneratePopup && viewMode === 'edit' && (
          <button
            onClick={() => setShowGeneratePopup(true)}
            className="absolute bottom-6 right-4 p-3 bg-purple-600 hover:bg-purple-500 rounded-full shadow-lg transition-all hover:scale-110 group"
            title="Generar prompt con IA"
          >
            <Sparkles className="w-5 h-5 text-white animate-pulse group-hover:animate-none" />
          </button>
        )}

        {/* Generate popup */}
        {showGeneratePopup && (
          <div
            ref={popupRef}
            className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-2xl flex flex-col overflow-hidden z-[9999]"
            style={{
              left: popupPos.x,
              top: popupPos.y,
              width: popupSize.width,
              height: popupSize.height,
            }}
          >
            {/* Resize handles */}
            <div
              className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            />
            <div
              className="absolute top-0 left-3 right-3 h-1 cursor-n-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'top')}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'top-right')}
            />
            <div
              className="absolute top-3 left-0 bottom-3 w-1 cursor-w-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'left')}
            />
            <div
              className="absolute top-3 right-0 bottom-3 w-1 cursor-e-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'right')}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
            />
            <div
              className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'bottom')}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            />

            {/* Draggable header */}
            <div
              className="flex items-center justify-between p-4 pb-3 cursor-move select-none flex-shrink-0 border-b border-gray-700"
              onMouseDown={handleDragStart}
            >
              <h4 className="text-base font-medium flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-500" />
                <Sparkles className="w-5 h-5 text-purple-400" />
                Generar prompt con IA
              </h4>
              <button
                onClick={() => {
                  setShowGeneratePopup(false);
                  setDescription('');
                }}
                className="text-gray-400 hover:text-white"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-4 pt-3 overflow-hidden">
              <textarea
                ref={descriptionRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey && description.trim() && !isGenerating) {
                    handleGenerate();
                  }
                  if (e.key === 'Escape') {
                    setShowGeneratePopup(false);
                    setDescription('');
                  }
                }}
                className="w-full flex-1 bg-gray-900 border border-gray-600 rounded-lg p-4 text-sm resize-none focus:outline-none focus:border-purple-500"
                placeholder="Describe qué debe hacer el prompt...&#10;&#10;Ej: 'Un agente que analiza código Python y sugiere mejoras de rendimiento, buenas prácticas y posibles bugs'"
              />
              <div className="flex justify-between items-center mt-3 flex-shrink-0">
                <span className="text-xs text-gray-500">⌘ + Enter para generar</span>
                <Button
                  onClick={handleGenerate}
                  disabled={!description.trim() || isGenerating}
                  loading={isGenerating}
                  size="sm"
                  icon={!isGenerating ? <Sparkles className="w-3 h-3" /> : undefined}
                >
                  Generar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Feedback para nueva versión
        </h3>
        <div className="relative">
          <textarea
            ref={feedbackRef}
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            onKeyDown={handleFeedbackKeyDown}
            className="w-full bg-gray-800 border border-gray-600 rounded rounded-b-none p-3 text-sm resize-none focus:outline-none focus:border-purple-500 focus:border-b-gray-600"
            style={{ height: feedbackHeight }}
            placeholder="Describe qué cambios querés hacer..."
          />
          {/* Resize handle for feedback */}
          <div
            onMouseDown={handleFeedbackResizeStart}
            className="w-full h-1.5 bg-gray-700 hover:bg-gray-600 cursor-ns-resize rounded-b transition-colors flex items-center justify-center group"
          >
            <div className="w-10 h-px bg-gray-500 group-hover:bg-purple-400 rounded-full transition-colors" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={onGenerateFromFeedback}
              disabled={isGenerating || !feedback.trim()}
              loading={isGenerating}
              icon={!isGenerating ? <Sparkles className="w-4 h-4" /> : undefined}
            >
              Generar nueva versión
            </Button>
            <div className="relative">
              <Button
                onClick={() => setShowSavePopup(!showSavePopup)}
                variant="secondary"
                disabled={!hasUnsavedChanges}
                icon={<Save className="w-4 h-4" />}
              >
                Guardar versión
              </Button>
              {showSavePopup && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Nota de versión</span>
                    <button
                      onClick={() => {
                        setShowSavePopup(false);
                        setVersionNote('');
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={versionNote}
                    onChange={(e) => setVersionNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSaveVersion(versionNote || 'Guardado manual');
                        setShowSavePopup(false);
                        setVersionNote('');
                      }
                      if (e.key === 'Escape') {
                        setShowSavePopup(false);
                        setVersionNote('');
                      }
                    }}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500 mb-2"
                    placeholder="Ej: Mejorado el tono (opcional)"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        onSaveVersion(versionNote || 'Guardado manual');
                        setShowSavePopup(false);
                        setVersionNote('');
                      }}
                      size="sm"
                    >
                      Guardar
                    </Button>
                    <Button
                      onClick={() => {
                        setShowSavePopup(false);
                        setVersionNote('');
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {(textareaHeight !== 384 || feedbackHeight !== 120) && (
            <span className="text-[10px] text-gray-500">
              pulsa R para restablecer tamaños
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
