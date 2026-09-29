/**
 * Centralized error handler. Mount as the LAST middleware on the app.
 *
 * - Mongoose validation errors → 400 with field-level details
 * - Duplicate-key errors      → 409
 * - Custom AppError            → its status + message
 * - Everything else            → 500 (with stack in dev only)
 */
export function notFound(req, res, next) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  // Mongoose: bad ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }

  // Mongoose: validation
  if (err.name === "ValidationError") {
    const fields = Object.entries(err.errors).map(([k, v]) => ({
      field: k,
      message: v.message,
    }));
    return res.status(400).json({ error: "Validation failed", fields });
  }

  // Mongo: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ error: `Duplicate value for ${field}` });
  }

  // Multer
  if (err.name === "MulterError") {
    return res.status(400).json({ error: `Upload error (${err.code}): ${err.message}` });
  }

  // Custom thrown error with a status
  const status = err.status || 500;
  const payload = { error: err.message || "Internal server error" };
  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }
  return res.status(status).json(payload);
}

export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
    this.name = "AppError";
  }
}
