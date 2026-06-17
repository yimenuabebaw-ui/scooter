export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const notFound = (message = "Resource not found") => new ApiError(404, message);
export const badRequest = (message: string, details?: unknown) => new ApiError(400, message, details);
export const unauthorized = (message = "Unauthorized") => new ApiError(401, message);
