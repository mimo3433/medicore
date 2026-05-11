import Redis from 'ioredis';
import { config } from '../config';

const redis = new Redis(config.redis.url, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});


redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;

export const cacheKeys = {
  doctorProfile: (doctorId: string) => `doctor:${doctorId}:profile`,
  doctorSlots: (doctorId: string, date: string) => `doctor:${doctorId}:slots:${date}`,
  availableDoctors: (filters: string) => `doctors:available:${filters}`,
  userSession: (userId: string) => `user:${userId}:session`,
  rateLimit: (identifier: string) => `rateLimit:${identifier}`,
};
