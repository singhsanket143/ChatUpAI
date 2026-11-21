import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

type Props = {
  content: string;
  role: "user" | "assistant";
};

export function MessageContent({ content, role }: Props) {
  if (role === "user") {
    return <div className="message-text">{content}</div>;
  }

  return (
    <div className="markdown-body">
      <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre({ children, ...props }) {
          return (
            <pre className="code-block" {...props}>
              {children}
            </pre>
          );
        },
        code({ className, children, ...props }) {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className="inline-code" {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content || " "}
      </ReactMarkdown>
    </div>
  );
}