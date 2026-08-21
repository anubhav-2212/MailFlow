import { Redis } from 'ioredis';

const redisConnection = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
});

//this is just for debugging 
redisConnection.on('connect', () => {
  console.log('Redis connected');
});

redisConnection.on('ready', () => {
  console.log('Redis ready');
});

redisConnection.on('error', (error) => {
  console.error('Redis error:', error);
});

redisConnection.on('close', () => {
  console.log('Redis connection closed');
});

export default redisConnection;