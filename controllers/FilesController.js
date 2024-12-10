// controllers/FilesController.js
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
    static async postUpload(req, res) {
        const token = req.headers['x-token'];
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, type, parentId = 0, isPublic = false, data } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing name' });
        if (!type || !['folder', 'file', 'image'].includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }
        if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

        let parentFile;
        if (parentId !== 0) {
            parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
            if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
            if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
        }

        const fileDocument = {
            userId: ObjectId(userId),
            name,
            type,
            parentId,
            isPublic,
            localPath: null,
        };

        if (type !== 'folder') {
            const filePath = path.join(FOLDER_PATH, uuidv4());
            await fs.mkdir(FOLDER_PATH, { recursive: true });
            await fs.writeFile(filePath, Buffer.from(data, 'base64'));
            fileDocument.localPath = filePath;
        }

        const result = await dbClient.db.collection('files').insertOne(fileDocument);
        fileDocument._id = result.insertedId;

        return res.status(201).json(fileDocument);
    }

    static async getShow(req, res) {
        const token = req.headers['x-token'];
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const file = await dbClient.db.collection('files').findOne({
            _id: ObjectId(req.params.id),
            userId: ObjectId(userId),
        });
        if (!file) return res.status(404).json({ error: 'Not found' });

        return res.status(200).json(file);
    }

    static async getIndex(req, res) {
        const token = req.headers['x-token'];
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { parentId = 0, page = 0 } = req.query;
        const query = { userId: ObjectId(userId), parentId: parentId === 0 ? 0 : ObjectId(parentId) };

        const files = await dbClient.db.collection('files')
            .aggregate([
                { $match: query },
                { $skip: parseInt(page, 10) * 20 },
                { $limit: 20 },
            ])
            .toArray();

        return res.status(200).json(files);
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