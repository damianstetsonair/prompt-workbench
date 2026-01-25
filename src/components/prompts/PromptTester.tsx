import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Sparkles, Zap, Clock, Copy, Check } from 'lucide-react';
import { Button } from '../ui';
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
  
  // Height states for input and output
  const [inputHeight, setInputHeight] = useState(320);
  const [outputHeight, setOutputHeight] = useState(320);
  const [isResizingInput, setIsResizingInput] = useState(false);
  const [isResizingOutput, setIsResizingOutput] = useState(false);
  const [copied, setCopied] = useState(false);
  const resizeStart = useRef({ y: 0, height: 0 });

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
    };

    const handleMouseUp = () => {
      setIsResizingInput(false);
      setIsResizingOutput(false);
    };

    if (isResizingInput || isResizingOutput) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingInput, isResizingOutput]);

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Left column - Input */}
      <div className="space-y-4 overflow-auto">
        <VariablesPanel
          variables={variables}
          values={variableValues}
          onChange={onVariablesChange}
        />

        {/* Spacer to align with metrics row */}
        <div className="h-7" />

        <div>
          <label className="text-sm font-medium mb-2 block">Input</label>
          <div className="relative">
            <textarea
              value={testInput}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg rounded-b-none p-4 text-sm resize-none focus:outline-none focus:border-purple-500"
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
      </div>

      {/* Right column - Output */}
      <div className="space-y-4 overflow-auto">
        {/* Metrics - always reserve space */}
        <div className={`flex gap-3 text-xs h-7 ${hasMetrics ? 'visible' : 'invisible'}`}>
          <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-full">
            <Zap className="w-3 h-3 text-blue-400" />
            <span className="text-gray-400">Input:</span>
            <span className="font-medium">{metrics.inputTokens.toLocaleString()} tokens</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-full">
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-gray-400">Output:</span>
            <span className="font-medium">{metrics.outputTokens.toLocaleString()} tokens</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3 text-yellow-400" />
            <span className="font-medium">{(metrics.responseTime / 1000).toFixed(2)}s</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Output</label>
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
          <div className="relative">
            <div 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg rounded-b-none p-4 text-sm overflow-auto whitespace-pre-wrap"
              style={{ height: outputHeight }}
            >
              {testOutput || <span className="text-gray-500">El output aparecerá aquí...</span>}
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
