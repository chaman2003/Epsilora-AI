# 🚀 Quick Reference: Changing Gemini Model in Vercel

## TL;DR - Change Model in 3 Steps:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Edit `GEMINI_MODEL`** variable
3. **Redeploy** your project

---

## Available Models (Copy & Paste)

```
gemini-2.0-flash-exp        ← Recommended (Latest, Fastest)
gemini-1.5-flash            ← Balanced Performance
gemini-1.5-flash-8b         ← Lightweight
gemini-1.5-pro              ← Most Capable
gemini-pro                  ← Legacy
```

---

## When to Use Each Model:

| Model | Use When... | Speed | Quality |
|-------|-------------|-------|---------|
| `gemini-2.0-flash-exp` | **General use** (Recommended) | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| `gemini-1.5-flash` | Need proven stability | ⚡⚡ | ⭐⭐⭐⭐ |
| `gemini-1.5-flash-8b` | Maximum speed, simple tasks | ⚡⚡⚡ | ⭐⭐⭐ |
| `gemini-1.5-pro` | Complex reasoning needed | ⚡ | ⭐⭐⭐⭐⭐ |
| `gemini-pro` | Legacy compatibility | ⚡ | ⭐⭐⭐ |

---

## Vercel CLI Commands

```bash
# Add the model variable for the first time
vercel env add GEMINI_MODEL

# Update existing variable
vercel env rm GEMINI_MODEL production
vercel env add GEMINI_MODEL production
# Enter: gemini-2.0-flash-exp

# Trigger redeploy
vercel --prod
```

---

## Testing After Change

1. Check deployment logs for:
   ```
   Generating questions using model: gemini-2.0-flash-exp
   ```

2. Test in your app:
   - Generate a quiz
   - Use AI chat
   - Check response quality

---

## Troubleshooting

**Model not changing?**
- Make sure you **redeployed** after editing the variable
- Clear browser cache
- Check Vercel deployment logs

**"Model not found" error?**
- Double-check spelling (case-sensitive!)
- Try fallback: `gemini-1.5-flash`
- Ensure API key has proper permissions

**Want faster responses?**
- Use `gemini-2.0-flash-exp` or `gemini-1.5-flash-8b`

**Need better quality?**
- Use `gemini-1.5-pro` (slower but more capable)

---

## Current Configuration

Your app is currently configured to use:
- **Default Model**: `gemini-2.0-flash-exp`
- **Used in**: Quiz generation, AI chat, AI assistance
- **Configurable via**: `GEMINI_MODEL` environment variable

---

For detailed setup instructions, see: [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md)
