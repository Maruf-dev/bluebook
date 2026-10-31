import type { IPCResponse } from '@shared/types';

/** Calls the main process and unwraps the response; throws with the main-process error message on failure. */
export async function invoke<T>(channel: string, payload?: unknown): Promise<T> {
  const api = window.examDeskAPI;
  if (!api) throw new Error('ExamDesk API is unavailable — run the app through Electron (npm run dev).');
  const res: IPCResponse<T> = await api.invoke<T>(channel, payload);
  if (!res.success) throw new Error(res.error || `Request failed: ${channel}`);
  return res.data as T;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
