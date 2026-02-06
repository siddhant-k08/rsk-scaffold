/**
 * Error sanitization utility
 * Prevents sensitive internal error details from being exposed to clients
 */

interface SanitizedError {
  message: string;
  code?: string;
}

/**
 * Sanitizes error messages for client responses
 * Logs detailed errors server-side only
 */
export function sanitizeError(error: any, context: string): SanitizedError {
  // Log detailed error server-side
  console.error(`[${context}] Detailed error:`, {
    message: error.message,
    stack: error.stack,
    code: error.code,
    details: error,
  });

  // Return generic error to client based on error type
  if (error.code === "INSUFFICIENT_FUNDS") {
    return {
      message: "Relayer has insufficient funds",
      code: "RELAYER_ERROR",
    };
  }

  if (error.code === "NONCE_EXPIRED" || error.message?.includes("nonce")) {
    return {
      message: "Invalid request",
      code: "INVALID_REQUEST",
    };
  }

  if (error.code === "CALL_EXCEPTION" || error.message?.includes("revert")) {
    return {
      message: "Transaction failed",
      code: "TRANSACTION_FAILED",
    };
  }

  if (error.code === "NETWORK_ERROR" || error.message?.includes("network")) {
    return {
      message: "Network error occurred",
      code: "NETWORK_ERROR",
    };
  }

  if (error.code === "TIMEOUT") {
    return {
      message: "Request timed out",
      code: "TIMEOUT",
    };
  }

  // Default generic error
  return {
    message: "An error occurred processing your request",
    code: "INTERNAL_ERROR",
  };
}

/**
 * Safe error message for validation errors
 * These can be more specific since they don't expose internal state
 */
export function sanitizeValidationError(error: string): string {
  // Validation errors are safe to return as-is since they don't expose internals
  // But we still want to ensure they don't contain any unexpected data
  const safeErrors = [
    "Invalid 'from' address",
    "Invalid 'to' address",
    "Invalid data field",
    "Invalid signature format",
    "Gas must be between",
    "Value must be 0 for gasless transactions",
    "Invalid value field",
    "Invalid nonce value",
    "Target contract not allowed",
  ];

  // Check if error starts with any safe error prefix
  for (const safeError of safeErrors) {
    if (error.startsWith(safeError)) {
      return error;
    }
  }

  // If not a recognized validation error, return generic message
  return "Invalid request parameters";
}
