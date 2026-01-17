import { Elysia, t } from "elysia";
import { auth } from "../auth";
import { introspectDB } from "./introspect";
import { connect } from "bun";
import knex from "knex";
import {
  ValidationError,
  ConnectionError,
  DatabaseError,
  InternalServerError,
} from "../errors/handler";

export const introspectController = new Elysia({ prefix: "/introspect" })
  // AUTH
  // TO-DO SAVE DB STRING TO USER PROJECT IN DB

  .post(
    "/",
    async ({ body }) => {
      const { connectionString } = body;

      // Validate connection string format
      if (!connectionString || typeof connectionString !== "string") {
        throw new ValidationError("Connection string is required");
      }

      // Basic validation for PostgreSQL connection string
      if (
        !connectionString.match(
          /^(postgresql|postgres):\/\/|^[^:]+:[^@]+@[^:]+:\d+\/[^?]+/,
        )
      ) {
        throw new ValidationError(
          "Invalid connection string format. Expected PostgreSQL connection string.",
        );
      }

      let pg: knex.Knex | null = null;

      try {
        pg = knex({
          client: "pg",
          connection: connectionString,
          pool: { min: 0, max: 5 },
        });

        // Test connection before proceeding
        await pg.raw("SELECT 1");

        const result = await introspectDB(pg);
        return result;
      } catch (err: unknown) {
        // Log the full error for debugging
        console.error("Database error caught:", err);
        console.error("Error type:", typeof err);
        console.error("Error constructor:", err?.constructor?.name);
        if (err && typeof err === "object") {
          console.error("Error keys:", Object.keys(err));
        }

        // Extract error message from various error types
        let errorMessage = "";
        let errorCode = "";
        let errorDetail = "";
        let errorHint = "";

        if (err instanceof Error) {
          errorMessage = err.message || "";
          // Check for PostgreSQL error properties
          const pgError = err as any;
          if (pgError.code) {
            errorCode = pgError.code;
          }
          if (pgError.detail) {
            errorDetail = pgError.detail;
          }
          if (pgError.hint) {
            errorHint = pgError.hint;
          }
          // Knex errors might have additional properties
          if (pgError.originalError) {
            const original = pgError.originalError;
            if (original.message && (!errorMessage || errorMessage.length === 0)) {
              errorMessage = original.message;
            }
            if (original.code && !errorCode) {
              errorCode = original.code;
            }
            if (original.detail && !errorDetail) {
              errorDetail = original.detail;
            }
            if (original.hint && !errorHint) {
              errorHint = original.hint;
            }
          }
          // Check for nested error properties
          if ((!errorMessage || errorMessage.length === 0) && pgError.cause) {
            const cause = pgError.cause;
            if (cause instanceof Error && cause.message) {
              errorMessage = cause.message;
            } else if (typeof cause === "string") {
              errorMessage = cause;
            }
          }
        } else if (err && typeof err === "object") {
          // Handle object errors
          const errObj = err as any;
          errorMessage =
            errObj.message ||
            errObj.error ||
            errObj.msg ||
            errObj.toString?.() ||
            String(err);
          errorCode = errObj.code || "";
          errorDetail = errObj.detail || "";
          errorHint = errObj.hint || "";
        } else {
          errorMessage = String(err);
        }

        // Build a comprehensive error message
        // Prioritize: message > detail > hint > code
        const messageParts = [
          errorMessage,
          errorDetail,
          errorHint,
          errorCode ? `Error code: ${errorCode}` : "",
        ].filter((part) => part && part.length > 0);

        // If we still don't have a message, use a fallback
        let displayMessage: string =
          messageParts.length > 0
            ? messageParts.join(". ")
            : "";

        // Last resort: try to extract something from the error object
        if (!displayMessage || displayMessage.length === 0) {
          if (err && typeof err === "object") {
            const errObj = err as any;
            // Try to find any string property
            const possibleMessages = [
              errObj.toString?.(),
              errObj.name,
              JSON.stringify(errObj).substring(0, 200), // Limit length
            ].filter(Boolean) as string[];
            displayMessage =
              possibleMessages[0] || "Unknown database error occurred";
          } else {
            displayMessage = String(err) || "Unknown database error occurred";
          }
        }

        // Handle specific database connection errors
        const lowerMessage = displayMessage.toLowerCase();

        if (
          lowerMessage.includes("connection") ||
          lowerMessage.includes("timeout") ||
          lowerMessage.includes("refused") ||
          lowerMessage.includes("econnrefused") ||
          errorCode === "ECONNREFUSED"
        ) {
          throw new ConnectionError(
            `Failed to connect to database: ${displayMessage}. Please check your connection string and ensure the database is accessible.`,
            {
              originalError: errorMessage,
              errorCode,
              errorDetail,
              stack: err instanceof Error ? err.stack : undefined,
            },
          );
        }

        if (
          lowerMessage.includes("authentication") ||
          lowerMessage.includes("password") ||
          lowerMessage.includes("permission") ||
          lowerMessage.includes("password authentication failed") ||
          errorCode === "28P01"
        ) {
          throw new ConnectionError(
            `Database authentication failed: ${displayMessage}. Please check your credentials.`,
            {
              originalError: errorMessage,
              errorCode,
              errorDetail,
              stack: err instanceof Error ? err.stack : undefined,
            },
          );
        }

        if (
          lowerMessage.includes("database") ||
          lowerMessage.includes("schema") ||
          lowerMessage.includes("does not exist") ||
          errorCode === "3D000" ||
          errorCode === "42P01"
        ) {
          throw new DatabaseError(
            `Database or schema not found: ${displayMessage}. Please verify the database name and schema.`,
            {
              originalError: errorMessage,
              errorCode,
              errorDetail,
              stack: err instanceof Error ? err.stack : undefined,
            },
          );
        }

        // Generic database error - include original message in the main message
        throw new DatabaseError(
          `An error occurred while introspecting the database: ${displayMessage}`,
          {
            originalError: errorMessage,
            errorCode,
            errorDetail,
            fullError: err,
            stack: err instanceof Error ? err.stack : undefined,
          },
        );
      } finally {
        // Ensure connection is closed
        if (pg) {
          try {
            await pg.destroy();
          } catch (destroyError) {
            console.error("Error closing database connection:", destroyError);
          }
        }
      }
    },
    {
      body: t.Object({
        connectionString: t.String({
          minLength: 1,
          error: "Connection string cannot be empty",
        }),
      }),
    },
  );
