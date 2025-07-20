# MongoDB Schema Implementation Guide

## Data Structure Analysis

The provided data structure represents a customer survey response with the following fields:

```json
{
  "recommendationRating": "3",
  "satisfactionRating": "2",
  "experience": "cdcdcdc",
  "contactPermission": "No, I don't want to be contacted by DHL.",
  "furtherInfoPermission": "No, I don't want to be contacted by DHL.",
  "fullName": "dcsc",
  "phone": "dcdscvsdc",
  "email": "njnlknlk@gmail.com"
}
```

This structure includes:
- Rating fields (numeric values stored as strings)
- Permission fields (text responses)
- Contact information (name, phone, email)
- Feedback text (experience)

## Implementation Examples

### 1. Enhanced Schema Definition

While maintaining the flexible schema approach, we can add field definitions for better documentation and optional validation:

```javascript
// Enhanced surveySchema with field definitions
const surveySchema = new mongoose.Schema({
  // Core fields (from original schema)
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
  
  // Timestamps (from original schema)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Keep flexible schema
```

### 2. Data Validation Function

```javascript
/**
 * Validates external survey data
 * @param {Object} data - The survey data to validate
 * @returns {Object} - Validation result with status and errors
 */
const validateExternalSurvey = (data) => {
  const errors = [];
  
  // Check email format if provided
  if (data.email && (!data.email.includes('@') || !data.email.includes('.'))) {
    errors.push('Invalid email format');
  }
  
  // Validate rating values
  if (data.recommendationRating) {
    const rating = parseInt(data.recommendationRating);
    if (isNaN(rating) || rating < 0 || rating > 10) {
      errors.push('Recommendation rating must be between 0-10');
    }
  }
  
  if (data.satisfactionRating) {
    const rating = parseInt(data.satisfactionRating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      errors.push('Satisfaction rating must be between 1-5');
    }
  }
  
  // Validate permission fields format
  const permissionFields = ['contactPermission', 'furtherInfoPermission'];
  permissionFields.forEach(field => {
    if (data[field] && typeof data[field] !== 'string') {
      errors.push(`${field} must be a string`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

### 3. Enhanced API Endpoint

```javascript
/**
 * External survey submission endpoint with enhanced validation and error handling
 */
app.post('/api/external/surveys', async (req, res) => {
  try {
    // Check if request body exists
    if (!req.body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Survey data is required' 
      });
    }
    
    // Validate the data
    const validation = validateExternalSurvey(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid survey data', 
        errors: validation.errors 
      });
    }
    
    // Check MongoDB connection
    if (!mongoConnected) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database unavailable' 
      });
    }
    
    // Generate surveyId if not provided
    const surveyData = {
      ...req.body,
      surveyId: req.body.surveyId || uuidv4(),
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
```

### 4. Data Processing Functions

```javascript
/**
 * Processes and standardizes survey data
 * @param {Object} data - Raw survey data
 * @returns {Object} - Processed survey data
 */
const processSurveyData = (data) => {
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
  
  return processed;
};
```

### 5. Query Examples for This Data Structure

```javascript
/**
 * Find surveys by recommendation rating range
 * @param {number} min - Minimum rating (0-10)
 * @param {number} max - Maximum rating (0-10)
 * @returns {Promise<Array>} - Matching surveys
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
 * Find surveys by contact permission
 * @param {boolean} hasPermission - Whether contact is permitted
 * @returns {Promise<Array>} - Matching surveys
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
 * Aggregate satisfaction ratings
 * @returns {Promise<Array>} - Aggregated results
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
```

## Data Transformation for Dashboard

```javascript
/**
 * Transforms survey data for dashboard display
 * @param {Array} surveys - Raw survey documents
 * @returns {Object} - Dashboard-ready data
 */
const prepareDashboardData = (surveys) => {
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
    npsScore
  };
};
```

## Best Practices for This Schema

1. **String vs. Number Storage**:
   - The example data stores ratings as strings ("3", "2")
   - Consider converting to numbers during processing for calculations
   - Keep original string values for exact matching

2. **Permission Field Handling**:
   - The permission fields contain full sentences ("No, I don't want to be contacted by DHL.")
   - Extract boolean values during processing
   - Maintain original text for audit purposes

3. **Data Sanitization**:
   - Sanitize all user inputs, especially the `experience` field
   - Trim whitespace from string fields
   - Normalize email addresses (lowercase)

4. **Performance Considerations**:
   - Index the `email` field for customer lookups
   - Index rating fields for analytics queries
   - Use projection to limit returned fields in queries

## Conclusion

The provided data structure is well-suited for the existing flexible schema approach. By implementing the validation, processing, and query functions outlined above, you can effectively work with this data format while maintaining good performance and data integrity.