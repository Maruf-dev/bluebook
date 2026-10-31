import { Fragment, useMemo, type ReactNode } from 'react';
import katex from 'katex';

// Inline math is written as \( ... \), display math as \[ ... \].
const MATH_RE = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g;

export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => {
    const out: ReactNode[] = [];
    let last = 0;
    let key = 0;
    for (const m of text.matchAll(MATH_RE)) {
      const index = m.index ?? 0;
      if (index > last) out.push(<Fragment key={key++}>{text.slice(last, index)}</Fragment>);
      const displayMode = m[2] !== undefined;
      const html = katex.renderToString(m[1] ?? m[2] ?? '', { displayMode, throwOnError: false });
      out.push(<span key={key++} dangerouslySetInnerHTML={{ __html: html }} />);
      last = index + m[0].length;
    }
    if (last < text.length) out.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
    return out;
  }, [text]);

  return <span className={className}>{parts}</span>;
}
