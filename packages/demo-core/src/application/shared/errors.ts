/** Thrown by use cases when an entity does not exist. Pages show the not-found / error state. */
export class NotFoundError extends Error {
  constructor(
    public readonly entity: string,
    public readonly id: string,
  ) {
    super(`${entity} "${id}" not found`);
    this.name = 'NotFoundError';
  }
}

/** Thrown by use cases for invalid input that the form validation did not catch. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when the backend cannot answer: an unexpected HTTP status (`status` set) or no response at all
 * (`status` is `null`: network failure, CORS, offline). Pages show their error state.
 */
export class BackendError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message);
    this.name = 'BackendError';
  }
}
