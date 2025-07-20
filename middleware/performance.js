const performanceMonitor = (req, res, next) => {
  const start = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    // Log performance metrics
    console.log({
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      memory: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

module.exports = performanceMonitor;