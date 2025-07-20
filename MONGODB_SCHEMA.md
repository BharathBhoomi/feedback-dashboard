# MongoDB Schema Documentation

## Current Schema Design

The application uses a **flexible schema approach** with `{ strict: false }` to accommodate various survey formats while maintaining core structure.

### Base Schema Structure

```javascript
const surveySchema = new mongoose.Schema({
  surveyId: String,
  title: String,
  description: String,
  questions: Array,
  responses: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false }); // Allows additional fields
```

## Supported Data Formats

### 1. Standard Survey Format
```json
{
  "surveyId": "survey_001",
  "title": "Customer Satisfaction Survey",
  "description": "Monthly feedback collection",
  "questions": [
    {
      "id": "q1",
      "type": "rating",
      "question": "How satisfied are you?",
      "scale": "1-5"
    }
  ],
  "responses": [
    {
      "questionId": "q1",
      "answer": "4"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. External Survey Format (Your Data)
```json
{
  "recommendationRating": "3",
  "satisfactionRating": "2",
  "experience": "cdcdcdc",
  "contactPermission": "No, I don't want to be contacted by DHL.",
  "furtherInfoPermission": "No, I don't want to be contacted by DHL.",
  "fullName": "dcsc",
  "phone": "dcdscvsdc",
  "email": "njnlknlk@gmail.com",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 3. Mixed Format Example
```json
{
  "title": "DHL Service Feedback",
  "surveyType": "customer_satisfaction",
  "recommendationRating": "3",
  "satisfactionRating": "2",
  "experience": "Good service overall",
  "contactPermission": "Yes, I agree to be contacted",
  "furtherInfoPermission": "No, I don't want to be contacted",
  "customerInfo": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "email": "john.doe@email.com"
  },
  "metadata": {
    "source": "website",
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Field Definitions

### Core Fields (Always Present)
- **createdAt**: Timestamp when record was created
- **updatedAt**: Timestamp when record was last modified

### Standard Survey Fields
- **surveyId**: Unique identifier for the survey template
- **title**: Survey title or name
- **description**: Survey description
- **questions**: Array of question objects
- **responses**: Array of response objects

### Rating Fields
- **recommendationRating**: Net Promoter Score (0-10 scale)
- **satisfactionRating**: Customer satisfaction (1-5 scale)
- **overallRating**: General rating field

### Contact & Permission Fields
- **contactPermission**: User consent for contact
- **furtherInfoPermission**: User consent for additional information
- **marketingPermission**: User consent for marketing communications

### User Information Fields
- **fullName**: Customer's full name
- **firstName**: Customer's first name
- **lastName**: Customer's last name
- **email**: Customer's email address
- **phone**: Customer's phone number
- **company**: Customer's company name

### Experience & Feedback Fields
- **experience**: Open-text feedback
- **comments**: Additional comments
- **suggestions**: Improvement suggestions
- **issues**: Reported problems

### Metadata Fields
- **source**: Data source (website, app, email, etc.)
- **surveyType**: Type of survey (satisfaction, nps, feedback, etc.)
- **language**: Survey language
- **userAgent**: Browser/device information
- **ipAddress**: User's IP address
- **sessionId**: User session identifier

## Data Validation

### Required Fields
- None (flexible schema allows any structure)
- Timestamps are auto-generated

### Recommended Fields for Analytics
- At least one rating field
- Contact information (email or phone)
- Survey type or source

### Data Types
- **Strings**: Most fields accept string values
- **Numbers**: Rating fields can be stored as strings or numbers
- **Objects**: Nested data structures supported
- **Arrays**: Multiple values or responses
- **Dates**: ISO 8601 format recommended

## Indexing Strategy

### Recommended Indexes
```javascript
// Performance indexes
db.survey_data.createIndex({ "createdAt": -1 }); // Recent surveys first
db.survey_data.createIndex({ "email": 1 }); // Customer lookup
db.survey_data.createIndex({ "surveyType": 1 }); // Survey type filtering
db.survey_data.createIndex({ "source": 1 }); // Source filtering

// Compound indexes for analytics
db.survey_data.createIndex({ "surveyType": 1, "createdAt": -1 });
db.survey_data.createIndex({ "satisfactionRating": 1, "createdAt": -1 });
```

## Query Examples

### Find Recent Surveys
```javascript
db.survey_data.find().sort({ createdAt: -1 }).limit(10)
```

### Find by Rating Range
```javascript
db.survey_data.find({
  satisfactionRating: { $in: ["4", "5"] }
})
```

### Find by Contact Permission
```javascript
db.survey_data.find({
  contactPermission: { $regex: /yes/i }
})
```

### Aggregate by Rating
```javascript
db.survey_data.aggregate([
  {
    $group: {
      _id: "$satisfactionRating",
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
])
```

## Best Practices

### Data Storage
1. **Consistent Field Naming**: Use camelCase for field names
2. **Standardized Values**: Use consistent values for permissions ("Yes"/"No")
3. **Data Sanitization**: Clean user input before storage
4. **Timestamp Consistency**: Always use UTC timestamps

### Performance
1. **Index Frequently Queried Fields**: Email, createdAt, ratings
2. **Limit Document Size**: Keep documents under 16MB
3. **Use Projection**: Only fetch needed fields in queries
4. **Batch Operations**: Use bulk operations for multiple inserts

### Security
1. **PII Protection**: Encrypt sensitive personal information
2. **Data Retention**: Implement data cleanup policies
3. **Access Control**: Restrict database access
4. **Audit Logging**: Track data access and modifications

## Migration Considerations

The flexible schema allows for easy evolution:
- New fields can be added without schema changes
- Existing data remains compatible
- Gradual migration of field formats possible
- Backward compatibility maintained

## Collection Statistics

Monitor these metrics:
- Document count
- Average document size
- Index usage statistics
- Query performance metrics
- Storage utilization