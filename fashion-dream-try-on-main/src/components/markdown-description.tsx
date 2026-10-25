import { useRef, useState } from "react";

type MarkdownDescriptionEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  rows?: number;
};

function renderInline(text: string) {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\x60[^\x60]+\x60)/g;
  return text.split(pattern).filter(Boolean).map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-black/5 px-1 py-0.5">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export function MarkdownContent({ content, className = "" }: { content: string; className?: string }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Array<{ type: "p" | "h1" | "h2" | "h3" | "ul" | "ol" | "quote"; lines: string[] }> = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const unordered = /^\s*[-*+]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);
    const type = heading ? (heading[1].length === 1 ? "h1" : heading[1].length === 2 ? "h2" : "h3") : unordered ? "ul" : ordered ? "ol" : quote ? "quote" : "p";
    const text = heading ? heading[2] : unordered ? unordered[1] : ordered ? ordered[1] : quote ? quote[1] : line;
    const last = blocks[blocks.length - 1];
    if ((type === "ul" || type === "ol") && last?.type === type) last.lines.push(text);
    else if (type === "p" && last?.type === "p") last.lines.push(text);
    else blocks.push({ type, lines: [text] });
  }

  if (!content.trim()) return <p className={className}>Chưa có mô tả chi tiết.</p>;

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === "ul" || block.type === "ol") {
          const List = block.type;
          return <List key={index} className="my-3 list-inside space-y-1 pl-1">{block.lines.map((line, itemIndex) => <li key={itemIndex}>{renderInline(line)}</li>)}</List>;
        }
        if (block.type === "h1") return <h2 key={index} className="mb-3 mt-5 text-xl font-semibold leading-snug first:mt-0">{renderInline(block.lines.join(" "))}</h2>;
        if (block.type === "h2") return <h3 key={index} className="mb-2 mt-5 text-lg font-semibold leading-snug first:mt-0">{renderInline(block.lines.join(" "))}</h3>;
        if (block.type === "h3") return <h4 key={index} className="mb-2 mt-4 text-base font-semibold leading-snug first:mt-0">{renderInline(block.lines.join(" "))}</h4>;
        if (block.type === "quote") return <blockquote key={index} className="my-3 border-l-2 border-primary/50 pl-4 italic">{renderInline(block.lines.join(" "))}</blockquote>;
        return <p key={index} className="my-3 whitespace-pre-line first:mt-0 last:mb-0">{renderInline(block.lines.join(" "))}</p>;
      })}
    </div>
  );
}

export function MarkdownDescriptionEditor({ value, onChange, disabled = false, rows = 7 }: MarkdownDescriptionEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  function insertMarkdown(before: string, after = before, placeholder = "nội dung") {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const nextValue = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + before.length;
      const cursorEnd = cursorStart + selected.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  const tools = [
    { label: "B", title: "In đậm", before: "**", after: "**", className: "font-bold" },
    { label: "I", title: "In nghiêng", before: "*", after: "*", className: "italic" },
    { label: "H2", title: "Tiêu đề", before: "## ", after: "", className: "font-semibold" },
    { label: "H3", title: "Tiêu đề nhỏ", before: "### ", after: "", className: "font-semibold" },
    { label: "• Danh sách", title: "Danh sách gạch đầu dòng", before: "- ", after: "", className: "" },
    { label: "1. Danh sách", title: "Danh sách đánh số", before: "1. ", after: "", className: "" },
    { label: "Trích dẫn", title: "Trích dẫn", before: "> ", after: "", className: "" },
  ];

  return (
    <div className="mt-2 overflow-hidden rounded-md border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-card/70 p-2">
        {tools.map((tool) => (
          <button key={tool.label} type="button" title={tool.title} disabled={disabled} onClick={() => insertMarkdown(tool.before, tool.after)} className={`rounded border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary disabled:opacity-40 ${tool.className}`}>
            {tool.label}
          </button>
        ))}
        <span className="mx-1 h-5 border-l border-border" />
        <button type="button" disabled={disabled} aria-pressed={preview} onClick={() => setPreview((current) => !current)} className="ml-auto rounded border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary disabled:opacity-40">
          {preview ? "← Chỉnh sửa" : "Xem trước"}
        </button>
      </div>
      {preview ? (
        <div className="min-h-[180px] bg-background px-4 py-3 text-sm leading-7 text-foreground" aria-label="Xem trước mô tả chi tiết">
          <MarkdownContent content={value} />
        </div>
      ) : (
        <textarea ref={textareaRef} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} aria-label="Mô tả chi tiết sản phẩm" className="block w-full resize-y border-0 bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none focus:ring-2 focus:ring-inset focus:ring-primary disabled:opacity-50" placeholder="Mô tả sản phẩm. Dùng thanh công cụ để thêm tiêu đề, chữ đậm, danh sách..." />
      )}
      <div className="border-t border-border px-3 py-2 text-[11px] leading-5 text-muted-foreground">Hỗ trợ tiêu đề, chữ đậm/nghiêng, danh sách và trích dẫn. Nội dung được lưu dưới dạng Markdown để tương thích dữ liệu hiện tại.</div>
    </div>
  );
}
