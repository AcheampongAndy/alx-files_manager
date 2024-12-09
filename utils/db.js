// utils/db.js
import { MongoClient } from 'mongodb';

/**
 * DBClient class to interact with MongoDB
 */
class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';

        const uri = `mongodb://${host}:${port}`;
        this.client = new MongoClient(uri, { useUnifiedTopology: true });
        this.dbName = database;

        this.client.connect()
            .then(() => {
                console.log('Connected successfully to MongoDB');
                this.db = this.client.db(this.dbName);
            })
            .catch((error) => {
                console.error('Failed to connect to MongoDB:', error.message || error);
                this.db = null;
            });
    }

    /**
     * a function isAlive that returns true 
     * when the connection to MongoDB is 
     * a success otherwise, false
     */
    isAlive() {
        return !!this.db && this.client.topology.isConnected();
    }

    /**
     * an asynchronous function nbUsers 
     * that returns the number of documents 
     * in the collection users
     */
    async nbUsers() {
        if (!this.db) {
            return 0;
        }
        try {
            const usersCollection = this.db.collection('users');
            return await usersCollection.countDocuments();
        } catch (error) {
            console.error('Error counting users:', error.message || error);
            return 0;
        }
    }

    /**
     * an asynchronous function nbFiles 
     * that returns the number of documents 
     * in the collection files
     */
    async nbFiles() {
        if (!this.db) {
            return 0;
        }
        try {
            const filesCollection = this.db.collection('files');
            return await filesCollection.countDocuments();
        } catch (error) {
            console.error('Error counting files:', error.message || error);
            return 0;
        }
    }
}

// create and export an instance of DBClient called dbClient.
const dbClient = new DBClient();
export default dbClient;
