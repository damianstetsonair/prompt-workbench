interface DiffViewProps {
  oldText: string;
  newText: string;
}

interface DiffLine {
  type: 'same' | 'added' | 'removed';
  content: string;
}

export function DiffView({ oldText, newText }: DiffViewProps) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);
  const diff: DiffLine[] = [];

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === newLine) {
      diff.push({ type: 'same', content: newLine ?? '' });
    } else if (oldLine === undefined) {
      diff.push({ type: 'added', content: newLine ?? '' });
    } else if (newLine === undefined) {
      diff.push({ type: 'removed', content: oldLine });
    } else {
      diff.push({ type: 'removed', content: oldLine });
      diff.push({ type: 'added', content: newLine });
    }
  }

  return (
    <div className="font-mono text-sm bg-gray-900 rounded-lg p-3 overflow-auto h-full border border-gray-700">
      {diff.map((line, i) => (
        <div
          key={i}
          className={`px-2 py-0.5 ${
            line.type === 'added'
              ? 'bg-green-900/50 text-green-300'
              : line.type === 'removed'
              ? 'bg-red-900/50 text-red-300'
              : 'text-gray-400'
          }`}
        >
          <span className="select-none mr-2">
            {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
          </span>
          {line.content || ' '}
        </div>
      ))}
    </div>
  );
}
