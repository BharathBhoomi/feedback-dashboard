/**
 * SERVER_IMPLEMENTATION.js
 * 
 * This file contains implementation examples for handling the specific MongoDB schema
 * provided by the user. It includes validation, processing, and database operations.
 * 
 * Data structure example:
 * {
 *   "recommendationRating": "3",
 *   "satisfactionRating": "2",
 *   "experience": "cdcdcdc",
 *   "contactPermission": "No, I don't want to be contacted by DHL.",
 *   "furtherInfoPermission": "No, I don't want to be contacted by DHL.",
 *   "fullName": "dcsc",
 *   "phone": "dcdscvsdc",
 *   "email": "njnlknlk@gmail.com"
 * }
 */

const express = require('express');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const sanitizeHtml = require('sanitize-html');

// MongoDB Connection Options for Vercel
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  maxIdleTimeMS: 10000
};

/**
 * Enhanced Survey Schema
 * Maintains flexibility while documenting expected fields
 */
const surveySchema = new mongoose.Schema({
  // Core fields
  surveyId: String,
  title: String,
  description: String,
  questions: Array,
  responses: Array,
  
  // Rating fields
  recommendationRating: String, // NPS (0-10)
  satisfactionRating: String,   // CSAT (1-5)
  
  // Permission fields
  contactPermission: String,
  furtherInfoPermission: String,
  
  // Contact information
  fullName: String,
  phone: String,
  email: String,
  
  // Feedback
  experience: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Keep flexible schema

// Create model
const Survey = mongoose.model('Survey', surveySchema);

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {Object} data - The data to sanitize
 * @returns {Object} - Sanitized data
 */
const sanitizeData = (data) => {
  const sanitized = {};
  
  // Process each field
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      // Sanitize HTML content for text fields
      sanitized[key] = sanitizeHtml(data[key], {
        allowedTags: [],
        allowedAttributes: {}
      });
    } else if (Array.isArray(data[key])) {
      // Handle arrays
      sanitized[key] = data[key].map(item => {
        return typeof item === 'string' 
          ? sanitizeHtml(item, { allowedTags: [], allowedAttributes: {} })
          : item;
      });
    } else {
      // Pass through non-string values
      sanitized[key] = data[key];
    }
  });
  
  return sanitized;
};

/**
 * Validates external survey data
 * @param {Object} data - The survey data to validate
 * @returns {Object} - Validation result with status and errors
 */
const validateExternalSurvey = (data) => {
  const errors = [];
  
  // Check email format if provided
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Validate rating values
  if (data.recommendationRating !== undefined) {
    const rating = parseInt(data.recommendationRating);
    if (isNaN(rating) || rating < 0 || rating > 10) {
      errors.push('Recommendation rating must be between 0-10');
    }
  }
  
  if (data.satisfactionRating !== undefined) {
    const rating = parseInt(data.satisfactionRating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      errors.push('Satisfaction rating must be between 1-5');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Processes and standardizes survey data
 * @param {Object} data - Raw survey data
 * @returns {Object} - Processed survey data
 */
const processSurveyData = (data) => {
  // Create a copy to avoid modifying the original
  const processed = { ...data };
  
  // Standardize permission responses
  if (processed.contactPermission) {
    processed.contactPermissionValue = processed.contactPermission.toLowerCase().includes('yes');
  }
  
  if (processed.furtherInfoPermission) {
    processed.furtherInfoPermissionValue = processed.furtherInfoPermission.toLowerCase().includes('yes');
  }
  
  // Convert ratings to numbers for analytics
  if (processed.recommendationRating) {
    processed.recommendationRatingValue = parseInt(processed.recommendationRating);
  }
  
  if (processed.satisfactionRating) {
    processed.satisfactionRatingValue = parseInt(processed.satisfactionRating);
  }
  
  // Add metadata
  processed.source = processed.source || 'external';
  processed.surveyType = processed.surveyType || 'customer_feedback';
  processed.submittedAt = new Date();
  
  return processed;
};

/**
 * Creates MongoDB indexes for optimized queries
 */
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

/**
 * Example Express route implementation for external surveys
 */
const setupExternalSurveyRoute = (app) => {
  app.post('/api/external/surveys', async (req, res) => {
    try {
      // Check if request body exists
      if (!req.body) {
        return res.status(400).json({ 
          success: false, 
          message: 'Survey data is required' 
        });
      }
      
      // Sanitize input data
      const sanitizedData = sanitizeData(req.body);
      
      // Validate the data
      const validation = validateExternalSurvey(sanitizedData);
      if (!validation.isValid) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid survey data', 
          errors: validation.errors 
        });
      }
      
      // Process the data
      const processedData = processSurveyData(sanitizedData);
      
      // Generate surveyId if not provided
      const surveyData = {
        ...processedData,
        surveyId: processedData.surveyId || uuidv4(),
        updatedAt: new Date()
      };
      
      // Create and save the survey
      const survey = new Survey(surveyData);
      await survey.save();
      
      // Return success response
      return res.status(201).json({ 
        success: true, 
        message: 'Survey submitted successfully', 
        surveyId: survey.surveyId 
      });
    } catch (error) {
      console.error('Error saving survey:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error saving survey' 
      });
    }
  });
};

