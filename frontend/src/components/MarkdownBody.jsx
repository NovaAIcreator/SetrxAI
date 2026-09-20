import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownBody({ content }) {
  return (
    <div className="prose-workshop text-[15px] leading-relaxed text-fg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline decoration-border underline-offset-2 hover:decoration-primary">{children}</a>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
          code: ({ className, children }) => className ? (
            <pre className="mb-2 overflow-x-auto rounded-[var(--radius-sm)] bg-fg px-3 py-2 font-mono text-[13px] text-primary-fg"><code>{children}</code></pre>
          ) : (
            <code className="rounded-sm bg-elevated px-1 py-0.5 font-mono text-[13px]">{children}</code>
          ),
          h1: ({ children }) => <h2 className="mb-2 text-lg font-semibold">{children}</h2>,
          h2: ({ children }) => <h3 className="mb-2 text-base font-semibold">{children}</h3>,
          h3: ({ children }) => <h4 className="mb-1 text-sm font-semibold">{children}</h4>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
