# Vercel Deployment Guide for Survey Feedback Dashboard

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) if you don't have an account
2. **Vercel CLI**: Install using `npm i -g vercel`
3. **MongoDB Atlas Account**: Ensure your MongoDB database is accessible from Vercel
4. **GitHub Repository**: Your code should be pushed to a GitHub repository

## Pre-Deployment Checklist

- [x] MongoDB connection optimized for serverless environment
- [x] CORS configured for Vercel domains
- [x] Proper error handling for serverless functions
- [x] Build scripts configured in package.json
- [x] vercel.json configured with proper routes and function settings
- [x] Environment variables prepared

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended for first deployment)

1. **Login to Vercel**:
   ```
   vercel login
   ```

2. **Deploy the project**:
   ```
   vercel
   ```
   - Follow the interactive prompts
   - When asked about build settings, use the defaults as they're configured in vercel.json

3. **Set environment variables**:
   ```
   vercel env add MONGO_URI
   ```
   - Enter your MongoDB connection string when prompted
   - Choose which environments to add it to (development, preview, production)

4. **Deploy to production**:
   ```
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `public`
   - Install Command: `npm run install-all`
5. Add environment variables:
   - MONGO_URI: Your MongoDB connection string
6. Click "Deploy"

## Post-Deployment

### Verify Deployment

1. **Check the deployment URL**:
   - Open the URL provided by Vercel after deployment
   - Verify that the dashboard loads correctly

2. **Test API endpoints**:
   - Health check: `https://your-vercel-url.vercel.app/api/health`
   - Surveys endpoint: `https://your-vercel-url.vercel.app/api/surveys`

3. **Test external survey submission**:
   ```bash
   curl -X POST https://your-vercel-url.vercel.app/api/external/surveys \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","satisfactionRating":4,"recommendationRating":8}'
   ```

### Troubleshooting Common Issues

1. **MongoDB Connection Errors**:
   - Verify that your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0)
   - Check that your connection string is correct in Vercel environment variables

2. **CORS Issues**:
   - If you're accessing the API from a different domain, add it to the CORS configuration in server.js

3. **Function Timeout Errors**:
   - If you see timeout errors, you may need to optimize your database queries or increase the maxDuration in vercel.json

4. **Build Failures**:
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are properly listed in package.json

## Continuous Deployment

Vercel automatically deploys when you push changes to your GitHub repository. To manually trigger a deployment:

```
vercel --prod
```

## Custom Domain Setup

1. Go to your project in the Vercel dashboard
2. Click on "Domains"
3. Add your custom domain and follow the verification steps

## Monitoring

1. **Vercel Analytics**: Available in the Vercel dashboard
2. **Function Logs**: View logs in the Vercel dashboard under "Functions"
3. **MongoDB Atlas**: Monitor database performance in the MongoDB Atlas dashboard

## Important Notes

- Vercel functions have a maximum execution time (60 seconds as configured)
- Cold starts may cause the first request to be slower
- Keep your MongoDB connection pool optimized for serverless environments
- Consider implementing caching for frequently accessed data