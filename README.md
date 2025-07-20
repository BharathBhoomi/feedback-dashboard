# Survey Feedback Dashboard

A full-stack application to collect survey data from external sources, store it in MongoDB, and provide a dashboard for visualization and data extraction.

## Features

- **Data Collection**: API endpoint for external survey tools to send data
- **Data Storage**: MongoDB integration for storing survey data
- **Data Visualization**: Dashboard with charts showing survey trends
- **Data Export**: Export survey data to CSV format
- **Real-time Updates**: Live dashboard updates when new data is received

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- CORS for cross-origin requests
- dotenv for environment variables

### Frontend
- React.js
- Material-UI for components
- Chart.js with react-chartjs-2 for data visualization
- Axios for API calls
- React Router for navigation

## Project Structure

```
feedback-dashboard/
├── server/
│   └── server.js           # Express server with API endpoints
├── client/
│   ├── public/
│   │   └── index.html      # Main HTML file
│   └── src/
│       ├── components/
│       │   └── Dashboard.js # Main dashboard component
│       ├── App.js          # Main App component
│       ├── index.js        # React entry point
│       ├── App.css         # App styles
│       └── index.css       # Global styles
├── .env                    # Environment variables
├── .gitignore             # Git ignore file
├── package.json           # Root package.json
└── README.md              # This file
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB installation)
- Vercel account (for deployment)

### Installation

1. **Clone or download the project**
   ```bash
   cd feedback-dashboard
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Configuration**
   
   The `.env` file is already configured with:
   ```
   MONGO_URI=mongodb+srv://bhboomis:Earth@1234@cluster0.9ezpy0a.mongodb.net/surveys?retryWrites=true&w=majority&appName=Cluster0
   PORT=5000
   ```

### Running the Application

#### Development Mode (Both servers)
```bash
npm run dev
```
This starts both the backend server (port 5000) and frontend development server (port 3000).

#### Backend Only
```bash
npm run server
```

#### Frontend Only
```bash
npm run client
```

#### Production Mode
```bash
npm start
```

## Deployment to Vercel

This application is configured for deployment to Vercel. For detailed instructions, see the [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) file.

### Quick Deployment Steps

#### Option 1: Using the Deployment Helper Script (Recommended)

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Run the deployment script**
   ```bash
   npm run deploy
   ```
   This will check prerequisites and deploy a preview version.

4. **Deploy to Production**
   ```bash
   npm run deploy-prod
   ```

#### Option 2: Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Vercel**
   ```bash
   npm run deploy-vercel
   ```
   Follow the interactive prompts to configure your deployment.

4. **Deploy to Production**
   ```bash
   npm run deploy-vercel-prod
   ```

### Environment Variables

Make sure to set these environment variables in the Vercel dashboard:
- `MONGO_URI`: Your MongoDB connection string

## API Endpoints

### Survey Management
- `GET /api/surveys` - Get all surveys
- `GET /api/surveys/:id` - Get a specific survey
- `POST /api/surveys` - Create a new survey

### External Survey Integration
- `POST /api/external/surveys` - Endpoint for external survey tools to send data

### Example API Usage

#### Send Survey Data from External Tools
```bash
curl -X POST http://localhost:5000/api/external/surveys \
  -H "Content-Type: application/json" \
  -d '{
    "surveyId": "survey_123",
    "title": "Customer Satisfaction Survey",
    "description": "Monthly customer feedback survey",
    "questions": [
      {
        "id": 1,
        "question": "How satisfied are you with our service?",
        "type": "rating"
      }
    ],
    "responses": [
      {
        "questionId": 1,
        "answer": 5,
        "respondentId": "user_456"
      }
    ]
  }'
```

## Database Schema

The application uses a flexible MongoDB schema stored in the `survey_data` collection:

```javascript
{
  surveyId: String,        // Unique survey identifier
  title: String,           // Survey title
  description: String,     // Survey description
  questions: Array,        // Array of question objects
  responses: Array,        // Array of response objects
  createdAt: Date,         // Auto-generated creation timestamp
  updatedAt: Date          // Auto-generated update timestamp
}
```

## Dashboard Features

### Visualizations
1. **Surveys Over Time** - Line chart showing survey creation trends
2. **Responses by Survey** - Bar chart showing response counts per survey
3. **Survey Data Table** - Detailed table with all survey information

### Data Export
- Export all survey data to CSV format
- Includes survey ID, title, description, creation date, and response count

## Accessing the Application

### Local Development
- **Dashboard**: http://localhost:3000
- **API Base URL**: http://localhost:5000

### Production (Vercel)
- **Dashboard**: https://your-vercel-url.vercel.app
- **API Base URL**: https://your-vercel-url.vercel.app/api

## Security Considerations

For production deployment, consider implementing:

1. **Authentication**: Add API key authentication for the external survey endpoint
2. **Rate Limiting**: Implement rate limiting to prevent API abuse
3. **Data Validation**: Add comprehensive input validation
4. **HTTPS**: Use HTTPS in production
5. **Environment Variables**: Secure storage of database credentials

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify the MongoDB URI in `.env`
   - Check network connectivity
   - Ensure MongoDB Atlas IP whitelist includes your IP

2. **Port Already in Use**
   - Change the PORT in `.env` file
   - Kill existing processes using the ports

3. **Frontend Not Loading**
   - Ensure both backend and frontend servers are running
   - Check browser console for errors
   - Verify proxy configuration in client/package.json

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.