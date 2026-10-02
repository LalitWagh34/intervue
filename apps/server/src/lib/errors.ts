/**
 * Structured Domain Exception Hierarchy
 * Follows RFC 7807 (Problem Details for HTTP APIs)
 */

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  readonly isOperational: boolean = true;
  readonly details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(instance?: string) {
    return {
      type: `https://api.intervue.dev/errors/${this.errorCode.toLowerCase().replace(/_/g, "-")}`,
      title: this.message,
      status: this.statusCode,
      errorCode: this.errorCode,
      detail: this.message,
      details: this.details,
      instance,
      timestamp: Date.now(),
    };
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = "NOT_FOUND";
}

export class BadRequestError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = "BAD_REQUEST";
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = "UNAUTHORIZED";
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = "FORBIDDEN";
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = "CONFLICT";
}

export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly errorCode = "RATE_LIMIT_EXCEEDED";
}

export class ExecutionTimeoutError extends AppError {
  readonly statusCode = 504;
  readonly errorCode = "EXECUTION_TIMEOUT";
}

export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly errorCode = "INTERNAL_SERVER_ERROR";
  override readonly isOperational = false;
}
