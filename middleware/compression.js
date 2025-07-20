const compression = require('compression');

const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress if the request includes a cache-control: no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    
    // Use compression filter function
    return compression.filter(req, res);
  },
  level: 6 // Compression level (0-9, where 9 is maximum compression)
});

module.exports = compressionMiddleware;