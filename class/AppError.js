/**
 * Custom Application Error
 * @param {string} message
 * @param {number} statusCode
 * @param {string} errorCode - ( e.g., 'INVALID_INPUT', 'NOT_FOUND' )
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