/**
 * Query function: Find surveys by recommendation rating range
 */
const findByRecommendationRating = async (min, max) => {
  try {
    // Convert numbers to strings to match stored format
    const ratings = [];
    for (let i = min; i <= max; i++) {
      ratings.push(i.toString());
    }
    
    return await Survey.find({
      recommendationRating: { $in: ratings }
    }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error querying surveys:', error);
    throw error;
  }
};

/**
 * Query function: Find surveys by contact permission
 */
const findByContactPermission = async (hasPermission) => {
  try {
    const regex = hasPermission ? /yes/i : /no/i;
    
    return await Survey.find({
      contactPermission: { $regex: regex }
    }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error querying surveys:', error);
    throw error;
  }
};

/**
 * Query function: Aggregate satisfaction ratings
 */
const aggregateSatisfactionRatings = async () => {
  try {
    return await Survey.aggregate([
      {
        $group: {
          _id: "$satisfactionRating",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  } catch (error) {
    console.error('Error aggregating surveys:', error);
    throw error;
  }
};

/**
 * Dashboard data preparation function
 */
const prepareDashboardData = async () => {
  try {
    // Get all surveys (consider pagination for large datasets)
    const surveys = await Survey.find().sort({ createdAt: -1 }).limit(1000);
    
    // Initialize counters
    const satisfactionCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    const recommendationCounts = {};
    for (let i = 0; i <= 10; i++) {
      recommendationCounts[i.toString()] = 0;
    }
    
    let contactPermissionYes = 0;
    let contactPermissionNo = 0;
    
    // Process each survey
    surveys.forEach(survey => {
      // Count satisfaction ratings
      if (survey.satisfactionRating && satisfactionCounts[survey.satisfactionRating] !== undefined) {
        satisfactionCounts[survey.satisfactionRating]++;
      }
      
      // Count recommendation ratings
      if (survey.recommendationRating && recommendationCounts[survey.recommendationRating] !== undefined) {
        recommendationCounts[survey.recommendationRating]++;
      }
      
      // Count contact permissions
      if (survey.contactPermission) {
        if (survey.contactPermission.toLowerCase().includes('yes')) {
          contactPermissionYes++;
        } else {
          contactPermissionNo++;
        }
      }
    });
    
    // Calculate NPS
    const promoters = Object.entries(recommendationCounts)
      .filter(([rating]) => parseInt(rating) >= 9)
      .reduce((sum, [_, count]) => sum + count, 0);
      
    const detractors = Object.entries(recommendationCounts)
      .filter(([rating]) => parseInt(rating) <= 6)
      .reduce((sum, [_, count]) => sum + count, 0);
      
    const total = surveys.filter(s => s.recommendationRating).length;
    const npsScore = total > 0 ? Math.round((promoters - detractors) / total * 100) : 0;
    
    // Prepare result
    return {
      totalSurveys: surveys.length,
      satisfactionRatings: satisfactionCounts,
      recommendationRatings: recommendationCounts,
      contactPermission: {
        yes: contactPermissionYes,
        no: contactPermissionNo
      },
      npsScore,
      recentSurveys: surveys.slice(0, 10).map(s => ({
        surveyId: s.surveyId,
        createdAt: s.createdAt,
        satisfactionRating: s.satisfactionRating,
        recommendationRating: s.recommendationRating,
        fullName: s.fullName,
        email: s.email
      }))
    };
  } catch (error) {
    console.error('Error preparing dashboard data:', error);
    throw error;
  }
};

/**
 * Example usage in Express app
 */
const app = express();
app.use(express.json());

// Connect to MongoDB
let mongoConnected = false;
mongoose.connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('Connected to MongoDB');
    mongoConnected = true;
    createIndexes(); // Create indexes
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Setup routes
setupExternalSurveyRoute(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mongoConnected,
    timestamp: new Date().toISOString()
  });
});

// Dashboard data endpoint
app.get('/api/dashboard/data', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database unavailable' 
      });
    }
    
    const dashboardData = await prepareDashboardData();
    return res.json({ 
      success: true, 
      data: dashboardData 
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard data' 
    });
  }
});

// Export for testing
module.exports = {
  Survey,
  validateExternalSurvey,
  processSurveyData,
  findByRecommendationRating,
  findByContactPermission,
  aggregateSatisfactionRatings,
  prepareDashboardData
};