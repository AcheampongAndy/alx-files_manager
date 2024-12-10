/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from 'express';

/**
 * Custom API error class to represent application-specific errors.
 */
export class APIError extends Error {
  /**
   * @param {number} code - HTTP status code
   * @param {string} message - Error message
   */
  constructor(code, message) {
    super(message);
    this.code = code || 500;
  }
}

/**
 * Global error-handling middleware.
 * Sends a formatted error response for API errors or unexpected issues.
 * @param {Error} err - The error object
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 * @param {NextFunction} next - The Express next function
 */
export const errorResponse = (err, req, res, next) => {
  const defaultMsg = `Failed to process ${req.method} ${req.url}`;
  const statusCode = err instanceof APIError ? err.code : 500;

  res.status(statusCode).json({
    error: err?.message || defaultMsg,
  });
};