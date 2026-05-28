export type AppErrorOptions = {
  code: string;
  message: string;
  statusCode: number;
  cause?: unknown;
  expose?: boolean;
};

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly expose: boolean;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "AppError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.expose = options.expose ?? options.statusCode < 500;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function badRequest(message: string, code = "BAD_REQUEST"): AppError {
  return new AppError({ code, message, statusCode: 400 });
}

export function unauthorized(message = "Authentication is required."): AppError {
  return new AppError({ code: "UNAUTHORIZED", message, statusCode: 401 });
}

export function forbidden(message = "You do not have access to this resource."): AppError {
  return new AppError({ code: "FORBIDDEN", message, statusCode: 403 });
}

export function notFound(message = "Resource not found."): AppError {
  return new AppError({ code: "NOT_FOUND", message, statusCode: 404 });
}
