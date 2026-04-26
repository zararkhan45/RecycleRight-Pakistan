import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";
import type { ApiErrorResponse } from "../lib/httpErrors";
import { HttpError } from "../lib/httpErrors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (res.headersSent) return;

  if (err instanceof HttpError) {
    const body: ApiErrorResponse = {
      error: err.error,
      message: err.message,
      ...(err.details === undefined ? {} : { details: err.details }),
    };
    res.status(err.status).json(body);
    return;
  }

  if (err instanceof z.ZodError) {
    const body: ApiErrorResponse = {
      error: "bad_request",
      message: "Validation error",
      details: err.flatten(),
    };
    res.status(400).json(body);
    return;
  }

  logger.error({ err }, "Unhandled error");
  const body: ApiErrorResponse = {
    error: "internal_server_error",
    message: "Internal server error",
  };
  res.status(500).json(body);
}

