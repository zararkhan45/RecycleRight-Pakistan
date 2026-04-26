export type ApiErrorResponse = {
  error: string;
  message: string;
  details?: unknown;
};

export class HttpError extends Error {
  status: number;
  error: string;
  details?: unknown;

  constructor(status: number, error: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.error = error;
    this.details = details;
  }
}

export function badRequest(message = "Bad request", details?: unknown) {
  return new HttpError(400, "bad_request", message, details);
}

export function unauthorized(message = "Unauthorized", details?: unknown) {
  return new HttpError(401, "unauthorized", message, details);
}

export function forbidden(message = "Forbidden", details?: unknown) {
  return new HttpError(403, "forbidden", message, details);
}

export function notFound(message = "Not found", details?: unknown) {
  return new HttpError(404, "not_found", message, details);
}

export function conflict(message = "Conflict", details?: unknown) {
  return new HttpError(409, "conflict", message, details);
}

