// Redis client
const client = require('redis');
//import { createClient } from 'redis';
const redisClient = client.createClient();
redisClient.connect();

module.exports = {redisClient};