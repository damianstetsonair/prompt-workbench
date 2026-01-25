import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Sparkles, Zap, Clock, Copy, Check, FileText, Code } from 'lucide-react';
import { Button, MarkdownRenderer } from '../ui';
import { VariablesPanel } from './VariablesPanel';
import type { Metrics } from '../../types';

interface PromptTesterProps {
  testInput: string;
  testOutput: string;
  feedback: string;
  variables: string[];
  variableValues: Record<string, string>;
  metrics: Metrics;
  isExecuting: boolean;
  isGenerating: boolean;
  nextVersion: string;
  onInputChange: (input: string) => void;
  onFeedbackChange: (feedback: string) => void;
  onVariablesChange: (values: Record<string, string>) => void;
  onExecute: () => void;
  onGenerateFromFeedback: () => void;
}

export function PromptTester({
  testInput,
  testOutput,
  feedback,
  variables,
  variableValues,
  metrics,
  isExecuting,
  isGenerating,
  nextVersion,
  onInputChange,
  onFeedbackChange,
  onVariablesChange,
  onExecute,
  onGenerateFromFeedback,
}: PromptTesterProps) {
  const hasMetrics = metrics.inputTokens > 0 || metrics.outputTokens > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Default sizes
  const DEFAULT_HEIGHT = 320;
  const DEFAULT_WIDTH = 50;
  
  // Height states for input and output
  const [inputHeight, setInputHeight] = useState(DEFAULT_HEIGHT);
  const [outputHeight, setOutputHeight] = useState(DEFAULT_HEIGHT);
  const [isResizingInput, setIsResizingInput] = useState(false);
  const [isResizingOutput, setIsResizingOutput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(true);
  const resizeStart = useRef({ y: 0, height: 0 });
  
  // Horizontal resize for columns
  const [leftWidth, setLeftWidth] = useState(DEFAULT_WIDTH); // percentage
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const horizontalResizeStart = useRef({ x: 0, width: 0 });
  
  // Check if sizes have been modified
  const sizesModified = inputHeight !== DEFAULT_HEIGHT || outputHeight !== DEFAULT_HEIGHT || leftWidth !== DEFAULT_WIDTH;

  // Copy output to clipboard
  const handleCopyOutput = useCallback(async () => {
    if (!testOutput) return;
    try {
      await navigator.clipboard.writeText(testOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  }, [testOutput]);

  // Resize handler for input
  const handleInputResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingInput(true);
    resizeStart.current = {
      y: e.clientY,
      height: inputHeight
    };
  }, [inputHeight]);

  // Resize handler for output
  const handleOutputResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingOutput(true);
    resizeStart.current = {
      y: e.clientY,
      height: outputHeight
    };
  }, [outputHeight]);

  // Horizontal resize handler
  const handleHorizontalResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingHorizontal(true);
    horizontalResizeStart.current = {
      x: e.clientX,
      width: leftWidth
    };
  }, [leftWidth]);

  // Handle resize mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingInput) {
        const deltaY = e.clientY - resizeStart.current.y;
        const newHeight = Math.max(150, resizeStart.current.height + deltaY);
        setInputHeight(newHeight);
      }
      if (isResizingOutput) {
        const deltaY = e.clientY - resizeStart.current.y;
        const newHeight = Math.max(150, resizeStart.current.height + deltaY);
        setOutputHeight(newHeight);
      }
      if (isResizingHorizontal && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        setLeftWidth(Math.max(20, Math.min(80, newWidth)));
      }
    };

    const handleMouseUp = () => {
      setIsResizingInput(false);
      setIsResizingOutput(false);
      setIsResizingHorizontal(false);
    };

    if (isResizingInput || isResizingOutput || isResizingHorizontal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingInput, isResizingOutput, isResizingHorizontal]);

  // Reset sizes when pressing "R" outside of inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement?.tagName === 'INPUT' || 
                               activeElement?.tagName === 'TEXTAREA' ||
                               activeElement?.closest('.cm-editor');
        if (!isInputFocused && sizesModified) {
          setInputHeight(DEFAULT_HEIGHT);
          setOutputHeight(DEFAULT_HEIGHT);
          setLeftWidth(DEFAULT_WIDTH);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sizesModified]);

  return (
    <div ref={containerRef} className="flex h-full">
      {/* Left column - Input */}
      <div className="space-y-2 overflow-auto pr-2" style={{ width: `${leftWidth}%` }}>
        <VariablesPanel
          variables={variables}
          values={variableValues}
          onChange={onVariablesChange}
        />

        {/* Spacer to align with metrics row */}
        <div className="h-6" />

        <div>
          <label className="text-sm font-medium mb-1 block">Input</label>
          <div className="relative">
            <textarea
              value={testInput}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isExecuting) {
                  e.preventDefault();
                  onExecute();
                }
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg rounded-b-none p-2 text-sm resize-none focus:outline-none focus:border-purple-500"
              style={{ height: inputHeight }}
              placeholder="Escribe el input para probar el prompt..."
            />
            {/* Resize handle for input */}
            <div
              onMouseDown={handleInputResizeStart}
              className="w-full h-1.5 bg-gray-800 hover:bg-gray-700 cursor-ns-resize rounded-b-lg transition-colors flex items-center justify-center group"
            >
              <div className="w-10 h-px bg-gray-600 group-hover:bg-purple-400 rounded-full transition-colors" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={onExecute}
              disabled={isExecuting}
              loading={isExecuting}
              icon={!isExecuting ? <Play className="w-4 h-4" /> : undefined}
              variant="primary"
              className="bg-green-600 hover:bg-green-700"
            >
              Ejecutar
            </Button>
            <span className="text-[10px] text-gray-500">⌘ + Enter</span>
          </div>
          {sizesModified && (
            <span className="text-[10px] text-gray-500">pulsa R para restablecer tamaños</span>
          )}
        </div>
      </div>

      {/* Horizontal resize handle */}
      <div
        onMouseDown={handleHorizontalResizeStart}
        className="w-1.5 flex-shrink-0 bg-gray-800 hover:bg-gray-700 cursor-ew-resize transition-colors flex items-center justify-center group mx-1"
      >
        <div className="h-10 w-px bg-gray-600 group-hover:bg-purple-400 rounded-full transition-colors" />
      </div>

      {/* Right column - Output */}
      <div className="space-y-2 overflow-auto flex-1 pl-2">
        {/* Metrics - always reserve space */}
        <div className={`flex gap-2 text-xs h-6 ${hasMetrics ? 'visible' : 'invisible'}`}>
          <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-full">
            <Zap className="w-3 h-3 text-blue-400" />
            <span className="text-gray-400">In:</span>
            <span className="font-medium">{metrics.inputTokens.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-full">
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-gray-400">Out:</span>
            <span className="font-medium">{metrics.outputTokens.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3 text-yellow-400" />
            <span className="font-medium">{(metrics.responseTime / 1000).toFixed(2)}s</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Output</label>
            <div className="flex items-center gap-3">
              {/* Markdown toggle */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowMarkdown(false)}
                  className={`p-1 rounded transition-colors ${
                    !showMarkdown 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  title="Texto plano"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowMarkdown(true)}
                  className={`p-1 rounded transition-colors ${
                    showMarkdown 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  title="Markdown"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Copy button */}
              {testOutput && (
                <button
                  onClick={handleCopyOutput}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                  title="Copiar output"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="relative">
            <div 
              className={`w-full bg-gray-900 border border-gray-700 rounded-lg rounded-b-none p-2 text-sm overflow-auto ${
                !showMarkdown ? 'whitespace-pre-wrap' : ''
              }`}
              style={{ height: outputHeight }}
            >
              {testOutput ? (
                showMarkdown ? (
                  <MarkdownRenderer content={testOutput} />
                ) : (
                  testOutput
                )
              ) : (
                <span className="text-gray-500">El output aparecerá aquí...</span>
              )}
            </div>
            {/* Resize handle for output */}
            <div
              onMouseDown={handleOutputResizeStart}
              className="w-full h-1.5 bg-gray-800 hover:bg-gray-700 cursor-ns-resize rounded-b-lg transition-colors flex items-center justify-center group"
            >
              <div className="w-10 h-px bg-gray-600 group-hover:bg-purple-400 rounded-full transition-colors" />
            </div>
          </div>
        </div>

        {testOutput && (
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium mb-2">Feedback</h3>
            <textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              className="w-full h-20 bg-gray-800 border border-gray-600 rounded p-3 text-sm resize-none focus:outline-none focus:border-purple-500"
              placeholder="¿Qué mejorarías del output?"
            />
            <Button
              onClick={onGenerateFromFeedback}
              disabled={isGenerating || !feedback.trim()}
              loading={isGenerating}
              icon={!isGenerating ? <Sparkles className="w-4 h-4" /> : undefined}
              className="mt-2"
            >
              Generar v{nextVersion}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
