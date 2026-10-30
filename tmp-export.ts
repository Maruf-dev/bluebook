export type IPCResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
  timestamp?: number;
};
