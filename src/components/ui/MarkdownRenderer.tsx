import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Custom styling for markdown elements - compact spacing
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-white mb-1.5 mt-2 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-white mb-1 mt-2 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-gray-200 mb-1 mt-1.5 first:mt-0">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-gray-300 mb-1.5 last:mb-0 leading-normal">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-gray-300 mb-1.5 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-gray-300 mb-1.5 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-gray-300">{children}</li>
        ),
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-gray-800 text-purple-300 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className={`block bg-gray-800 p-2 rounded text-sm font-mono overflow-x-auto ${className}`} {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-gray-800 rounded p-2 mb-1.5 overflow-x-auto">{children}</pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-purple-500 pl-2 py-0.5 my-1.5 text-gray-400 italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-1.5">
            <table className="min-w-full border border-gray-700 rounded">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-800">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-2 py-1 text-left text-gray-300 font-semibold border-b border-gray-700 text-sm">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-2 py-1 text-gray-300 border-b border-gray-700 text-sm">{children}</td>
        ),
        hr: () => (
          <hr className="border-gray-700 my-2" />
        ),
        strong: ({ children }) => (
          <strong className="text-white font-semibold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="text-gray-300 italic">{children}</em>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
