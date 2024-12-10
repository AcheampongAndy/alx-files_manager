// Import required modules
const crypto = require('crypto');
const dbClient = require('../utils/db');

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

    try {
      const result = await dbClient.db.collection('users').insertOne(newUser);
      const userId = result.insertedId;

      // Return the new user with only email and id
      res.status(201).json({ id: userId, email });
    } catch (error) {
      res.status(500).json({ error: 'Error creating user' });
    }
  }
}

// Export the UsersController
module.exports = UsersController;