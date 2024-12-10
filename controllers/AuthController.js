// Import required modules
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Define the AuthController class
class AuthController {
  // GET /connect: Sign-in the user and generate an authentication token
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract the base64 part of the header
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Hash the password using SHA1
    const sha1Password = crypto.createHash('sha1').update(password).digest('hex');

    // Find the user in the DB
    const user = await dbClient.db.collection('users').findOne({ email, password: sha1Password });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a token using uuidv4
    const token = uuidv4();

    // Store the user ID in Redis with the token as key, expiring in 24 hours
    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);

    // Return the token
    return res.status(200).json({ token });
  }

  // GET /disconnect: Sign-out the user and delete the token from Redis
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the token exists in Redis
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Remove the token from Redis
    await redisClient.del(`auth_${token}`);

    return res.status(204).send();
  }
}

// Export the AuthController
module.exports = AuthController;