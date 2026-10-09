import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { field: string; message: string }[],
  ) {
    super(message);
  }
}

export function fromZod(err: ZodError) {
  const details = err.issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
  return new HttpError(400, "Validation failed", details);
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
  } else if (err.type === "entity.parse.failed") {
    res.status(400).json({ error: "Request body is not valid JSON" });
  } else {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
