// IPC message validation - strict allowlist to prevent arbitrary invocation

import type { IPCResponse } from '@shared/types';

export type AllowedChannel =
  | 'db:init'
  | 'db:get_tests'
  | 'db:get_test'
  | 'db:save_attempt'
  | 'db:get_attempt'
  | 'db:get_attempts'
  | 'db:save_response'
  | 'db:import_test'
  | 'window:minimize'
  | 'window:maximize'
  | 'window:close'
  | 'app:get_version'
  | 'app:get_path';

const ALLOWED_CHANNELS: Record<AllowedChannel, boolean> = {
  'db:init': true,
  'db:get_tests': true,
  'db:get_test': true,
  'db:save_attempt': true,
  'db:get_attempt': true,
  'db:get_attempts': true,
  'db:save_response': true,
  'db:import_test': true,
  'window:minimize': true,
  'window:maximize': true,
  'window:close': true,
  'app:get_version': true,
  'app:get_path': true,
};

export function isAllowedChannel(channel: string): channel is AllowedChannel {
  return ALLOWED_CHANNELS[channel as AllowedChannel] === true;
}

export function validateMessage(message: unknown): boolean {
  if (!message || typeof message !== 'object') return false;
  const m = message as Record<string, unknown>;
  return typeof m['type'] === 'string' && isAllowedChannel(m['type'] as string);
}

export function makeResponse<T>(
  requestId: string | undefined,
  success: boolean,
  data?: T,
  error?: string
): IPCResponse<T> {
  return {
    success,
    data,
    error,
    requestId,
    timestamp: Date.now(),
  };
}
