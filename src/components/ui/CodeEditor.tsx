import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView, keymap } from '@codemirror/view';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  className?: string;
}

// Custom dark theme matching our UI - white text on dark background
const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: '14px',
  },
  '.cm-content': {
    caretColor: '#a78bfa',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    padding: '16px',
    color: '#ffffff',
  },
  '.cm-line': {
    color: '#ffffff',
  },
  '.cm-cursor': {
    borderLeftColor: '#a78bfa',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#a78bfa',
  },
  '.cm-activeLine': {
    backgroundColor: '#1f2937',
  },
  '&.cm-focused .cm-activeLine': {
    backgroundColor: '#1f2937',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#374151 !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#4c1d95 !important',
  },
  '.cm-gutters': {
    backgroundColor: '#111827',
    color: '#9ca3af',
    border: 'none',
    borderRight: '1px solid #374151',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1f2937',
  },
  '.cm-placeholder': {
    color: '#6b7280',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  // Markdown syntax highlighting - all white/light tones
  '.cm-header': {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  '.cm-strong': {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  '.cm-emphasis': {
    color: '#f3f4f6',
    fontStyle: 'italic',
  },
  '.cm-link': {
    color: '#ffffff',
    textDecoration: 'underline',
  },
  '.cm-url': {
    color: '#e5e7eb',
    textDecoration: 'underline',
  },
  '.cm-code': {
    color: '#ffffff',
    backgroundColor: '#1f2937',
    borderRadius: '3px',
  },
  '.cm-quote': {
    color: '#e5e7eb',
    fontStyle: 'italic',
  },
  '.cm-list': {
    color: '#ffffff',
  },
  // Additional selectors for markdown
  '.cm-meta': {
    color: '#ffffff',
  },
  '.cm-processingInstruction': {
    color: '#ffffff',
  },
  // Lists - bullets and numbers
  '.cm-list-1': {
    color: '#ffffff',
  },
  '.cm-list-2': {
    color: '#ffffff',
  },
  '.cm-list-3': {
    color: '#ffffff',
  },
  '.ͼ1 .cm-list': {
    color: '#ffffff',
  },
  // All text tokens white
  '.cm-atom': {
    color: '#ffffff',
  },
  '.cm-number': {
    color: '#ffffff',
  },
  '.cm-keyword': {
    color: '#ffffff',
  },
  '.cm-operator': {
    color: '#ffffff',
  },
  '.cm-punctuation': {
    color: '#ffffff',
  },
  '.cm-string': {
    color: '#ffffff',
  },
  '.cm-variableName': {
    color: '#ffffff',
  },
  // Catch-all for any remaining styled text
  '.cm-content span': {
    color: '#ffffff',
  },
});

export function CodeEditor({
  value,
  onChange,
  onBlur,
  placeholder = '',
  height,
  minHeight = '200px',
  maxHeight,
  autoFocus = false,
  readOnly = false,
  className = '',
}: CodeEditorProps) {
  return (
    <div className={`rounded-lg overflow-hidden border border-gray-700 focus-within:border-purple-500 transition-colors ${className}`}>
      <CodeMirror
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        readOnly={readOnly}
        height={height}
        minHeight={minHeight}
        maxHeight={maxHeight}
        extensions={[
          markdown({ codeLanguages: languages }),
          EditorView.lineWrapping,
          keymap.of([
            {
              key: 'Escape',
              run: (view) => {
                view.contentDOM.blur();
                return true;
              },
            },
          ]),
        ]}
        theme={darkTheme}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          bracketMatching: true,
          autocompletion: false,
          history: true, // This enables undo/redo
          indentOnInput: true,
        }}
      />
    </div>
  );
}
