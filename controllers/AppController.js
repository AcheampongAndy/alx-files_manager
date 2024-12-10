// Import the Redis and MongoDB clients
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

// Define the AppController class
class AppController {
  // GET /status: Check the status of Redis and MongoDB
  static getStatus(req, res) {
    const redisAlive = redisClient.isAlive();
    const dbAlive = dbClient.isAlive();
    
    res.status(200).json({ redis: redisAlive, db: dbAlive });
  }

  // GET /stats: Return the number of users and files in the database
  static async getStats(req, res) {
    try {
      const usersCount = await dbClient.nbUsers();
      const filesCount = await dbClient.nbFiles();
      
      res.status(200).json({ users: usersCount, files: filesCount });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching stats' });
    }
  }
}