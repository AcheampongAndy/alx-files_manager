import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const VALID_FILE_TYPES = ['folder', 'file', 'image'];
const MAX_FILES_PER_PAGE = 20;

class FilesController {
  /**
   * POST /files
   * Uploads a file or creates a folder
   */
  static async postUpload(req, res) {
    const { name, type, parentId = '0', isPublic = false, data } = req.body;
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!VALID_FILE_TYPES.includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    let parentFile = null;
    if (parentId !== '0') {
      parentFile = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const fileData = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === '0' ? '0' : new ObjectId(parentId),
    };

    if (type !== 'folder') {
      const filePath = path.join(FOLDER_PATH, uuidv4());
      await fs.mkdir(FOLDER_PATH, { recursive: true });
      await fs.writeFile(filePath, Buffer.from(data, 'base64'));
      fileData.localPath = filePath;
    }

    const result = await dbClient.db.collection('files').insertOne(fileData);
    fileData.id = result.insertedId;

    return res.status(201).json(fileData);
  }

  /**
   * GET /files/:id
   * Retrieve a specific file by ID
   */
  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json(file);
  }

  /**
   * GET /files
   * Retrieve a paginated list of files
   */
  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    const { parentId = '0', page = 0 } = req.query;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const query = {
      userId: new ObjectId(userId),
      parentId: parentId === '0' ? '0' : new ObjectId(parentId),
    };

    const files = await dbClient.db.collection('files')
      .find(query)
      .skip(Number(page) * MAX_FILES_PER_PAGE)
      .limit(MAX_FILES_PER_PAGE)
      .toArray();

    return res.status(200).json(files);
  }

  /**
   * PUT /files/:id/publish
   * Publish a file
   */
  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    await dbClient.db.collection('files').updateOne({ _id: new ObjectId(id) }, { $set: { isPublic: true } });
    return res.status(200).json({ ...file, isPublic: true });
  }

  /**
   * PUT /files/:id/unpublish
   * Unpublish a file
   */
  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    const { id } = req.params;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    await dbClient.db.collection('files').updateOne({ _id: new ObjectId(id) }, { $set: { isPublic: false } });
    return res.status(200).json({ ...file, isPublic: false });
  }
}

export default FilesController;