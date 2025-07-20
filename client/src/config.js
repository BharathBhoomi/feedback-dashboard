const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' // This will use relative URLs in production (Vercel)
  : 'http://localhost:5000/api'; // For local development

export default API_URL;