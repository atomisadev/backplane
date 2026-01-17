import { Elysia } from "elysia";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", details?: unknown) {
    super(404, message, "NOT_FOUND", details);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", details?: unknown) {
    super(401, message, "UNAUTHORIZED", details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", details?: unknown) {
    super(403, message, "FORBIDDEN", details);
    this.name = "ForbiddenError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(500, message, "DATABASE_ERROR", details);
    this.name = "DatabaseError";
  }
}

export class ConnectionError extends AppError {
  constructor(message: string, details?: unknown) {
    super(500, message, "CONNECTION_ERROR", details);
    this.name = "ConnectionError";
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error", details?: unknown) {
    super(500, message, "INTERNAL_SERVER_ERROR", details);
    this.name = "InternalServerError";
  }
}

interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: unknown;
    timestamp?: string;
  };
}

export function formatErrorResponse(
  error: unknown,
  includeDetails: boolean = true,
): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(error.details && { details: error.details }),
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (error && typeof error === "object" && "validator" in error) {
    return {
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        statusCode: 400,
        ...(includeDetails && { details: error }),
        timestamp: new Date().toISOString(),
      },
    };
  }

  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";
  const errorDetails =
    includeDetails && error instanceof Error ? error.stack : undefined;

  return {
    error: {
      message: errorMessage,
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
      ...(errorDetails && { details: errorDetails }),
      timestamp: new Date().toISOString(),
    },
  };
}

export const errorHandler = new Elysia({ name: "error-handler" })
  .onError(({ code, error, set }) => {
    console.error(`[${code}] Error:`, error);

    if (error instanceof AppError) {
      set.status = error.statusCode;
      return formatErrorResponse(error);
    }

    switch (code) {
      case "VALIDATION":
        set.status = 400;
        return formatErrorResponse(error);
      case "NOT_FOUND":
        set.status = 404;
        return formatErrorResponse(new NotFoundError());
      case "PARSE":
        set.status = 400;
        return formatErrorResponse(
          new ValidationError("Invalid request body format"),
        );
      case "INTERNAL_SERVER_ERROR":
        set.status = 500;
        return formatErrorResponse(error);
      default:
        set.status = 500;
        return formatErrorResponse(error);
    }
  })
  .onAfterHandle(({ response, set }) => {
    if (response && typeof response === "object" && "error" in response) {
      return response;
    }
    return response;
  });
