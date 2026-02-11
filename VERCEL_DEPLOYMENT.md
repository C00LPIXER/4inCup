# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your project should be pushed to GitHub

## Deployment Steps

### Method 1: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository (`C00LPIXER/4inCup`)
4. Configure the project:
   - **Framework Preset**: Select "Vite"
   - **Root Directory**: Leave as `./` (root)
   - **Build Command**: `npm run build` (already configured in vercel.json)
   - **Output Directory**: `dist` (already configured in vercel.json)

### Method 2: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from project directory:
   ```bash
   vercel
   ```

4. Follow the prompts to configure the project

## Environment Variables

Set these environment variables in Vercel dashboard (Project Settings → Environment Variables):

```
VITE_API_TOKEN=your_api_token_here
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_DATASET=production
```

## Post-Deployment

1. **Custom Domain** (optional): Add your custom domain in Vercel dashboard
2. **Environment Variables**: Make sure all Firebase config is set correctly
3. **Firestore Rules**: Ensure Firestore rules are published in Firebase Console

## Testing Deployment

After deployment, test these routes to ensure no 404 errors:
- `/` - Home page
- `/groups` - Teams page
- `/fixtures` - Fixtures page
- `/standings` - Standings page
- `/settings` - Settings page (requires authentication)

## Troubleshooting

### 404 on Route Refresh
- The `vercel.json` file handles this automatically
- If still getting 404s, check that `vercel.json` is in the root directory

### Firebase Connection Issues
- Verify all environment variables are set correctly in Vercel
- Check Firebase Console for any security rule violations

### Build Failures
- Ensure all dependencies are listed in `package.json`
- Check build logs in Vercel dashboard for specific errors

## Production URL

After successful deployment, Vercel will provide a production URL like:
`https://4in-cup.vercel.app`

You can also set up a custom domain if desired.