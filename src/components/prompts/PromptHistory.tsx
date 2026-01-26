import { useState, useCallback, useEffect, useRef } from 'react';
import { History, Trash2, Zap, X, Copy, Check, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import { DiffView } from './DiffView';
import type { Version, TestRun, CompareVersionsState } from '../../types';

interface PromptHistoryProps {
  versions: Version[];
  testRuns: TestRun[];
  currentVersion: Version | undefined;
  onRollback: (version: Version) => void;
  onDeleteVersion: (version: Version) => void;
  onDeleteTestRun: (runId: string) => void;
  onDeleteAllTestRuns: () => void;
}

export function PromptHistory({
  versions,
  testRuns,
  currentVersion,
  onRollback,
  onDeleteVersion,
  onDeleteTestRun,
  onDeleteAllTestRuns,
}: PromptHistoryProps) {
  const { t } = useTranslation();
  const [compareVersions, setCompareVersions] = useState<CompareVersionsState>({
    old: null,
    new: null,
  });
  const [diffExpanded] = useState(false);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [copiedField, setCopiedField] = useState<'input' | 'output' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<'all' | string | null>(null);
  
  // Run detail panel height
  const [runDetailHeight, setRunDetailHeight] = useState(180);
  const [isResizingRunDetail, setIsResizingRunDetail] = useState(false);
  const resizeStart = useRef({ y: 0, height: 0 });

  const handleCopy = useCallback(async (text: string, field: 'input' | 'output') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  }, []);

  // Cancel delete confirmation when clicking outside
  useEffect(() => {
    if (confirmDelete && confirmDelete !== 'all') {
      const handleClickOutside = () => {
        setConfirmDelete(null);
      };
      // Use a small delay to avoid immediate cancellation on the same click
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [confirmDelete]);

  // Resize handler for run detail panel (drag up to expand)
  const handleRunDetailResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRunDetail(true);
    resizeStart.current = {
      y: e.clientY,
      height: runDetailHeight
    };
  }, [runDetailHeight]);

  // Handle run detail resize mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRunDetail) {
        // Negative delta because dragging up should increase height
        const deltaY = resizeStart.current.y - e.clientY;
        const newHeight = Math.max(120, Math.min(400, resizeStart.current.height + deltaY));
        setRunDetailHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingRunDetail(false);
    };

    if (isResizingRunDetail) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingRunDetail]);

  const handleVersionClick = (version: Version, index: number) => {
    const reversedVersions = [...versions].reverse();
    const prevVersion = reversedVersions[index + 1] || null;
    setCompareVersions({ old: prevVersion, new: version });
  };

  const reversedVersions = [...versions].reverse();

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className={`flex-1 grid gap-4 min-h-0 ${diffExpanded ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Versions list */}
        {!diffExpanded && (
          <div className="flex flex-col min-h-0">
            <h3 className="text-sm font-medium mb-2">{t('history.versionHistory')}</h3>
            <div className="flex-1 overflow-auto space-y-2">
              {reversedVersions.map((version, idx) => (
                <div
                  key={version.version}
                  className={`group p-3 bg-gray-900 rounded-lg border cursor-pointer ${
                    compareVersions.new?.version === version.version
                      ? 'border-purple-500'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => handleVersionClick(version, idx)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">v{version.version}</span>
                      {version.version === currentVersion?.version && (
                        <span className="text-xs bg-purple-600 px-1.5 py-0.5 rounded">{t('history.current')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(version.timestamp).toLocaleDateString()}
                      </span>
                      {versions.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteVersion(version);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 rounded"
                          title={t('history.deleteVersion')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">{version.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diff view */}
        <div className="flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">
              {compareVersions.old && compareVersions.new
                ? `Diff: v${compareVersions.old.version} → v${compareVersions.new.version}`
                : compareVersions.new
                ? `v${compareVersions.new.version}`
                : t('history.compareVersions')}
            </h3>
            <div className="flex items-center gap-2">
              {compareVersions.new && compareVersions.new.version !== currentVersion?.version && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-yellow-600 hover:bg-yellow-700"
                  icon={<History className="w-3 h-3" />}
                  onClick={() => onRollback(compareVersions.new!)}
                >
                  {t('history.rollback')}
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {compareVersions.old && compareVersions.new ? (
              <DiffView
                oldText={compareVersions.old.content}
                newText={compareVersions.new.content}
              />
            ) : compareVersions.new ? (
              <div className="h-full bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-auto">
                <p className="text-sm text-gray-400 mb-2">
                  v{compareVersions.new.version}:
                </p>
                <pre className="text-xs whitespace-pre-wrap">{compareVersions.new.content}</pre>
              </div>
            ) : (
              <div className="h-full bg-gray-900 rounded-lg p-4 border border-gray-700 text-gray-500 text-sm flex items-center justify-center">
                {t('history.selectOldVersion')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent test runs - compact */}
      {testRuns.length > 0 && !diffExpanded && (
        <div className="border-t border-gray-800 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-400">{t('history.recentTests')} ({testRuns.length})</h3>
            {confirmDelete === 'all' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">{t('history.confirmClearAll')}</span>
                <button
                  onClick={() => {
                    onDeleteAllTestRuns();
                    setConfirmDelete(null);
                    setSelectedRun(null);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-medium"
                >
                  {t('history.yes')}
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {t('history.no')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete('all')}
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t('history.clearAll')}</span>
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[...testRuns]
              .reverse()
              .slice(0, 8)
              .map((run) => (
                <div 
                  key={run.id} 
                  className={`group flex-shrink-0 p-2 bg-gray-900 rounded border text-xs min-w-[180px] max-w-[220px] cursor-pointer transition-colors relative ${
                    selectedRun?.id === run.id 
                      ? 'border-purple-500' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                >
                  {/* Delete button for individual run */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirmDelete === run.id) {
                        onDeleteTestRun(run.id);
                        setConfirmDelete(null);
                        if (selectedRun?.id === run.id) setSelectedRun(null);
                      } else {
                        setConfirmDelete(run.id);
                      }
                    }}
                    className={`absolute top-1 right-1 p-0.5 rounded transition-colors ${
                      confirmDelete === run.id 
                        ? 'text-red-400 bg-red-400/20' 
                        : 'opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400'
                    }`}
                    title={confirmDelete === run.id ? 'Click para confirmar' : 'Eliminar run'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="flex justify-between items-center text-gray-500 mb-1 pr-4">
                    <span className="font-mono">v{run.promptVersion}</span>
                    {run.metrics && (
                      <span className="flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        {run.metrics.inputTokens + run.metrics.outputTokens}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 truncate">{run.input || t('tester.noNote')}</p>
                  <p className="text-gray-500 truncate text-[10px] mt-0.5">{run.output.substring(0, 50)}...</p>
                </div>
              ))}
          </div>

          {/* Selected run detail */}
          {selectedRun && (
            <div className="mt-3 flex flex-col">
              {/* Resize handle at top */}
              <div
                onMouseDown={handleRunDetailResizeStart}
                className="w-full h-1.5 bg-gray-800 hover:bg-gray-700 cursor-ns-resize rounded-t-lg transition-colors flex items-center justify-center group"
              >
                <div className="w-10 h-px bg-gray-600 group-hover:bg-purple-400 rounded-full transition-colors" />
              </div>
              
              <div 
                className="p-3 bg-gray-900 rounded-b-lg border border-t-0 border-purple-500/50 flex flex-col"
                style={{ height: runDetailHeight }}
              >
                <div className="flex justify-between items-center mb-3 flex-shrink-0">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-mono text-white">v{selectedRun.promptVersion}</span>
                    {selectedRun.metrics && (
                      <>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-blue-400" />
                          {selectedRun.metrics.inputTokens} in / {selectedRun.metrics.outputTokens} out
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-yellow-400" />
                          {(selectedRun.metrics.responseTime / 1000).toFixed(2)}s
                        </span>
                      </>
                    )}
                    <span>{new Date(selectedRun.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        onDeleteTestRun(selectedRun.id);
                        setSelectedRun(null);
                      }}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title={t('history.deleteRun')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedRun(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
                  <div className="flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-1 flex-shrink-0">
                      <span className="text-xs text-gray-400">{t('tester.input')}</span>
                      <button
                        onClick={() => handleCopy(selectedRun.input || '', 'input')}
                        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors"
                      >
                        {copiedField === 'input' ? (
                          <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">{t('header.copied')}</span></>
                        ) : (
                          <><Copy className="w-3 h-3" /><span>{t('history.copyInput')}</span></>
                        )}
                      </button>
                    </div>
                    <div className="bg-gray-800 rounded p-2 text-xs flex-1 overflow-auto whitespace-pre-wrap">
                      {selectedRun.input || <span className="text-gray-500">{t('tester.noNote')}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-1 flex-shrink-0">
                      <span className="text-xs text-gray-400">{t('tester.output')}</span>
                      <button
                        onClick={() => handleCopy(selectedRun.output, 'output')}
                        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors"
                      >
                        {copiedField === 'output' ? (
                          <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">{t('header.copied')}</span></>
                        ) : (
                          <><Copy className="w-3 h-3" /><span>{t('history.copyOutput')}</span></>
                        )}
                      </button>
                    </div>
                    <div className="bg-gray-800 rounded p-2 text-xs flex-1 overflow-auto whitespace-pre-wrap">
                      {selectedRun.output}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
