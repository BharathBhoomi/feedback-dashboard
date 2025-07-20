const mongoose = require('mongoose');

const connectWithOptimization = async () => {
  const options = {
    // Connection pool settings
    maxPoolSize: 10, // Maximum number of connections
    minPoolSize: 2,  // Minimum number of connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    serverSelectionTimeoutMS: 5000, // How long to try selecting a server
    socketTimeoutMS: 45000, // How long a socket can be idle before closing
    family: 4, // Use IPv4, skip trying IPv6
    
    // Performance optimizations
    bufferCommands: false, // Disable mongoose buffering
    autoIndex: false, // Don't build indexes automatically in production
    
    // Compression
    compressors: 'zlib',
    
    // Read preference
    readPreference: 'primaryPreferred',
    
    // Write concern
    w: 'majority',
    wtimeout: 1000,
    j: true
  };
  
  await mongoose.connect(process.env.MONGO_URI, options);
};

module.exports = connectWithOptimization;