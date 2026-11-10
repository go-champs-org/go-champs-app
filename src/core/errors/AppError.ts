/** Field name (as the API names it) to the API's messages for that field. */
export type AppFieldErrors = Record<string, string[]>;

export type AppErrorDetails = {
  /** The API's machine-readable error, e.g. `{ "error": "invalid_password" }`. */
  code?: string;
  /** The raw error body, for callers that need more than the code. */
  data?: unknown;
};

export class AppError extends Error {
  readonly code?: string;
  readonly data?: unknown;

  constructor(
    message: string,
    readonly status?: number,
    readonly fields?: AppFieldErrors,
    details: AppErrorDetails = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = details.code;
    this.data = details.data;
  }
}
