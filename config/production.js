module.exports = {
  // Enable production optimizations
  NODE_ENV: 'production',
  
  // Cluster mode for multi-core utilization
  CLUSTER_MODE: true,
  CLUSTER_WORKERS: process.env.CLUSTER_WORKERS || require('os').cpus().length,
  
  // Compression settings
  COMPRESSION_LEVEL: 6,
  
  // Cache settings
  CACHE_TTL: 300, // 5 minutes
  REDIS_URL: process.env.REDIS_URL,
  
  // Database optimization
  DB_POOL_SIZE: 10,
  DB_TIMEOUT: 5000,
  
  // Security settings
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100,
  
  // Monitoring
  ENABLE_METRICS: true,
  LOG_LEVEL: 'error'
};