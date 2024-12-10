// Import required modules
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');  // Import redisClient

// Define the UsersController class
class UsersController {
  // POST /users: Create a new user
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // Check if password is provided
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Check if the email already exists in the DB
      const existingUser = await dbClient.db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const sha1Password = crypto.createHash('sha1').update(password).digest('hex');

      // Insert the new user into the DB
      const newUser = {
        email,
        password: sha1Password,
      };

      const result = await dbClient.db.collection('users').insertOne(newUser);
      const userId = result.insertedId;

      // Return the new user with only email and id
      res.status(201).json({ id: userId, email });
    } catch (error) {
      // Error handling
      res.status(500).json({ error: 'Error creating user' });
    }
  }

  // GET /users/me: Retrieve the authenticated user
  static async getMe(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user ID from Redis using the token
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the user from the database using the ID
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Return the user object with email and id
      return res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      res.status(500).json({ error: 'Error retrieving user information' });
    }
  }
}

// Export the UsersController
module.exports = UsersController;