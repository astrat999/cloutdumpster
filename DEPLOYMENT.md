# 🚀 CloutDumpster CI/CD Setup Guide

## Required GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets for automated deployment:

### Netlify Configuration

| Secret Name          | Value                      | Where to find it                                                |
| -------------------- | -------------------------- | --------------------------------------------------------------- |
| `NETLIFY_AUTH_TOKEN` | Your personal access token | Netlify → User Settings → Applications → Personal Access Tokens |
| `NETLIFY_SITE_ID`    | Your site API ID           | Netlify → Site Settings → Site Details → API ID                 |

### Firebase Configuration (Public keys - safe for client-side)

| Secret Name                           | Value                        | Where to find it                                     |
| ------------------------------------- | ---------------------------- | ---------------------------------------------------- |
| `PUBLIC_FIREBASE_API_KEY`             | Your Firebase API key        | Firebase Console → Project Settings → Web App Config |
| `PUBLIC_FIREBASE_AUTH_DOMAIN`         | your-project.firebaseapp.com | Firebase Console → Project Settings → Web App Config |
| `PUBLIC_FIREBASE_PROJECT_ID`          | your-project-id              | Firebase Console → Project Settings → General        |
| `PUBLIC_FIREBASE_STORAGE_BUCKET`      | your-project.appspot.com     | Firebase Console → Project Settings → Web App Config |
| `PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID               | Firebase Console → Project Settings → Web App Config |
| `PUBLIC_FIREBASE_APP_ID`              | Your app ID                  | Firebase Console → Project Settings → Web App Config |

### Stripe Configuration

| Secret Name        | Value                      | Where to find it                         |
| ------------------ | -------------------------- | ---------------------------------------- |
| `PUBLIC_STRIPE_PK` | pk*test*... or pk*live*... | Stripe Dashboard → Developers → API Keys |

## How to set up:

1. **Get Netlify Personal Access Token:**
   - Go to https://app.netlify.com/user/applications#personal-access-tokens
   - Click "New access token"
   - Give it a name like "GitHub Actions CloutDumpster"
   - Copy the token

2. **Get Netlify Site ID:**
   - Go to your site dashboard on Netlify
   - Site Settings → Site Details
   - Copy the "API ID" (looks like: 12345678-1234-1234-1234-123456789012)

3. **Add all secrets to GitHub:**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Click "New repository secret" for each one above
   - Paste the values

## What happens after setup:

✅ **Every push to `main`** → Automatic production deploy
✅ **Every PR** → Preview deploy with unique URL
✅ **Manual trigger** → Deploy from GitHub Actions tab
✅ **Build caching** → Faster builds with npm cache
✅ **PR comments** → Preview URLs posted automatically

## Testing the setup:

1. Push this workflow file to your repo
2. Go to GitHub → Actions tab
3. You should see "Deploy CloutDumpster to Netlify" running
4. Check the logs for any missing secrets

🔥 **Ready to ship dopamine at scale!** 🔥
