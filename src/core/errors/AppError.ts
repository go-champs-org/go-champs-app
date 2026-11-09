/** Field name (as the API names it) to the API's messages for that field. */
export type AppFieldErrors = Record<string, string[]>;

export class AppError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly fields?: AppFieldErrors
  ) {
    super(message);
    this.name = 'AppError';
  }
}
