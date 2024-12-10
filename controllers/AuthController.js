/* eslint-disable import/no-named-as-default */
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';

export default class AuthController {
  /**
   * GET /connect
   * Authenticates a user and generates a token for session management.
   * @param {Request} req - The Express request object
   * @param {Response} res - The Express response object
   */
  static async getConnect(req, res) {
    try {
      const { user } = req;
      const token = uuidv4();

      // Store the token in Redis with a 24-hour expiration
      await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);

      // Respond with the generated token
      return res.status(200).json({ token });
    } catch (error) {
      // Handle unexpected errors
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * GET /disconnect
   * Logs out a user by removing their token from Redis.
   * @param {Request} req - The Express request object
   * @param {Response} res - The Express response object
   */
  static async getDisconnect(req, res) {
    try {
      const token = req.headers['x-token'];

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Remove the token from Redis
      await redisClient.del(`auth_${token}`);

      // Respond with no content
      return res.status(204).send();
    } catch (error) {
      // Handle unexpected errors
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}