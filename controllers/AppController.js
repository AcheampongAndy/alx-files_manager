/* eslint-disable import/no-named-as-default */
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class AppController {
  /**
   * GET /status
   * Checks the status of Redis and MongoDB
   * @param {Request} req - The Express request object
   * @param {Response} res - The Express response object
   */
  static getStatus(req, res) {
    try {
      res.status(200).json({
        redis: redisClient.isAlive(),
        db: dbClient.isAlive(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * GET /stats
   * Retrieves statistics for the number of users and files
   * @param {Request} req - The Express request object
   * @param {Response} res - The Express response object
   */
  static async getStats(req, res) {
    try {
      const [usersCount, filesCount] = await Promise.all([dbClient.nbUsers(), dbClient.nbFiles()]);
      res.status(200).json({ users: usersCount, files: filesCount });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}