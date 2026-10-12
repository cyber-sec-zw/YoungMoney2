export interface DataRecoveryError {
  area: string;
  message: string;
}

const DATA_ERROR_EVENT = 'trading-app:data-error';

function messageFrom(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') return error.message;
  return 'The request did not complete. Check your connection and retry.';
}

export function reportDataError(area: string, error: unknown): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<DataRecoveryError>(DATA_ERROR_EVENT, {
    detail: { area, message: messageFrom(error) },
  }));
}

export function dataErrorEventName(): string {
  return DATA_ERROR_EVENT;
}
