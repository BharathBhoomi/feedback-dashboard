import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Divider,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const CodeBlock = ({ code, language = 'javascript' }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
  };
  
  const handleClose = () => {
    setCopied(false);
  };
  
  return (
    <Box sx={{ position: 'relative', mb: 3 }}>
      <Box 
        sx={{
          backgroundColor: '#f5f5f5',
          p: 2,
          borderRadius: 1,
          overflowX: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          position: 'relative'
        }}
      >
        <Button
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopy}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)'
            }
          }}
        >
          Copy
        </Button>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{code}</pre>
      </Box>
      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          Code copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

const ApiDocs = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const endpointUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/external/surveys'
    : `${window.location.origin}/api/external/surveys`;

  const examplePayload = `{
  "title": "Customer Satisfaction Survey",
  "description": "Please provide your feedback about our service",
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "satisfactionRating": 4,
  "recommendationRating": 8,
  "comments": "The service was great, but could be faster.",
  "source": "website",
  "surveyType": "satisfaction"
}`;

  const fetchExample = `fetch('${endpointUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Customer Satisfaction Survey",
    description: "Please provide your feedback about our service",
    fullName: "John Doe",
    email: "john.doe@example.com",
    satisfactionRating: 4,
    recommendationRating: 8,
    comments: "The service was great, but could be faster.",
    source: "website",
    surveyType: "satisfaction"
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;

  const axiosExample = `import axios from 'axios';

axios.post('${endpointUrl}', {
  title: "Customer Satisfaction Survey",
  description: "Please provide your feedback about our service",
  fullName: "John Doe",
  email: "john.doe@example.com",
  satisfactionRating: 4,
  recommendationRating: 8,
  comments: "The service was great, but could be faster.",
  source: "website",
  surveyType: "satisfaction"
})
.then(response => console.log(response.data))
.catch(error => console.error('Error:', error));`;

  const curlExample = `curl -X POST ${endpointUrl} \
-H "Content-Type: application/json" \
-d '{
  "title": "Customer Satisfaction Survey",
  "description": "Please provide your feedback about our service",
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "satisfactionRating": 4,
  "recommendationRating": 8,
  "comments": "The service was great, but could be faster.",
  "source": "website",
  "surveyType": "satisfaction"
}'`;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>API Documentation</Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="h6" gutterBottom>Endpoint</Typography>
      <Typography variant="body1" gutterBottom>
        POST {endpointUrl}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This endpoint accepts survey data in JSON format and stores it in the database.
      </Typography>
      
      <Typography variant="h6" gutterBottom>Request Format</Typography>
      <Typography variant="body2" gutterBottom>
        Send a POST request with a JSON body containing the survey data.
      </Typography>
      <CodeBlock code={examplePayload} />
      
      <Typography variant="h6" gutterBottom>Field Descriptions</Typography>
      <Box component="ul" sx={{ pl: 2 }}>
        <li><Typography><strong>title</strong> (string): The title of the survey</Typography></li>
        <li><Typography><strong>description</strong> (string): A description of the survey</Typography></li>
        <li><Typography><strong>fullName</strong> (string): The respondent's full name</Typography></li>
        <li><Typography><strong>email</strong> (string): The respondent's email address</Typography></li>
        <li><Typography><strong>satisfactionRating</strong> (number, 1-5): Customer satisfaction rating</Typography></li>
        <li><Typography><strong>recommendationRating</strong> (number, 0-10): Net Promoter Score</Typography></li>
        <li><Typography><strong>comments</strong> (string): Additional feedback from the respondent</Typography></li>
        <li><Typography><strong>source</strong> (string): The source of the survey (e.g., website, email)</Typography></li>
        <li><Typography><strong>surveyType</strong> (string): The type of survey</Typography></li>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Note: The schema is flexible. You can include additional fields as needed.
      </Typography>
      
      <Typography variant="h6" gutterBottom>Code Examples</Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Fetch API" />
          <Tab label="Axios" />
          <Tab label="cURL" />
        </Tabs>
      </Box>
      
      {tabValue === 0 && <CodeBlock code={fetchExample} />}
      {tabValue === 1 && <CodeBlock code={axiosExample} />}
      {tabValue === 2 && <CodeBlock code={curlExample} />}
      
      <Typography variant="h6" gutterBottom>Response</Typography>
      <CodeBlock code={`{
  "message": "Survey data received and stored successfully",
  "surveyId": "60f1a5b3e6b3f32d8c9e4a7d"
}`} />
      
      <Typography variant="h6" gutterBottom>Error Responses</Typography>
      <Typography variant="body2" gutterBottom>
        The API may return the following error responses:
      </Typography>
      <Box component="ul" sx={{ pl: 2 }}>
        <li><Typography><strong>400 Bad Request</strong>: Invalid data format or missing required fields</Typography></li>
        <li><Typography><strong>500 Internal Server Error</strong>: Server-side error</Typography></li>
        <li><Typography><strong>503 Service Unavailable</strong>: Database connection issues</Typography></li>
      </Box>
    </Paper>
  );
};

export default ApiDocs;