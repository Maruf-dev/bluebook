import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function Loading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <RefreshCw className="w-6 h-6 animate-spin mb-2 text-slate-400" />
      <p className="text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function ErrorCard({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="exam-card p-8 text-center">
      <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-500" />
      <h2 className="font-semibold text-slate-900 dark:text-slate-100">{message}</h2>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
      {message}
    </div>
  );
}
