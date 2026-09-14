import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    throw new Error('REDIS_URL não está configurada no .env');
}

// O BullMQ exige que maxRetriesPerRequest seja null para funcionar sem travar as threads
export const redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    tls: redisUrl.startsWith('rediss://') ? {} : undefined // Aceita SSL se a URL exigir
});

