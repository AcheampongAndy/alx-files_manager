// controllers/FilesController.js
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
    /**
     * POST /files
     * Create a new file in DB and on disk
     */
    static async postUpload(req, res) {
        const token = req.headers['x-token'];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, type, parentId = 0, isPublic = false, data } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }

        if (!type || !['folder', 'file', 'image'].includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }

        if (type !== 'folder' && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        if (parentId !== 0) {
            const parentFile = await dbClient.db.collection('files').findOne({ _id: new dbClient.ObjectId(parentId) });

            if (!parentFile) {
                return res.status(400).json({ error: 'Parent not found' });
            }

            if (parentFile.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
        }

        const fileData = {
            userId: new dbClient.ObjectId(userId),
            name,
            type,
            isPublic,
            parentId: parentId !== 0 ? new dbClient.ObjectId(parentId) : 0,
        };

        if (type === 'folder') {
            const result = await dbClient.db.collection('files').insertOne(fileData);
            return res.status(201).json({
                id: result.insertedId,
                ...fileData,
            });
        }

        // Ensure the storage folder exists
        try {
            await accessAsync(FOLDER_PATH);
        } catch {
            await mkdirAsync(FOLDER_PATH, { recursive: true });
        }

        const localPath = path.join(FOLDER_PATH, uuidv4());
        const decodedData = Buffer.from(data, 'base64');

        try {
            await writeFileAsync(localPath, decodedData);
        } catch (err) {
            return res.status(500).json({ error: 'Could not save file to disk' });
        }

        fileData.localPath = localPath;

        const result = await dbClient.db.collection('files').insertOne(fileData);

        return res.status(201).json({
            id: result.insertedId,
            ...fileData,
        });
    }

    /**
     * GET /files/:id
     * Retrieve a specific file document by ID
     */
    static async getShow(req, res) {
        const token = req.headers['x-token'];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        try {
            const file = await dbClient.db.collection('files').findOne({
                _id: new dbClient.ObjectId(id),
                userId: new dbClient.ObjectId(userId),
            });

            if (!file) {
                return res.status(404).json({ error: 'Not found' });
            }

            return res.status(200).json(file);
        } catch (err) {
            return res.status(404).json({ error: 'Not found' });
        }
    }

    /**
     * GET /files
     * Retrieve paginated list of user's file documents
     */
    static async getIndex(req, res) {
        const token = req.headers['x-token'];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { parentId = 0, page = 0 } = req.query;

        const query = {
            userId: new dbClient.ObjectId(userId),
            parentId: parentId === 0 ? 0 : new dbClient.ObjectId(parentId),
        };

        try {
            const files = await dbClient.db.collection('files')
                .aggregate([
                    { $match: query },
                    { $skip: parseInt(page, 10) * 20 },
                    { $limit: 20 },
                ])
                .toArray();

            return res.status(200).json(files);
        } catch (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async putPublish(req, res) {
        const token = req.headers['x-token'];
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const file = await dbClient.db.collection('files').findOne({
            _id: ObjectId(req.params.id),
            userId: ObjectId(userId),
        });
        if (!file) return res.status(404).json({ error: 'Not found' });

        await dbClient.db.collection('files').updateOne(
            { _id: ObjectId(req.params.id) },
            { $set: { isPublic: true } }
        );

        return res.status(200).json({ ...file, isPublic: true });
    }

    static async putUnpublish(req, res) {
        const token = req.headers['x-token'];
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const file = await dbClient.db.collection('files').findOne({
            _id: ObjectId(req.params.id),
            userId: ObjectId(userId),
        });
        if (!file) return res.status(404).json({ error: 'Not found' });

        await dbClient.db.collection('files').updateOne(
            { _id: ObjectId(req.params.id) },
            { $set: { isPublic: false } }
        );

        return res.status(200).json({ ...file, isPublic: false });
    }
}

export default FilesController;