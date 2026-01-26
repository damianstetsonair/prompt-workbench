import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Sparkles, Zap, Clock, Copy, Check, FileText, Code, Plus, X, ChevronDown, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, MarkdownRenderer } from '../ui';
import { VariablesPanel } from './VariablesPanel';
import { PROVIDERS, getModelsForProvider } from '../../constants';
import type { Version, TestSlot, Provider, Settings } from '../../types';

interface TestSlotRowProps {
  slot: TestSlot;
  versions: Version[];
  settings: Settings;
  feedback: string;
  isGenerating: boolean;
  nextVersion: string;
  onUpdate: (updates: Partial<TestSlot>) => void;
  onExecute: () => void;
  onRemove: () => void;
  onFeedbackChange: (feedback: string) => void;
  onGenerateFromFeedback: () => void;
  slotIndex: number;
}

function TestSlotRow({
  slot,
  versions,
  settings,
  feedback,
  isGenerating,
  nextVersion,
  onUpdate,
  onExecute,
  onRemove,
  onFeedbackChange,
  onGenerateFromFeedback,
  slotIndex,
}: TestSlotRowProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMetrics = slot.metrics.inputTokens > 0 || slot.metrics.outputTokens > 0;
  const isLatestVersion = slot.versionIndex === -1;
  
  // Get effective provider and model (slot override or settings default)
  const effectiveProvider = slot.provider || settings.provider;
  const availableModels = getModelsForProvider(effectiveProvider);
  const effectiveModel = slot.model || settings.providers[effectiveProvider].model;
  
  // Handle provider change - also reset model to null when provider changes
  const handleProviderChange = (provider: Provider | '') => {
    if (provider === '') {
      onUpdate({ provider: null, model: null });
    } else {
      onUpdate({ provider, model: null });
    }
  };
  
  // Default sizes
  const DEFAULT_HEIGHT = 280;
  const DEFAULT_WIDTH = 50;
  
  const [inputHeight, setInputHeight] = useState(DEFAULT_HEIGHT);
  const [outputHeight, setOutputHeight] = useState(DEFAULT_HEIGHT);
  const [isResizingInput, setIsResizingInput] = useState(false);
  const [isResizingOutput, setIsResizingOutput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const resizeStart = useRef({ y: 0, height: 0 });
  
  const [leftWidth, setLeftWidth] = useState(DEFAULT_WIDTH);
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const horizontalResizeStart = useRef({ x: 0, width: 0 });
  
  const sizesModified = inputHeight !== DEFAULT_HEIGHT || outputHeight !== DEFAULT_HEIGHT || leftWidth !== DEFAULT_WIDTH;

  // Get selected version display name
  const getVersionLabel = () => {
    if (slot.versionIndex === -1) {
      const latestVersion = versions[versions.length - 1];
      return `v${latestVersion?.version || '0.0'} (${t('tester.latest').toLowerCase()})`;
    }
    const version = versions[slot.versionIndex];
    return `v${version?.version || '0.0'}`;
  };

  const handleCopyOutput = useCallback(async () => {
    if (!slot.output) return;
    try {
      await navigator.clipboard.writeText(slot.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  }, [slot.output]);

  const handleInputResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingInput(true);
    resizeStart.current = { y: e.clientY, height: inputHeight };
  }, [inputHeight]);

  const handleOutputResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingOutput(true);
    resizeStart.current = { y: e.clientY, height: outputHeight };
  }, [outputHeight]);

  const handleHorizontalResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingHorizontal(true);
    horizontalResizeStart.current = { x: e.clientX, width: leftWidth };
  }, [leftWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingInput) {
        const deltaY = e.clientY - resizeStart.current.y;
        setInputHeight(Math.max(150, resizeStart.current.height + deltaY));
      }
      if (isResizingOutput) {
        const deltaY = e.clientY - resizeStart.current.y;
        setOutputHeight(Math.max(150, resizeStart.current.height + deltaY));
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
    <div 
      ref={containerRef} 
      className={`border border-gray-800 rounded-lg p-3 ${slotIndex > 0 ? 'mt-4 bg-gray-900/30' : ''}`}
    >
      <div className="flex">
        {/* Left column - Input */}
        <div className="space-y-2 overflow-auto pr-2" style={{ width: `${leftWidth}%` }}>
          {/* Selectors - two rows */}
          <div className="space-y-1.5">
            {/* Row 1: Version + Provider + Remove button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-400">{t('tester.version')}:</label>
                <div className="relative">
                  <select
                    value={slot.versionIndex}
                    onChange={(e) => onUpdate({ versionIndex: parseInt(e.target.value) })}
                    className="appearance-none bg-gray-800 border border-gray-700 rounded px-2 py-1 pr-6 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value={-1}>{t('tester.latest')} (v{versions[versions.length - 1]?.version || '0.0'})</option>
                    {versions.map((v, idx) => (
                      <option key={v.version} value={idx}>
                        v{v.version} - {v.note?.substring(0, 20) || t('tester.noNote')}
                      </option>
                    )).reverse()}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-400">{t('tester.provider')}:</label>
                <div className="relative">
                  <select
                    value={slot.provider || ''}
                    onChange={(e) => handleProviderChange(e.target.value as Provider | '')}
                    className="appearance-none bg-gray-800 border border-gray-700 rounded px-2 py-1 pr-6 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">{t('tester.default')}</option>
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Only show remove button on additional slots (not the first one) */}
              {slotIndex > 0 && (
                <button
                  onClick={onRemove}
                  className="ml-auto p-1 text-gray-500 hover:text-red-400 transition-colors"
                  title={t('tester.removeTest')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Row 2: Model selector */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-400">{t('tester.model')}:</label>
              <div className="relative">
                <select
                  value={slot.model || ''}
                  onChange={(e) => onUpdate({ model: e.target.value || null })}
                  className="appearance-none bg-gray-800 border border-gray-700 rounded px-2 py-1 pr-6 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="">{t('tester.default')} ({availableModels.find(m => m.id === effectiveModel)?.name || effectiveModel})</option>
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t('tester.input')}</label>
            <div className="relative">
              <textarea
                value={slot.input}
                onChange={(e) => onUpdate({ input: e.target.value })}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !slot.isExecuting) {
                    e.preventDefault();
                    onExecute();
                  }
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg rounded-b-none p-2 text-sm resize-none focus:outline-none focus:border-purple-500"
                style={{ height: inputHeight }}
                placeholder={t('tester.inputPlaceholder')}
              />
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
                disabled={slot.isExecuting || isGenerating}
                loading={slot.isExecuting}
                icon={!slot.isExecuting ? <Play className="w-4 h-4" /> : undefined}
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {slot.isExecuting ? t('tester.executing') : t('tester.execute')}
              </Button>
              <span className="text-[10px] text-gray-500">⌘ + Enter</span>
            </div>
            {sizesModified && (
              <span className="text-[10px] text-gray-500">{t('tester.resetSizes')}</span>
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
          {/* Metrics - with spacer to align with left column selectors (2 rows) */}
          <div className="space-y-1.5">
            <div className={`flex gap-2 text-xs h-6 ${hasMetrics ? 'visible' : 'invisible'}`}>
              <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-full">
                <Zap className="w-3 h-3 text-blue-400" />
                <span className="text-gray-400">{t('metrics.inputTokens')}:</span>
                <span className="font-medium">{slot.metrics.inputTokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-full">
                <Zap className="w-3 h-3 text-green-400" />
                <span className="text-gray-400">{t('metrics.outputTokens')}:</span>
                <span className="font-medium">{slot.metrics.outputTokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="font-medium">{(slot.metrics.responseTime / 1000).toFixed(2)}s</span>
              </div>
              <span className="ml-auto text-[10px] text-gray-500 self-center">{getVersionLabel()}</span>
            </div>
            {/* Spacer to match second row of selectors */}
            <div className="h-6" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">{t('tester.output')}</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowMarkdown(false)}
                    className={`p-1 rounded transition-colors ${
                      !showMarkdown ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                    title={t('tester.plainText')}
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowMarkdown(true)}
                    className={`p-1 rounded transition-colors ${
                      showMarkdown ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                    title={t('tester.markdown')}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
                {slot.output && (
                  <button
                    onClick={handleCopyOutput}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                    title={t('tester.copy')}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">{t('header.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t('tester.copy')}</span>
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
                {slot.output ? (
                  showMarkdown ? (
                    <MarkdownRenderer content={slot.output} />
                  ) : (
                    slot.output
                  )
                ) : (
                  <span className="text-gray-500">{t('tester.outputPlaceholder')}</span>
                )}
              </div>
              <div
                onMouseDown={handleOutputResizeStart}
                className="w-full h-1.5 bg-gray-800 hover:bg-gray-700 cursor-ns-resize rounded-b-lg transition-colors flex items-center justify-center group"
              >
                <div className="w-10 h-px bg-gray-600 group-hover:bg-purple-400 rounded-full transition-colors" />
              </div>
            </div>
          </div>

          {/* Feedback button - only for latest version with output */}
          {slot.output && isLatestVersion && (
            <div>
              {!showFeedback ? (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t('editor.feedbackForNewVersion')}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">{t('editor.feedback')}</h4>
                    <button
                      onClick={() => setShowFeedback(false)}
                      className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <textarea
                    value={feedback}
                    onChange={(e) => onFeedbackChange(e.target.value)}
                    className="w-full h-20 bg-gray-900 border border-gray-600 rounded p-2 text-sm resize-none focus:outline-none focus:border-purple-500"
                    placeholder={t('editor.feedbackPlaceholder')}
                    autoFocus
                  />
                  <Button
                    onClick={onGenerateFromFeedback}
                    disabled={isGenerating || !feedback.trim()}
                    loading={isGenerating}
                    icon={!isGenerating ? <Sparkles className="w-4 h-4" /> : undefined}
                    size="sm"
                    className="mt-2"
                  >
                    {t('editor.generateVersion', { version: nextVersion })}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main PromptTester Component
// ============================================

interface PromptTesterProps {
  slots: TestSlot[];
  versions: Version[];
  settings: Settings;
  feedback: string;
  variables: string[];
  variableValues: Record<string, string>;
  isGenerating: boolean;
  nextVersion: string;
  onUpdateSlot: (slotId: string, updates: Partial<TestSlot>) => void;
  onAddSlot: () => void;
  onRemoveSlot: (slotId: string) => void;
  onExecuteSlot: (slotId: string) => void;
  onFeedbackChange: (feedback: string) => void;
  onVariablesChange: (values: Record<string, string>) => void;
  onGenerateFromFeedback: () => void;
}

export function PromptTester({
  slots,
  versions,
  settings,
  feedback,
  variables,
  variableValues,
  isGenerating,
  nextVersion,
  onUpdateSlot,
  onAddSlot,
  onRemoveSlot,
  onExecuteSlot,
  onFeedbackChange,
  onVariablesChange,
  onGenerateFromFeedback,
}: PromptTesterProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Variables panel - shared across all slots */}
      <VariablesPanel
        variables={variables}
        values={variableValues}
        onChange={onVariablesChange}
      />

      {/* Test slots */}
      {slots.map((slot, index) => (
        <TestSlotRow
          key={slot.id}
          slot={slot}
          versions={versions}
          settings={settings}
          feedback={feedback}
          isGenerating={isGenerating}
          nextVersion={nextVersion}
          onUpdate={(updates) => onUpdateSlot(slot.id, updates)}
          onExecute={() => onExecuteSlot(slot.id)}
          onRemove={() => onRemoveSlot(slot.id)}
          onFeedbackChange={onFeedbackChange}
          onGenerateFromFeedback={onGenerateFromFeedback}
          slotIndex={index}
        />
      ))}

      {/* Add slot button */}
      <button
        onClick={onAddSlot}
        className="w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">{t('tester.addTest')}</span>
      </button>
    </div>
  );
}
