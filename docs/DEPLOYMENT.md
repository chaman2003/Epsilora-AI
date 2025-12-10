# Deployment Guide

## Quick Start - Vercel Deployment

### Frontend Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Backend Deployment

The backend is automatically deployed via the `backend` folder configuration. Both frontend and backend are deployed together.

---

## Environment Variables Setup

### Required Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend.vercel.app
VITE_GEMINI_API_KEY=your_gemini_api_key
```

#### Backend (backend/.env)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your_secure_random_jwt_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-exp

# Server
PORT=3001
NODE_ENV=production

# CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
```

---

## Vercel Dashboard Setup

### 1. Add Environment Variables

1. Go to your **Vercel Project** → **Settings** → **Environment Variables**
2. Add each variable:
   - **Key**: Variable name (e.g., `MONGODB_URI`)
   - **Value**: Variable value
   - **Environments**: Select Production, Preview, and Development as needed

### 2. Required Variables

| Variable | Value | Required For |
|----------|-------|--------------|
| `MONGODB_URI` | MongoDB connection string | Backend |
| `JWT_SECRET` | Random secure string | Backend |
| `GEMINI_API_KEY` | Google Gemini API key | Backend |
| `VITE_GEMINI_API_KEY` | Same as above | Frontend |
| `GEMINI_MODEL` | `gemini-2.0-flash-exp` | Backend |
| `PORT` | `3001` | Backend |
| `NODE_ENV` | `production` | Backend |

### 3. Using Vercel CLI

```bash
# Add environment variable
vercel env add MONGODB_URI

# Add for specific environment
vercel env add GEMINI_API_KEY production

# Pull environment variables to local
vercel env pull
```

---

## Gemini AI Model Configuration

### Available Models

| Model | Use Case | Speed | Quality |
|-------|----------|-------|---------|
| `gemini-2.0-flash-exp` | **Default** - General use | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| `gemini-1.5-flash` | Proven stability | ⚡⚡ | ⭐⭐⭐⭐ |
| `gemini-1.5-flash-8b` | Maximum speed, simple tasks | ⚡⚡⚡ | ⭐⭐⭐ |
| `gemini-1.5-pro` | Complex reasoning | ⚡ | ⭐⭐⭐⭐⭐ |

### Quick Model Change (3 Steps)

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Edit `GEMINI_MODEL`** variable
3. **Redeploy** your project

**Copy & Paste:**
```
gemini-2.0-flash-exp
gemini-1.5-flash
gemini-1.5-flash-8b
gemini-1.5-pro
gemini-pro
```

### When to Use Each Model

- **gemini-2.0-flash-exp**: Recommended for general use (latest, fastest)
- **gemini-1.5-flash**: When you need proven stability
- **gemini-1.5-flash-8b**: Maximum speed for simple tasks
- **gemini-1.5-pro**: When complex reasoning is needed (slower but more capable)

---

## Troubleshooting

### Common Issues

**Deployment Fails**
- Verify all environment variables are set
- Check build logs in Vercel dashboard
- Ensure dependencies are in `package.json`

**MongoDB Connection Failed**
- Check `MONGODB_URI` format is correct
- Verify network access in MongoDB Atlas (IP whitelist)
- Ensure database user has proper permissions

**API Not Working**
- Verify `VITE_API_URL` points to your backend URL
- Check CORS configuration in backend
- Ensure `ALLOWED_ORIGINS` includes your frontend URL

**Gemini AI Errors**
- Verify `GEMINI_API_KEY` is valid and active
- Check API quota/limits in Google Cloud Console
- Try a different model if current one is unavailable

### Environment Variables Not Working

If environment variables aren't being picked up:

1. **Re-add the variable** in Vercel dashboard
2. **Redeploy** the project (Vercel needs a redeploy to pick up new env vars)
3. **Check spelling** - Variable names are case-sensitive
4. **Verify environment** - Make sure variable is added to the correct environment (Production/Preview/Development)

### Force Redeploy

```bash
# Trigger a new deployment
vercel --prod --force

# Or create a new deployment from latest commit
git commit --allow-empty -m "Trigger deployment"
git push
```

---

## Monitoring

### Vercel Analytics

- View deployment logs in Vercel dashboard
- Monitor function execution times
- Track error rates and performance

### MongoDB Atlas

- Monitor database connections
- Check query performance
- Set up alerts for issues

---

## Continuous Deployment

Vercel automatically deploys when you push to your connected Git repository:

1. **Connect Repository**: Link your GitHub/GitLab repository in Vercel
2. **Auto Deploy**: Every push to `main`/`master` triggers production deployment
3. **Preview Deployments**: Pull requests get preview deployments

---

## Security Best Practices

1. **Never commit `.env` files** - Always use `.env.example` as template
2. **Rotate secrets regularly** - Update JWT_SECRET, API keys periodically
3. **Use strong JWT secrets** - Generate with: `openssl rand -base64 32`
4. **Restrict CORS origins** - Only allow your frontend domain
5. **Enable MongoDB IP whitelist** - Restrict database access
6. **Use HTTPS only** - Vercel provides automatic SSL

---

## Performance Optimization

1. **Enable caching** in Vercel settings
2. **Use CDN** for static assets
3. **Optimize images** with Vercel Image Optimization
4. **Monitor bundle size** - Keep chunks under 500KB
5. **Use environment-specific configs** for development vs production

---

## Need Help?

- Check [Vercel Documentation](https://vercel.com/docs)
- Review [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- See [Google Gemini AI Docs](https://ai.google.dev/docs)
