# 🚀 Deployment Guide - Survey Feedback Dashboard

## Prerequisites
- Git installed on your system
- GitHub account
- Vercel account (free tier available)

## 📋 Step-by-Step Deployment

### 1. Initialize Git Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Survey feedback dashboard with embedded SDK"
```

### 2. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `survey-feedback-dashboard`
3. Don't initialize with README (we already have one)
4. Copy the repository URL

### 3. Connect Local Repository to GitHub

```bash
# Add remote origin (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/survey-feedback-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 4. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy the project
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: survey-feedback-dashboard
# - Directory: ./ (current directory)
# - Override settings? N
```

#### Option B: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm install`
   - **Output Directory**: public
   - **Install Command**: `npm install`

### 5. Configure Environment Variables in Vercel

1. In Vercel Dashboard, go to your project
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
MONGO_URI = mongodb+srv://bhboomis:nPCJggIkHu1sYMF8@cluster0.9ezpy0a.mongodb.net/surveys?retryWrites=true&w=majority&appName=Cluster0
PORT = 5000
```

### 6. Update API URLs for Production

After deployment, update your SDK configuration in client applications:

```javascript
// Replace localhost with your Vercel domain
const surveySDK = initSurveySDK({
  apiBaseUrl: 'https://your-project-name.vercel.app/api'
});
```

## 🔧 Production Configuration

### Update CORS Settings (if needed)

If you encounter CORS issues, update `server/server.js`:

```javascript
app.use(cors({
  origin: [
    'https://your-domain.com',
    'https://your-project-name.vercel.app'
  ],
  credentials: true
}));
```

### MongoDB Atlas Network Access

1. Go to MongoDB Atlas Dashboard
2. Navigate to **Network Access**
3. Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
4. Or add Vercel's IP ranges for better security

## 📊 Post-Deployment URLs

After successful deployment, you'll have:

- **Dashboard**: `https://your-project-name.vercel.app/`
- **API Health**: `https://your-project-name.vercel.app/api/health`
- **External Survey Endpoint**: `https://your-project-name.vercel.app/api/external/surveys`
- **SDK**: `https://your-project-name.vercel.app/survey-sdk.js`
- **Examples**: `https://your-project-name.vercel.app/embed-example.html`

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your main branch:

```bash
# Make changes to your code
git add .
git commit -m "Update: description of changes"
git push origin main
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **API Not Working**: Verify environment variables are set correctly
3. **CORS Errors**: Update CORS configuration for your domain
4. **MongoDB Connection**: Ensure IP whitelist includes `0.0.0.0/0`

### Vercel Logs:

```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --follow
```

## 🎯 Custom Domain (Optional)

1. In Vercel Dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed
4. Update SDK configurations with new domain

## 📈 Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Function Logs**: Real-time API logs in Vercel dashboard
- **MongoDB Atlas**: Database monitoring and alerts

---

🎉 **Your survey feedback dashboard is now live and ready for production use!**