import { useState } from 'react';
import { History, Trash2, Zap, Clock } from 'lucide-react';
import { Button } from '../ui';
import { DiffView } from './DiffView';
import type { Version, TestRun, CompareVersionsState } from '../../types';

interface PromptHistoryProps {
  versions: Version[];
  testRuns: TestRun[];
  currentVersion: Version | undefined;
  onRollback: (version: Version) => void;
  onDeleteVersion: (version: Version) => void;
}

export function PromptHistory({
  versions,
  testRuns,
  currentVersion,
  onRollback,
  onDeleteVersion,
}: PromptHistoryProps) {
  const [compareVersions, setCompareVersions] = useState<CompareVersionsState>({
    old: null,
    new: null,
  });
  const [diffExpanded, setDiffExpanded] = useState(false);

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
            <h3 className="text-sm font-medium mb-2">Versiones</h3>
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
                        <span className="text-xs bg-purple-600 px-1.5 py-0.5 rounded">actual</span>
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
                          title="Eliminar versión"
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
                : 'Selecciona una versión para ver el diff'}
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
                  Restaurar v{compareVersions.new.version}
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDiffExpanded(!diffExpanded)}
              >
                {diffExpanded ? 'Contraer' : 'Expandir'}
              </Button>
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
                  Contenido de v{compareVersions.new.version}:
                </p>
                <pre className="text-xs whitespace-pre-wrap">{compareVersions.new.content}</pre>
              </div>
            ) : (
              <div className="h-full bg-gray-900 rounded-lg p-4 border border-gray-700 text-gray-500 text-sm flex items-center justify-center">
                Click en una versión para ver sus detalles
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent test runs */}
      {testRuns.length > 0 && !diffExpanded && (
        <div>
          <h3 className="text-sm font-medium mb-2">Test Runs Recientes</h3>
          <div className="space-y-2">
            {[...testRuns]
              .reverse()
              .slice(0, 5)
              .map((run) => (
                <div key={run.id} className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>v{run.promptVersion}</span>
                    <div className="flex items-center gap-2">
                      {run.metrics && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {run.metrics.inputTokens + run.metrics.outputTokens} tokens
                          <span className="mx-1">•</span>
                          <Clock className="w-3 h-3" />
                          {(run.metrics.responseTime / 1000).toFixed(2)}s
                        </span>
                      )}
                      <span>{new Date(run.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Input:</span>
                      <p className="truncate">{run.input}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Output:</span>
                      <p className="truncate">{run.output}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
