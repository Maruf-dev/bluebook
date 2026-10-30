declare module 'react-katex' {
  import * as React from 'react';
  import * as katex from 'katex';

  export interface KaTeXProps extends katex.KateXOptions {
    children: string | React.ReactNode;
    displayMode?: boolean;
    errorColor?: string;
    throwOnError?: boolean;
    strict?: boolean;
    onError?: (err: katex.ParseError) => void;
    macros?: Record<string, string>;
    size?: string | number;
    className?: string;
    style?: React.CSSProperties;
  }

  export const KaTeX: React.FC<KaTeXProps>;
  export default KaTeX;
}
