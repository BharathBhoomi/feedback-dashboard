const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import optimized modules
const connectWithOptimization = require('../database/optimizedConnection');
const { apiLimiter, surveyLimiter } = require('../middleware/security');
const { jsonParser, urlencodedParser, timeoutMiddleware } = require('../middleware/optimization');
const compressionMiddleware = require('../middleware/compression');
const performanceMonitor = require('../middleware/performance');
const CacheService = require('../middleware/cache');

// Error handling for serverless environment
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

const app = express();

// Middleware
app.use(performanceMonitor);
app.use(compressionMiddleware);
app.use(timeoutMiddleware(30000)); // 30 second timeout

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://survey-feedback-dashboard.vercel.app',
    'https://feedback-dashboard-q2s8.vercel.app',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  ].filter(Boolean),
  credentials: true
}));

// Use optimized parsers instead of bodyParser
app.use(jsonParser);
app.use(urlencodedParser);

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/external/surveys', surveyLimiter);

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/external/surveys', surveyLimiter);

// Serve static files from public directory for SDK and other public assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve static files from client/build directory
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// Serve dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

// Catch-all route to serve React app for client-side routing
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Serve the React app for all other routes
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

// Connect to MongoDB with optimized connection pooling for Vercel
let mongoConnected = false;

// Enhanced MongoDB error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  mongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  mongoConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  mongoConnected = true;
});

