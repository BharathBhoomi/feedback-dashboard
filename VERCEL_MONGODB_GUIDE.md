# MongoDB Schema Preparation for Vercel Deployment

## Current Schema Analysis

The application uses a flexible schema approach with `{ strict: false }` that already accommodates the provided data structure:

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

## Schema Compatibility

The current schema implementation is already compatible with Vercel deployment because:

1. **Flexible Schema Design**: The `{ strict: false }` option allows MongoDB to store any fields without requiring schema modifications
2. **Automatic Timestamps**: The schema automatically adds `createdAt` and `updatedAt` fields
3. **No Server-Side Validation**: The current implementation doesn't enforce strict validation that could reject the data format

## Vercel-Specific Optimizations

### 1. Connection Pooling

For Vercel's serverless environment, optimize MongoDB connections:

```javascript
// Add to server.js before mongoose.connect
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  maxIdleTimeMS: 10000
};

mongoose.connect(process.env.MONGO_URI, options)
```

### 2. Serverless Function Timeout

Vercel functions have a default timeout. The current configuration in `vercel.json` is appropriate:

```json
"functions": {
  "server/server.js": {
    "maxDuration": 30
  }
}
```

### 3. Environment Variables

Ensure MongoDB connection string is properly set in Vercel:

```
MONGO_URI = mongodb+srv://bhboomis:nPCJggIkHu1sYMF8@cluster0.9ezpy0a.mongodb.net/surveys?retryWrites=true&w=majority&appName=Cluster0
```

## Production Indexing Strategy

Implement these indexes for production performance:

```javascript
// Add this function to server.js and call it after successful MongoDB connection
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

// Call after successful connection
mongoose.connect(process.env.MONGO_URI, options)
  .then(() => {
    console.log('Connected to MongoDB');
    mongoConnected = true;
    createIndexes(); // Create indexes
  })
```

## Data Validation for Production

Add basic validation for the external survey endpoint:

```javascript
// Add to server.js before the external surveys endpoint handler
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

// Then in your endpoint
app.post('/api/external/surveys', async (req, res) => {
  try {
    // Validate the incoming data
    if (!req.body) {
      return res.status(400).json({ message: 'Survey data is required' });
    }
    
    try {
      validateSurveyData(req.body);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    // Rest of your code...
  }
});
```

## Error Handling for Serverless Environment

Enhance error handling for Vercel's serverless environment:

```javascript
// Add to server.js
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Enhance MongoDB error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  mongoConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  mongoConnected = true;
});
```

## MongoDB Atlas Configuration

1. **Network Access**: Ensure MongoDB Atlas is configured to accept connections from Vercel:
   - Add `0.0.0.0/0` to IP whitelist in MongoDB Atlas

2. **Database User**: Ensure the database user has appropriate permissions:
   - `readWrite` access to the `surveys` database

3. **Connection String**: Use the connection string format with all options:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/surveys?retryWrites=true&w=majority
   ```

## Vercel Deployment Checklist

1. ✅ **Schema Compatibility**: Current flexible schema works with provided data
2. ✅ **Connection Optimization**: Added connection pooling settings
3. ✅ **Indexing Strategy**: Added production indexes for performance
4. ✅ **Data Validation**: Added basic validation for the external survey endpoint
5. ✅ **Error Handling**: Enhanced error handling for serverless environment
6. ✅ **Environment Variables**: Configured in vercel.json
7. ✅ **Function Timeout**: Set to 30 seconds in vercel.json

## Testing Before Deployment

Before deploying to Vercel, test your MongoDB connection and schema with the provided data structure:

```bash
# Test with curl
curl -X POST http://localhost:5000/api/external/surveys \
  -H "Content-Type: application/json" \
  -d '{"recommendationRating":"3","satisfactionRating":"2","experience":"cdcdcdc","contactPermission":"No, I don\'t want to be contacted by DHL.","furtherInfoPermission":"No, I don\'t want to be contacted by DHL.","fullName":"dcsc","phone":"dcdscvsdc","email":"njnlknlk@gmail.com"}'
```

## Post-Deployment Verification

After deploying to Vercel, verify your MongoDB connection:

1. Visit `https://your-project-name.vercel.app/api/health`
2. Check that MongoDB connection status is `true`
3. Test the external survey endpoint with the provided data structure

## Monitoring in Production

1. **Vercel Logs**: Monitor function logs for any MongoDB connection issues
2. **MongoDB Atlas**: Monitor connection count, query performance, and storage usage
3. **Error Tracking**: Consider adding a service like Sentry for error tracking

---

Your MongoDB schema is already well-prepared for Vercel deployment with the flexible schema approach. The optimizations and configurations outlined above will ensure reliable performance in Vercel's serverless environment.