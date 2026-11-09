import { AppError } from '../core/errors/AppError';

export const messageFromError = (error: unknown, fallback: string) =>
  error instanceof AppError ? error.message : fallback;

export const fieldsFromError = (error: unknown) => (error instanceof AppError ? error.fields : undefined);

/** Drops one field's error once the user edits that field. */
export const withoutField = <E extends object>(errors: E, field: keyof E): E => {
  if (!(field in errors)) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
};
