/** 
 * Importing Libraries 
 * */
import { promisify } from 'util';
import { createClient } from 'redis';

/** 
 * A class that represent the client side 
 * */
class RedisClient {
    /** 
     * Create a new instance
     */

    constructor () {
        this.client = createClient();
        this.isClientConnected = true;

        // Set up event listeners for connection handling
        this.client.on('error', (error) => {
            console.log('Client failed to connect:', error.message || error);
            this.isClientConnected = false;
        });

        this.client.on('connect', () => {
            console.log('Redis client connected successfully.');
            this.isClientConnected = true;
        });
    };


    /** 
     * a function isAlive that returns true 
     * when the connection to Redis is a success 
     * otherwise, false
     */

    isAlive() {
        return this.isClientConnected;
    }

    /**
     * an asynchronous function get that takes 
     * a string key as argument and 
     * returns the Redis value stored for this key
     */
    async get(key) {
        try {
            return await this.getAsync(key);
        } catch (error) {
            console.error(`Error fetching key "${key}":`, error.message || error);
            return null;
        }
    }

    /**
     * an asynchronous function set that takes 
     * a string key, a value and a duration in 
     * second as arguments to store it in Redis 
     * (with an expiration set by the duration argument)
     */
    async set(key, duration, value) {
        try {
            await this.setexAsync(key, duration, value);
        } catch (error) {
            console.error(`Error setting key "${key}":`, error.message || error);
        }
    }

    /**
     * an asynchronous function del 
     * that takes a string key as argument 
     * and remove the value in Redis for this key
     */
    async del(key) {
        try {
            await this.delAsync(key);
        } catch (error) {
            console.error(`Error deleting key "${key}":`, error.message || error);
        }
    }

}

const redisClient = new RedisClient();
export default redisClient;