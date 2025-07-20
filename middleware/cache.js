const NodeCache = require('node-cache');
const redis = require('redis');

// In-memory cache for small data
const memoryCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60 // Check for expired keys every minute
});

// Redis cache for larger data (optional)
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });
  
  // Connect to Redis (required in Redis v4+)
  redisClient.connect().catch(err => {
    console.error('Redis connection error:', err);
    redisClient = null; // Reset client on connection failure
  });
}

class CacheService {
  static async get(key) {
    // Try memory cache first
    const memoryResult = memoryCache.get(key);
    if (memoryResult) return memoryResult;
    
    // Try Redis if available
    if (redisClient) {
      const redisResult = await redisClient.get(key);
      if (redisResult) {
        const parsed = JSON.parse(redisResult);
        memoryCache.set(key, parsed, 60); // Cache in memory for 1 minute
        return parsed;
      }
    }
    
    return null;
  }
  
  static async set(key, value, ttl = 300) {
    // Set in memory cache
    memoryCache.set(key, value, ttl);
    
    // Set in Redis if available
    if (redisClient) {
      await redisClient.setex(key, ttl, JSON.stringify(value));
    }
  }
  
  static delete(key) {
    memoryCache.del(key);
    if (redisClient) {
      redisClient.del(key);
    }
  }
}

module.exports = CacheService;