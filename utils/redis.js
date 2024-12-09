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
        this.client.on('error', (error) => {
            console.log('Client failed to connect: ', error.message || error.toString());
            this.isClientConnected = false;
        });
        this.client.on('connect', () => {
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
        return promisify(this.client.get).bind(this.client)(key);
    }

    /**
     * an asynchronous function set that takes 
     * a string key, a value and a duration in 
     * second as arguments to store it in Redis 
     * (with an expiration set by the duration argument)
     */
    async set(key, duration, value) {
        await promisify(this.client.setex)
        .bind(this.client)(key, duration, value);
    }

    /**
     * an asynchronous function del 
     * that takes a string key as argument 
     * and remove the value in Redis for this key
     */
    async del(key) {
        await promisify(this.client.del)
        .bind(this.client)(key);
    }

}

const redisClient = new RedisClient();
export default redisClient;