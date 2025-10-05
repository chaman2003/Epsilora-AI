# Vercel Environment Variables Setup

This guide explains how to configure environment variables in Vercel for your Epsilora AI backend.

## Required Environment Variables

### 1. Database Configuration
- **MONGODB_URI**: Your MongoDB connection string
  ```
  mongodb+srv://username:password@cluster.mongodb.net/dbname
  ```

### 2. Gemini API Configuration
- **VITE_GEMINI_API_KEY**: Your Google Gemini API key
  ```
  AIzaSy...
  ```
- **GEMINI_API_KEY**: Same as above (fallback)
  ```
  AIzaSy...
  ```

### 3. Gemini Model Configuration (NEW!)
- **GEMINI_MODEL**: The Gemini model to use
  
  **Available Options:**
  - `gemini-2.0-flash-exp` (Default - Latest, fastest)
  - `gemini-1.5-flash` (Fast, good balance)
  - `gemini-1.5-flash-8b` (Lightweight version)
  - `gemini-1.5-pro` (More capable, slower)
  - `gemini-pro` (Legacy model)

  **Default Value:** `gemini-2.0-flash-exp`

### 4. Security
- **JWT_SECRET**: Secret key for JWT token generation
  ```
  your-secure-random-string-here
  ```

### 5. Server Configuration
- **PORT**: Server port (usually 3001)
- **NODE_ENV**: Set to `production`

---

## How to Add Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (Epsilora-AI)
3. Click on **Settings** tab
4. Navigate to **Environment Variables** section
5. Add each variable:
   - **Key**: Variable name (e.g., `GEMINI_MODEL`)
   - **Value**: Variable value (e.g., `gemini-2.0-flash-exp`)
   - **Environments**: Select `Production`, `Preview`, and `Development`
6. Click **Save**

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Set environment variables
vercel env add GEMINI_MODEL
# Then enter the value when prompted: gemini-2.0-flash-exp

# Or add all at once
vercel env add MONGODB_URI production
vercel env add VITE_GEMINI_API_KEY production
vercel env add GEMINI_MODEL production
vercel env add JWT_SECRET production
```

---

## Changing the Gemini Model

To switch between different Gemini models without code changes:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find the `GEMINI_MODEL` variable
3. Click **Edit**
4. Change the value to your preferred model:
   - For fastest responses: `gemini-2.0-flash-exp`
   - For balance: `gemini-1.5-flash`
   - For complex tasks: `gemini-1.5-pro`
5. Click **Save**
6. **Redeploy** your project for changes to take effect

### Trigger Redeploy:
- **Option A**: Push a new commit to your repository
- **Option B**: In Vercel Dashboard → Deployments → Click "..." on latest deployment → Redeploy

---

## Testing Your Configuration

After deploying, you can verify the model is working by:

1. Check the deployment logs in Vercel
2. Look for log messages like:
   ```
   Generating 10 questions at medium difficulty using model: gemini-2.0-flash-exp
   ```
3. Test the AI features in your application:
   - Generate a quiz
   - Use the AI chat feature
   - Check AI assistance

---

## Model Comparison

| Model | Speed | Capability | Use Case | Cost |
|-------|-------|------------|----------|------|
| `gemini-2.0-flash-exp` | ⚡⚡⚡ Fastest | High | General use, production | Lowest |
| `gemini-1.5-flash` | ⚡⚡ Fast | High | Balanced performance | Low |
| `gemini-1.5-flash-8b` | ⚡⚡⚡ Very Fast | Medium | Simple tasks | Lowest |
| `gemini-1.5-pro` | ⚡ Slower | Highest | Complex reasoning | Higher |
| `gemini-pro` | ⚡ Slower | Medium | Legacy support | Medium |

**Recommendation:** Use `gemini-2.0-flash-exp` for the best balance of speed, capability, and cost.

---

## Troubleshooting

### Model Not Found Error
- Ensure the model name is spelled correctly
- Check if the model is available in your region
- Try using `gemini-1.5-flash` as a fallback

### API Key Issues
- Verify both `VITE_GEMINI_API_KEY` and `GEMINI_API_KEY` are set
- Ensure the API key has Generative AI API enabled in Google Cloud Console

### Changes Not Taking Effect
- Remember to **redeploy** after changing environment variables
- Check deployment logs for any errors
- Clear browser cache if frontend isn't updating

---

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set correctly
3. Test the API endpoints directly
4. Review the backend server logs

For more information, see the [Vercel Environment Variables documentation](https://vercel.com/docs/concepts/projects/environment-variables).
