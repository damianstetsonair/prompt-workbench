import { diffLines, diffWords } from 'diff';

interface DiffViewProps {
  oldText: string;
  newText: string;
}

export function DiffView({ oldText, newText }: DiffViewProps) {
  // Use jsdiff for accurate line-by-line comparison
  const lineDiff = diffLines(oldText, newText);

  // Count changes
  const additions = lineDiff.filter(d => d.added).reduce((acc, d) => acc + (d.value.split('\n').length - 1 || 1), 0);
  const deletions = lineDiff.filter(d => d.removed).reduce((acc, d) => acc + (d.value.split('\n').length - 1 || 1), 0);

  // Check if there are any changes
  const hasChanges = lineDiff.some(part => part.added || part.removed);

  return (
    <div className="h-full flex flex-col">
      {/* Stats bar */}
      {hasChanges && (
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
        hasChanges ? 'rounded-b-lg border-t-0' : 'rounded-lg'
      }`}>
        {!hasChanges ? (
          <div className="text-gray-500 text-center py-4">Sin cambios</div>
        ) : (
          lineDiff.map((part, partIndex) => {
            // Split into lines for proper rendering
            const lines = part.value.split('\n');
            // Remove last empty line from split (artifact of splitting)
            if (lines[lines.length - 1] === '') {
              lines.pop();
            }

            return lines.map((line, lineIndex) => (
              <div
                key={`${partIndex}-${lineIndex}`}
                className={`px-2 py-0.5 ${
                  part.added
                    ? 'bg-green-900/40 text-green-300'
                    : part.removed
                    ? 'bg-red-900/40 text-red-300 line-through opacity-70'
                    : 'text-gray-400'
                }`}
              >
                <span className={`select-none mr-2 w-4 inline-block text-center ${
                  part.added ? 'text-green-500' : 
                  part.removed ? 'text-red-500' : 'text-gray-600'
                }`}>
                  {part.added ? '+' : part.removed ? '-' : ' '}
                </span>
                <span className="whitespace-pre-wrap">{line || ' '}</span>
              </div>
            ));
          })
        )}
      </div>
    </div>
  );
}

// Optional: Word-level diff component for more granular comparison
export function DiffViewWords({ oldText, newText }: DiffViewProps) {
  const wordDiff = diffWords(oldText, newText);

  return (
    <div className="font-mono text-sm bg-gray-900 rounded-lg p-3 overflow-auto border border-gray-700">
      <div className="whitespace-pre-wrap">
        {wordDiff.map((part, i) => (
          <span
            key={i}
            className={
              part.added
                ? 'bg-green-900/50 text-green-300'
                : part.removed
                ? 'bg-red-900/50 text-red-300 line-through'
                : 'text-gray-400'
            }
          >
            {part.value}
          </span>
        ))}
      </div>
    </div>
  );
}
