import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function sanitizeMarkdownUrl(url: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";

  // Allow relative paths and same-page hash anchors
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, "https://intervue.local");
    // Only allow explicit http/https/mailto if a scheme was provided
    if (trimmed.includes(":")) {
      return SAFE_PROTOCOLS.has(parsed.protocol) ? trimmed : "";
    }
    return trimmed;
  } catch {
    return "";
  }
}

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

export function SafeMarkdown({ content, className }: SafeMarkdownProps) {
  return (
    <div className={cn("max-w-none text-sm leading-7 text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={sanitizeMarkdownUrl}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-6 mb-3 text-2xl font-semibold tracking-tight text-foreground first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 mb-2.5 text-xl font-semibold tracking-tight text-foreground border-b border-border/60 pb-1.5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 mb-2 text-base font-semibold text-foreground first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-3.5 text-sm leading-7 text-muted-foreground last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-6">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-primary/60 bg-muted/30 px-4 py-2.5 text-sm italic text-muted-foreground rounded-r-md">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isBlock = Boolean(codeClassName && codeClassName.includes("language-"));
            if (isBlock) {
              return (
                <code
                  className={cn(
                    "block font-mono text-xs leading-6 text-foreground",
                    codeClassName
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground border border-border/50"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-6">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
              {children}
            </thead>
          ),
          th: ({ children }) => <th className="px-3 py-2">{children}</th>,
          td: ({ children }) => (
            <td className="border-t border-border/60 px-3 py-2 text-muted-foreground">
              {children}
            </td>
          ),
          a: ({ href, children }) => {
            const safeHref = href ? sanitizeMarkdownUrl(href) : "";
            if (!safeHref) {
              return <span className="text-muted-foreground">{children}</span>;
            }
            const isExternal = safeHref.startsWith("http://") || safeHref.startsWith("https://");
            return (
              <a
                href={safeHref}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
              >
                {children}
              </a>
            );
          },
          hr: () => <hr className="my-6 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