// Define survey schema and model
const surveySchema = new mongoose.Schema({
  surveyId: String,
  title: String,
  description: String,
  questions: Array,
  responses: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow flexible schema for various survey formats

const Survey = mongoose.model('Survey', surveySchema, 'survey_data');

// Create indexes for production performance
const createIndexes = async () => {
  try {
    // Performance indexes
    await Survey.collection.createIndex({ "createdAt": -1 });
    await Survey.collection.createIndex({ "email": 1 }, { sparse: true });
    
    // Rating-based indexes
    await Survey.collection.createIndex({ "satisfactionRating": 1, "createdAt": -1 });
    await Survey.collection.createIndex({ "recommendationRating": 1, "createdAt": -1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
};

// Use optimized connection
connectWithOptimization()
  .then(() => {
    console.log('MongoDB connected successfully with optimized settings');
    mongoConnected = true;
    // Create indexes after successful connection
    createIndexes();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue running without MongoDB connection');
  });

// Data validation function for external surveys
const validateSurveyData = (data) => {
  // Check for required fields based on your needs
  if (data.email && !data.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  // Validate rating values
  if (data.satisfactionRating && 
      (isNaN(data.satisfactionRating) || 
       parseInt(data.satisfactionRating) < 1 || 
       parseInt(data.satisfactionRating) > 5)) {
    throw new Error('Satisfaction rating must be between 1-5');
  }
  
  if (data.recommendationRating && 
      (isNaN(data.recommendationRating) || 
       parseInt(data.recommendationRating) < 0 || 
       parseInt(data.recommendationRating) > 10)) {
    throw new Error('Recommendation rating must be between 0-10');
  }
  
  return true;
};

// Data validation function for external surveys
const validateSurveyData = (data) => {
  // Check for required fields based on your needs
  if (data.email && !data.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  // Validate rating values
  if (data.satisfactionRating && 
      (isNaN(data.satisfactionRating) || 
       parseInt(data.satisfactionRating) < 1 || 
       parseInt(data.satisfactionRating) > 5)) {
    throw new Error('Satisfaction rating must be between 1-5');
  }
  
  if (data.recommendationRating && 
      (isNaN(data.recommendationRating) || 
       parseInt(data.recommendationRating) < 0 || 
       parseInt(data.recommendationRating) > 10)) {
    throw new Error('Recommendation rating must be between 0-10');
  }
  
  return true;
};

// API Routes
app.get('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.json([]);
    }
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/surveys/:id', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = new Survey(req.body);
    const newSurvey = await survey.save();
    res.status(201).json(newSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Endpoint for external survey tools to send data
app.post('/api/external/surveys', async (req, res) => {
  try {
    // Validate the incoming data (basic validation)
    if (!req.body) {
      return res.status(400).json({ message: 'Survey data is required' });
    }
    
    // Validate survey data format
    try {
      validateSurveyData(req.body);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    if (!mongoConnected) {
      console.log('Survey data received but database not available:', req.body);
      return res.status(503).json({ message: 'Database not available, data logged to console' });
    }
    
    // Create a new survey document
    const surveyData = {
      ...req.body,
      surveyId: req.body.surveyId || uuidv4(),
      updatedAt: Date.now()
    };
    
    const survey = new Survey(surveyData);
    const savedSurvey = await survey.save();
    
    res.status(201).json({
      message: 'Survey data received and stored successfully',
      surveyId: savedSurvey._id
    });
  } catch (err) {
    console.error('Error saving survey data:', err);
    res.status(500).json({ message: 'Failed to save survey data', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Connect to MongoDB with optimized connection pooling for Vercel
let mongoConnected = false;

// MongoDB connection options optimized for Vercel serverless functions
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  maxIdleTimeMS: 10000,
  family: 4 // Use IPv4, skip trying IPv6
};

// Enhanced MongoDB error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  mongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  mongoConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  mongoConnected = true;
});

// Create indexes for production performance
const createIndexes = async () => {
  try {
    // Performance indexes
    await Survey.collection.createIndex({ "createdAt": -1 });
    await Survey.collection.createIndex({ "email": 1 }, { sparse: true });
    
    // Rating-based indexes
    await Survey.collection.createIndex({ "satisfactionRating": 1, "createdAt": -1 });
    await Survey.collection.createIndex({ "recommendationRating": 1, "createdAt": -1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('MongoDB connected successfully');
    mongoConnected = true;
    // Create indexes after successful connection
    createIndexes();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue running without MongoDB connection');
  });

// Define survey schema and model
const surveySchema = new mongoose.Schema({
  surveyId: String,
  title: String,
  description: String,
  questions: Array,
  responses: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow flexible schema for various survey formats

const Survey = mongoose.model('Survey', surveySchema, 'survey_data');

// API Routes
app.get('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.json([]);
    }
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/surveys/:id', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = new Survey(req.body);
    const newSurvey = await survey.save();
    res.status(201).json(newSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Data validation function for external surveys
const validateSurveyData = (data) => {
  // Check for required fields based on your needs
  if (data.email && !data.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  // Validate rating values
  if (data.satisfactionRating && 
      (isNaN(data.satisfactionRating) || 
       parseInt(data.satisfactionRating) < 1 || 
       parseInt(data.satisfactionRating) > 5)) {
    throw new Error('Satisfaction rating must be between 1-5');
  }
  
  if (data.recommendationRating && 
      (isNaN(data.recommendationRating) || 
       parseInt(data.recommendationRating) < 0 || 
       parseInt(data.recommendationRating) > 10)) {
    throw new Error('Recommendation rating must be between 0-10');
  }
  
  return true;
};

// Endpoint for external survey tools to send data
app.post('/api/external/surveys', async (req, res) => {
  try {
    // Validate the incoming data (basic validation)
    if (!req.body) {
      return res.status(400).json({ message: 'Survey data is required' });
    }
    
    // Validate survey data format
    try {
      validateSurveyData(req.body);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    if (!mongoConnected) {
      console.log('Survey data received but database not available:', req.body);
      return res.status(503).json({ message: 'Database not available, data logged to console' });
    }
    
    // Create a new survey document
    const surveyData = {
      ...req.body,
      surveyId: req.body.surveyId || uuidv4(),
      updatedAt: Date.now()
    };
    
    const survey = new Survey(surveyData);
    const savedSurvey = await survey.save();
    
    res.status(201).json({
      message: 'Survey data received and stored successfully',
      surveyId: savedSurvey._id
    });
  } catch (err) {
    console.error('Error saving survey data:', err);
    res.status(500).json({ message: 'Failed to save survey data', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Connect to MongoDB with optimized connection pooling for Vercel
let mongoConnected = false;

// MongoDB connection options optimized for Vercel serverless functions
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  maxIdleTimeMS: 10000,
  family: 4 // Use IPv4, skip trying IPv6
};

// Enhanced MongoDB error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  mongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  mongoConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  mongoConnected = true;
});

// Create indexes for production performance
const createIndexes = async () => {
  try {
    // Performance indexes
    await Survey.collection.createIndex({ "createdAt": -1 });
    await Survey.collection.createIndex({ "email": 1 }, { sparse: true });
    
    // Rating-based indexes
    await Survey.collection.createIndex({ "satisfactionRating": 1, "createdAt": -1 });
    await Survey.collection.createIndex({ "recommendationRating": 1, "createdAt": -1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('MongoDB connected successfully');
    mongoConnected = true;
    // Create indexes after successful connection
    createIndexes();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue running without MongoDB connection');
  });

// Define survey schema and model
const surveySchema = new mongoose.Schema({
  surveyId: String,
  title: String,
  description: String,
  questions: Array,
  responses: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow flexible schema for various survey formats

const Survey = mongoose.model('Survey', surveySchema, 'survey_data');

// API Routes
app.get('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.json([]);
    }
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/surveys/:id', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = new Survey(req.body);
    const newSurvey = await survey.save();
    res.status(201).json(newSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Data validation function for external surveys
const validateSurveyData = (data) => {
  // Check for required fields based on your needs
  if (data.email && !data.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  // Validate rating values
  if (data.satisfactionRating && 
      (isNaN(data.satisfactionRating) || 
       parseInt(data.satisfactionRating) < 1 || 
       parseInt(data.satisfactionRating) > 5)) {
    throw new Error('Satisfaction rating must be between 1-5');
  }
  
  if (data.recommendationRating && 
      (isNaN(data.recommendationRating) || 
       parseInt(data.recommendationRating) < 0 || 
       parseInt(data.recommendationRating) > 10)) {
    throw new Error('Recommendation rating must be between 0-10');
  }
  
  return true;
};

// Endpoint for external survey tools to send data
app.post('/api/external/surveys', async (req, res) => {
  try {
    // Validate the incoming data (basic validation)
    if (!req.body) {
      return res.status(400).json({ message: 'Survey data is required' });
    }
    
    // Validate survey data format
    try {
      validateSurveyData(req.body);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    if (!mongoConnected) {
      console.log('Survey data received but database not available:', req.body);
      return res.status(503).json({ message: 'Database not available, data logged to console' });
    }
    
    // Create a new survey document
    const surveyData = {
      ...req.body,
      surveyId: req.body.surveyId || uuidv4(),
      updatedAt: Date.now()
    };
    
    const survey = new Survey(surveyData);
    const savedSurvey = await survey.save();
    
    res.status(201).json({
      message: 'Survey data received and stored successfully',
      surveyId: savedSurvey._id
    });
  } catch (err) {
    console.error('Error saving survey data:', err);
    res.status(500).json({ message: 'Failed to save survey data', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Connect to MongoDB with optimized connection pooling for Vercel
let mongoConnected = false;

// Connect to MongoDB with optimized connection pooling for Vercel
let mongoConnected = false;

// MongoDB connection options optimized for Vercel serverless functions
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  maxIdleTimeMS: 10000,
  family: 4 // Use IPv4, skip trying IPv6
};

// Enhanced MongoDB error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  mongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  mongoConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  mongoConnected = true;
});

// Create indexes for production performance
const createIndexes = async () => {
  try {
    // Performance indexes
    await Survey.collection.createIndex({ "createdAt": -1 });
    await Survey.collection.createIndex({ "email": 1 }, { sparse: true });
    
    // Rating-based indexes
    await Survey.collection.createIndex({ "satisfactionRating": 1, "createdAt": -1 });
    await Survey.collection.createIndex({ "recommendationRating": 1, "createdAt": -1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('MongoDB connected successfully');
    mongoConnected = true;
    // Create indexes after successful connection
    createIndexes();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue running without MongoDB connection');
  });

// Define survey schema and model
const surveySchema = new mongoose.Schema({
  surveyId: String,
  title: String,
  description: String,
  questions: Array,
  responses: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow flexible schema for various survey formats

const Survey = mongoose.model('Survey', surveySchema, 'survey_data');

// API Routes
app.get('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.json([]);
    }
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/surveys/:id', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = new Survey(req.body);
    const newSurvey = await survey.save();
    res.status(201).json(newSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Data validation function for external surveys
const validateSurveyData = (data) => {
  // Check for required fields based on your needs
  if (data.email && !data.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  // Validate rating values
  if (data.satisfactionRating && 
      (isNaN(data.satisfactionRating) || 
       parseInt(data.satisfactionRating) < 1 || 
       parseInt(data.satisfactionRating) > 5)) {
    throw new Error('Satisfaction rating must be between 1-5');
  }
  
  if (data.recommendationRating && 
      (isNaN(data.recommendationRating) || 
       parseInt(data.recommendationRating) < 0 || 
       parseInt(data.recommendationRating) > 10)) {
    throw new Error('Recommendation rating must be between 0-10');
  }
  
  return true;
};

// Endpoint for external survey tools to send data
app.post('/api/external/surveys', async (req, res) => {
  try {
    // Validate the incoming data (basic validation)
    if (!req.body) {
      return res.status(400).json({ message: 'Survey data is required' });
    }
    
    // Validate survey data format
    try {
      validateSurveyData(req.body);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    if (!mongoConnected) {
      console.log('Survey data received but database not available:', req.body);
      return res.status(503).json({ message: 'Database not available, data logged to console' });
    }
    
    // Create a new survey document
    const surveyData = {
      ...req.body,
      surveyId: req.body.surveyId || uuidv4(),
      updatedAt: Date.now()
    };
    
    const survey = new Survey(surveyData);
    const savedSurvey = await survey.save();
    
    res.status(201).json({
      message: 'Survey data received and stored successfully',
      surveyId: savedSurvey._id
    });
  } catch (err) {
    console.error('Error saving survey data:', err);
    res.status(500).json({ message: 'Failed to save survey data', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Connect to MongoDB with optimized connection pooling for Vercel
let mongoConnected = false;

// MongoDB connection options optimized for Vercel serverless functions
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  maxIdleTimeMS: 10000,
  family: 4 // Use IPv4, skip trying IPv6
};

// Enhanced MongoDB error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  mongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  mongoConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  mongoConnected = true;
});

// Create indexes for production performance
const createIndexes = async () => {
  try {
    // Performance indexes
    await Survey.collection.createIndex({ "createdAt": -1 });
    await Survey.collection.createIndex({ "email": 1 }, { sparse: true });
    
    // Rating-based indexes
    await Survey.collection.createIndex({ "satisfactionRating": 1, "createdAt": -1 });
    await Survey.collection.createIndex({ "recommendationRating": 1, "createdAt": -1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('MongoDB connected successfully');
    mongoConnected = true;
    // Create indexes after successful connection
    createIndexes();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue running without MongoDB connection');
  });

// Define survey schema and model
const surveySchema = new mongoose.Schema({
  surveyId: String,
  title: String,
  description: String,
  questions: Array,
  responses: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow flexible schema for various survey formats

const Survey = mongoose.model('Survey', surveySchema, 'survey_data');

// API Routes
app.get('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.json([]);
    }
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/surveys/:id', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = new Survey(req.body);
    const newSurvey = await survey.save();
    res.status(201).json(newSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Data validation function for external surveys
const validateSurveyData = (data) => {
  // Check for required fields based on your needs
  if (data.email && !data.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  // Validate rating values
  if (data.satisfactionRating && 
      (isNaN(data.satisfactionRating) || 
       parseInt(data.satisfactionRating) < 1 || 
       parseInt(data.satisfactionRating) > 5)) {
    throw new Error('Satisfaction rating must be between 1-5');
  }
  
  if (data.recommendationRating && 
      (isNaN(data.recommendationRating) || 
       parseInt(data.recommendationRating) < 0 || 
       parseInt(data.recommendationRating) > 10)) {
    throw new Error('Recommendation rating must be between 0-10');
  }
  
  return true;
};

// Endpoint for external survey tools to send data
app.post('/api/external/surveys', async (req, res) => {
  try {
    // Validate the incoming data (basic validation)
    if (!req.body) {
      return res.status(400).json({ message: 'Survey data is required' });
    }
    
    // Validate survey data format
    try {
      validateSurveyData(req.body);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    if (!mongoConnected) {
      console.log('Survey data received but database not available:', req.body);
      return res.status(503).json({ message: 'Database not available, data logged to console' });
    }
    
    // Create a new survey document
    const surveyData = {
      ...req.body,
      surveyId: req.body.surveyId || uuidv4(),
      updatedAt: Date.now()
    };
    
    const survey = new Survey(surveyData);
    const savedSurvey = await survey.save();
    
    res.status(201).json({
      message: 'Survey data received and stored successfully',
      surveyId: savedSurvey._id
    });
  } catch (err) {
    console.error('Error saving survey data:', err);
    res.status(500).json({ message: 'Failed to save survey data', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



// Connect to MongoDB with optimized connection pooling for Vercel
let mongoConnected = false;

// MongoDB connection options optimized for Vercel serverless functions
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  maxIdleTimeMS: 10000,
  family: 4 // Use IPv4, skip trying IPv6
};

// Enhanced MongoDB error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  mongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  mongoConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  mongoConnected = true;
});

// Create indexes for production performance
const createIndexes = async () => {
  try {
    // Performance indexes
    await Survey.collection.createIndex({ "createdAt": -1 });
    await Survey.collection.createIndex({ "email": 1 }, { sparse: true });
    
    // Rating-based indexes
    await Survey.collection.createIndex({ "satisfactionRating": 1, "createdAt": -1 });
    await Survey.collection.createIndex({ "recommendationRating": 1, "createdAt": -1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('MongoDB connected successfully');
    mongoConnected = true;
    // Create indexes after successful connection
    createIndexes();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue running without MongoDB connection');
  });

// Define survey schema and model
const surveySchema = new mongoose.Schema({
  surveyId: String,
  title: String,
  description: String,
  questions: Array,
  responses: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow flexible schema for various survey formats

const Survey = mongoose.model('Survey', surveySchema, 'survey_data');

// API Routes
app.get('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.json([]);
    }
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/surveys/:id', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = new Survey(req.body);
    const newSurvey = await survey.save();
    res.status(201).json(newSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Data validation function for external surveys
const validateSurveyData = (data) => {
  // Check for required fields based on your needs
  if (data.email && !data.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  // Validate rating values
  if (data.satisfactionRating && 
      (isNaN(data.satisfactionRating) || 
       parseInt(data.satisfactionRating) < 1 || 
       parseInt(data.satisfactionRating) > 5)) {
    throw new Error('Satisfaction rating must be between 1-5');
  }
  
  if (data.recommendationRating && 
      (isNaN(data.recommendationRating) || 
       parseInt(data.recommendationRating) < 0 || 
       parseInt(data.recommendationRating) > 10)) {
    throw new Error('Recommendation rating must be between 0-10');
  }
  
  return true;
};

// Endpoint for external survey tools to send data
app.post('/api/external/surveys', async (req, res) => {
  try {
    // Validate the incoming data (basic validation)
    if (!req.body) {
      return res.status(400).json({ message: 'Survey data is required' });
    }
    
    // Validate survey data format
    try {
      validateSurveyData(req.body);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    if (!mongoConnected) {
      console.log('Survey data received but database not available:', req.body);
      return res.status(503).json({ message: 'Database not available, data logged to console' });
    }
    
    // Create a new survey document
    const surveyData = {
      ...req.body,
      surveyId: req.body.surveyId || uuidv4(),
      updatedAt: Date.now()
    };
    
    const survey = new Survey(surveyData);
    const savedSurvey = await survey.save();
    
    res.status(201).json({
      message: 'Survey data received and stored successfully',
      surveyId: savedSurvey._id
    });
  } catch (err) {
    console.error('Error saving survey data:', err);
    res.status(500).json({ message: 'Failed to save survey data', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

// Connect to MongoDB with optimized connection pooling for Vercel
let mongoConnected = false;

// MongoDB connection options optimized for Vercel serverless functions
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  maxIdleTimeMS: 10000,
  family: 4 // Use IPv4, skip trying IPv6
};

// Enhanced MongoDB error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  mongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  mongoConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  mongoConnected = true;
});

// Create indexes for production performance
const createIndexes = async () => {
  try {
    // Performance indexes
    await Survey.collection.createIndex({ "createdAt": -1 });
    await Survey.collection.createIndex({ "email": 1 }, { sparse: true });
    
    // Rating-based indexes
    await Survey.collection.createIndex({ "satisfactionRating": 1, "createdAt": -1 });
    await Survey.collection.createIndex({ "recommendationRating": 1, "createdAt": -1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('MongoDB connected successfully');
    mongoConnected = true;
    // Create indexes after successful connection
    createIndexes();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue running without MongoDB connection');
  });

// Define survey schema and model
const surveySchema = new mongoose.Schema({
  surveyId: String,
  title: String,
  description: String,
  questions: Array,
  responses: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow flexible schema for various survey formats

const Survey = mongoose.model('Survey', surveySchema, 'survey_data');

// API Routes
app.get('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.json([]);
    }
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/surveys/:id', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = new Survey(req.body);
    const newSurvey = await survey.save();
    res.status(201).json(newSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Data validation function for external surveys
const validateSurveyData = (data) => {
  // Check for required fields based on your needs
  if (data.email && !data.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  // Validate rating values
  if (data.satisfactionRating && 
      (isNaN(data.satisfactionRating) || 
       parseInt(data.satisfactionRating) < 1 || 
       parseInt(data.satisfactionRating) > 5)) {
    throw new Error('Satisfaction rating must be between 1-5');
  }
  
  if (data.recommendationRating && 
      (isNaN(data.recommendationRating) || 
       parseInt(data.recommendationRating) < 0 || 
       parseInt(data.recommendationRating) > 10)) {
    throw new Error('Recommendation rating must be between 0-10');
  }
  
  return true;
};

// Endpoint for external survey tools to send data
app.post('/api/external/surveys', async (req, res) => {
  try {
    // Validate the incoming data (basic validation)
    if (!req.body) {
      return res.status(400).json({ message: 'Survey data is required' });
    }
    
    // Validate survey data format
    try {
      validateSurveyData(req.body);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    if (!mongoConnected) {
      console.log('Survey data received but database not available:', req.body);
      return res.status(503).json({ message: 'Database not available, data logged to console' });
    }
    
    // Create a new survey document
    const surveyData = {
      ...req.body,
      surveyId: req.body.surveyId || uuidv4(),
      updatedAt: Date.now()
    };
    
    const survey = new Survey(surveyData);
    const savedSurvey = await survey.save();
    
    res.status(201).json({
      message: 'Survey data received and stored successfully',
      surveyId: savedSurvey._id
    });
  } catch (err) {
    console.error('Error saving survey data:', err);
    res.status(500).json({ message: 'Failed to save survey data', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Import optimized modules
const connectWithOptimization = require('../database/optimizedConnection');
const { apiLimiter, surveyLimiter } = require('../middleware/security');
const { jsonParser, urlencodedParser, timeoutMiddleware } = require('../middleware/optimization');
const compressionMiddleware = require('../middleware/compression');
const performanceMonitor = require('../middleware/performance');
const CacheService = require('../middleware/cache');
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://survey-feedback-dashboard.vercel.app',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  ].filter(Boolean),
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Connect to MongoDB with optimized connection pooling for Vercel
let mongoConnected = false;

// MongoDB connection options optimized for Vercel serverless functions
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  maxIdleTimeMS: 10000,
  family: 4 // Use IPv4, skip trying IPv6
};

// Enhanced MongoDB error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  mongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  mongoConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  mongoConnected = true;
});

// Create indexes for production performance
const createIndexes = async () => {
  try {
    // Performance indexes
    await Survey.collection.createIndex({ "createdAt": -1 });
    await Survey.collection.createIndex({ "email": 1 }, { sparse: true });
    
    // Rating-based indexes
    await Survey.collection.createIndex({ "satisfactionRating": 1, "createdAt": -1 });
    await Survey.collection.createIndex({ "recommendationRating": 1, "createdAt": -1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('MongoDB connected successfully');
    mongoConnected = true;
    // Create indexes after successful connection
    createIndexes();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue running without MongoDB connection');
  });

// Define survey schema and model
const surveySchema = new mongoose.Schema({
  surveyId: String,
  title: String,
  description: String,
  questions: Array,
  responses: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow flexible schema for various survey formats

const Survey = mongoose.model('Survey', surveySchema, 'survey_data');

// API Routes
app.get('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.json([]);
    }
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/surveys/:id', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = new Survey(req.body);
    const newSurvey = await survey.save();
    res.status(201).json(newSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Data validation function for external surveys
const validateSurveyData = (data) => {
  // Check for required fields based on your needs
  if (data.email && !data.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  // Validate rating values
  if (data.satisfactionRating && 
      (isNaN(data.satisfactionRating) || 
       parseInt(data.satisfactionRating) < 1 || 
       parseInt(data.satisfactionRating) > 5)) {
    throw new Error('Satisfaction rating must be between 1-5');
  }
  
  if (data.recommendationRating && 
      (isNaN(data.recommendationRating) || 
       parseInt(data.recommendationRating) < 0 || 
       parseInt(data.recommendationRating) > 10)) {
    throw new Error('Recommendation rating must be between 0-10');
  }
  
  return true;
};

// Endpoint for external survey tools to send data
app.post('/api/external/surveys', async (req, res) => {
  try {
    // Validate the incoming data (basic validation)
    if (!req.body) {
      return res.status(400).json({ message: 'Survey data is required' });
    }
    
    // Validate survey data format
    try {
      validateSurveyData(req.body);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    if (!mongoConnected) {
      console.log('Survey data received but database not available:', req.body);
      return res.status(503).json({ message: 'Database not available, data logged to console' });
    }
    
    // Create a new survey document
    const surveyData = {
      ...req.body,
      surveyId: req.body.surveyId || uuidv4(),
      updatedAt: Date.now()
    };
    
    const survey = new Survey(surveyData);
    const savedSurvey = await survey.save();
    
    res.status(201).json({
      message: 'Survey data received and stored successfully',
      surveyId: savedSurvey._id
    });
  } catch (err) {
    console.error('Error saving survey data:', err);
    res.status(500).json({ message: 'Failed to save survey data', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Import optimized modules
const connectWithOptimization = require('../database/optimizedConnection');
const { apiLimiter, surveyLimiter } = require('../middleware/security');
const { jsonParser, urlencodedParser, timeoutMiddleware } = require('../middleware/optimization');
const compressionMiddleware = require('../middleware/compression');
const performanceMonitor = require('../middleware/performance');
const CacheService = require('../middleware/cache');
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://survey-feedback-dashboard.vercel.app',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  ].filter(Boolean),
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Connect to MongoDB with optimized connection pooling for Vercel
let mongoConnected = false;

// MongoDB connection options optimized for Vercel serverless functions
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  maxIdleTimeMS: 10000,
  family: 4 // Use IPv4, skip trying IPv6
};

// Enhanced MongoDB error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  mongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  mongoConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  mongoConnected = true;
});

// Create indexes for production performance
const createIndexes = async () => {
  try {
    // Performance indexes
    await Survey.collection.createIndex({ "createdAt": -1 });
    await Survey.collection.createIndex({ "email": 1 }, { sparse: true });
    
    // Rating-based indexes
    await Survey.collection.createIndex({ "satisfactionRating": 1, "createdAt": -1 });
    await Survey.collection.createIndex({ "recommendationRating": 1, "createdAt": -1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('MongoDB connected successfully');
    mongoConnected = true;
    // Create indexes after successful connection
    createIndexes();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue running without MongoDB connection');
  });

// Define survey schema and model
const surveySchema = new mongoose.Schema({
  surveyId: String,
  title: String,
  description: String,
  questions: Array,
  responses: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allow flexible schema for various survey formats

const Survey = mongoose.model('Survey', surveySchema, 'survey_data');

// API Routes
app.get('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.json([]);
    }
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    mongodb: mongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/surveys/:id', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/surveys', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const survey = new Survey(req.body);
    const newSurvey = await survey.save();
    res.status(201).json(newSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Data validation function for external surveys
const validateSurveyData = (data) => {
  // Check for required fields based on your needs
  if (data.email && !data.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  // Validate rating values
  if (data.satisfactionRating && 
      (isNaN(data.satisfactionRating) || 
       parseInt(data.satisfactionRating) < 1 || 
       parseInt(data.satisfactionRating) > 5)) {
    throw new Error('Satisfaction rating must be between 1-5');
  }
  
  if (data.recommendationRating && 
      (isNaN(data.recommendationRating) || 
       parseInt(data.recommendationRating) < 0 || 
       parseInt(data.recommendationRating) > 10)) {
    throw new Error('Recommendation rating must be between 0-10');
  }
  
  return true;
};

// Endpoint for external survey tools to send data
app.post('/api/external/surveys', async (req, res) => {
  try {
    // Validate the incoming data (basic validation)
    if (!req.body) {
      return res.status(400).json({ message: 'Survey data is required' });
    }
    
    // Validate survey data format
    try {
      validateSurveyData(req.body);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    if (!mongoConnected) {
      console.log('Survey data received but database not available:', req.body);
      return res.status(503).json({ message: 'Database not available, data logged to console' });
    }
    
    // Create a new survey document
    const surveyData = {
      ...req.body,
      surveyId: req.body.surveyId || uuidv4(),
      updatedAt: Date.now()
    };
    
    const survey = new Survey(surveyData);
    const savedSurvey = await survey.save();
    
    res.status(201).json({
      message: 'Survey data received and stored successfully',
      surveyId: savedSurvey._id
    });
  } catch (err) {
    console.error('Error saving survey data:', err);
    res.status(500).json({ message: 'Failed to save survey data', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Import optimized modules
const connectWithOptimization = require('../database/optimizedConnection');
const { apiLimiter, surveyLimiter } = require('../middleware/security');
const { jsonParser, urlencodedParser, timeoutMiddleware } = require('../middleware/optimization');
const compressionMiddleware = require('../middleware/compression');
const performanceMonitor = require('../middleware/performance');
const CacheService = require('../middleware/cache');
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://survey-feedback-dashboard.vercel.app',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  ].filter(Boolean),
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Connect to MongoDB with optimized connection pooling for Vercel
let mongoConnected = false;

// MongoDB connection options optimized