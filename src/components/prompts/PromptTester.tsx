import { Play, Sparkles, Zap, Clock } from 'lucide-react';
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

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Left column - Input */}
      <div className="space-y-4 overflow-auto">
        <VariablesPanel
          variables={variables}
          values={variableValues}
          onChange={onVariablesChange}
        />

        <div>
          <label className="text-sm font-medium mb-2 block">Input</label>
          <textarea
            value={testInput}
            onChange={(e) => onInputChange(e.target.value)}
            className="w-full h-48 bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm resize-none focus:outline-none focus:border-purple-500"
            placeholder="Escribe el input para probar el prompt..."
          />
        </div>

        <Button
          onClick={onExecute}
          disabled={isExecuting || !testInput.trim()}
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
        {/* Metrics */}
        {hasMetrics && (
          <div className="flex gap-3 text-xs">
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
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">Output</label>
          <div className="w-full h-48 bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm overflow-auto whitespace-pre-wrap">
            {testOutput || <span className="text-gray-500">El output aparecerá aquí...</span>}
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
