/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { getUserFromXToken, getUserFromAuthorization } from '../utils/auth';

/**
 * Middleware for Basic authentication.
 * Verifies the user credentials passed via the `Authorization` header.
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 * @param {NextFunction} next - The Express next function
 */
export const basicAuthenticate = async (req, res, next) => {
  try {
    const user = await getUserFromAuthorization(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware for X-Token authentication.
 * Verifies the user token passed via the `X-Token` header.
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 * @param {NextFunction} next - The Express next function
 */
export const xTokenAuthenticate = async (req, res, next) => {
  try {
    const user = await getUserFromXToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication failed' });
  }
};