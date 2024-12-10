/* eslint-disable import/no-named-as-default */
import sha1 from 'sha1';
import Queue from 'bull/lib/queue';
import dbClient from '../utils/db';

const userQueue = new Queue('email sending');

export default class UsersController {
  /**
   * POST /users
   * Create a new user
   * @param {Request} req - The Express request object
   * @param {Response} res - The Express response object
   */
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;

      // Validate email and password
      if (!email) return res.status(400).json({ error: 'Missing email' });
      if (!password) return res.status(400).json({ error: 'Missing password' });

      // Check if the user already exists
      const existingUser = await dbClient.db.collection('users').findOne({ email });
      if (existingUser) return res.status(400).json({ error: 'Already exist' });

      // Hash the password and insert the new user
      const hashedPassword = sha1(password);
      const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });

      // Enqueue email sending task
      const userId = result.insertedId.toString();
      userQueue.add({ userId });

      // Respond with the new user's ID and email
      return res.status(201).json({ email, id: userId });
    } catch (error) {
      // Handle unexpected errors
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * GET /users/me
   * Retrieve the currently authenticated user
   * @param {Request} req - The Express request object
   * @param {Response} res - The Express response object
   */
  static async getMe(req, res) {
    try {
      const { user } = req;

      // Respond with the user's email and ID
      return res.status(200).json({ email: user.email, id: user._id.toString() });
    } catch (error) {
      // Handle unexpected errors
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}