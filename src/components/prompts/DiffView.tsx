interface DiffViewProps {
  oldText: string;
  newText: string;
}

interface DiffLine {
  type: 'same' | 'added' | 'removed';
  content: string;
}

// Compute Longest Common Subsequence for better diff
function computeLCS(oldLines: string[], newLines: string[]): number[][] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0) as number[]);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  return dp;
}

function buildDiff(oldLines: string[], newLines: string[], dp: number[][]): DiffLine[] {
  let i = oldLines.length;
  let j = newLines.length;

  const result: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'same', content: oldLines[i - 1] || '' });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || (dp[i]?.[j - 1] ?? 0) >= (dp[i - 1]?.[j] ?? 0))) {
      result.unshift({ type: 'added', content: newLines[j - 1] || '' });
      j--;
    } else if (i > 0) {
      result.unshift({ type: 'removed', content: oldLines[i - 1] || '' });
      i--;
    }
  }

  return result;
}

export function DiffView({ oldText, newText }: DiffViewProps) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Use LCS-based diff algorithm
  const dp = computeLCS(oldLines, newLines);
  const diff = buildDiff(oldLines, newLines, dp);

  // Count changes
  const additions = diff.filter(d => d.type === 'added').length;
  const deletions = diff.filter(d => d.type === 'removed').length;

  return (
    <div className="h-full flex flex-col">
      {/* Stats bar */}
      {(additions > 0 || deletions > 0) && (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-800 border-b border-gray-700 text-xs rounded-t-lg">
          {additions > 0 && (
            <span className="text-green-400">+{additions} línea{additions !== 1 ? 's' : ''}</span>
          )}
          {deletions > 0 && (
            <span className="text-red-400">-{deletions} línea{deletions !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}
      
      {/* Diff content */}
      <div className={`font-mono text-sm bg-gray-900 p-3 overflow-auto flex-1 border border-gray-700 ${
        additions > 0 || deletions > 0 ? 'rounded-b-lg border-t-0' : 'rounded-lg'
      }`}>
        {diff.length === 0 ? (
          <div className="text-gray-500 text-center py-4">Sin cambios</div>
        ) : (
          diff.map((line, i) => (
            <div
              key={i}
              className={`px-2 py-0.5 ${
                line.type === 'added'
                  ? 'bg-green-900/40 text-green-300'
                  : line.type === 'removed'
                  ? 'bg-red-900/40 text-red-300 line-through opacity-70'
                  : 'text-gray-400'
              }`}
            >
              <span className={`select-none mr-2 w-4 inline-block text-center ${
                line.type === 'added' ? 'text-green-500' : 
                line.type === 'removed' ? 'text-red-500' : 'text-gray-600'
              }`}>
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              <span className="whitespace-pre-wrap">{line.content || ' '}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
