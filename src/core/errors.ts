export type ErrorCode =
  | 'NOT_FOUND'
  | 'UNKNOWN_FIELD'
  | 'INVALID_VALUE'
  | 'REQUIRED_MISSING'
  | 'TRANSITION_FORBIDDEN'
  | 'TRANSITION_REQUIRES'
  | 'WIP_LIMIT'
  | 'INVALID_BOARD'
  | 'LOCK_TIMEOUT'
  | 'BAD_REQUEST';

export interface DeskErrorJson {
  code: ErrorCode;
  message: string;
  field: string | null;
  guide: string | null;
  allowed: unknown[] | null;
}

export interface DeskErrorDetails {
  field?: string;
  guide?: string;
  allowed?: unknown[];
}

export class DeskError extends Error {
  readonly code: ErrorCode;
  readonly details: DeskErrorDetails;

  constructor(code: ErrorCode, message: string, details: DeskErrorDetails = {}) {
    super(message);
    this.name = 'DeskError';
    this.code = code;
    this.details = details;
  }

  toJSON(): DeskErrorJson {
    return {
      code: this.code,
      message: this.message,
      field: this.details.field ?? null,
      guide: this.details.guide ?? null,
      allowed: this.details.allowed ?? null,
    };
  }
}

export function isDeskError(e: unknown): e is DeskError {
  return e instanceof DeskError;
}
