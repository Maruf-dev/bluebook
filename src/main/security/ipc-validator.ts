import type { IPCResponse } from '../../shared/types';

export function makeResponse<T>(success: boolean, data?: T, error?: string): IPCResponse<T> {
  return { success, data, error, timestamp: Date.now() };
}

export function requireString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) {
    throw new Error(`Invalid "${name}"`);
  }
  return value;
}

export function requireObject(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid "${name}"`);
  }
  return value as Record<string, unknown>;
}
