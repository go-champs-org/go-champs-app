import { AppError } from '../../../core/errors/AppError';

// A username without an athlete profile answers its lists with a 404: read
// that as no games rather than as a failure.
export const emptyWhenMissing = <T>(request: Promise<T[]>): Promise<T[]> =>
  request.catch((error: unknown) => {
    if (error instanceof AppError && error.status === 404) return [];
    throw error;
  });
