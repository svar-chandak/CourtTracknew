# 🚀 CourtTrack Deployment Guide

## Quick Setup for Netlify + Supabase

### 1. Complete Supabase Database Setup

You've already created the `coaches` table! Now complete the database setup:

1. **Go to your Supabase SQL Editor**
2. **Clear the current content** and copy the **entire** content from `supabase-schema.sql`
3. **Paste and Run** - this will create all remaining tables, indexes, and security policies
4. **Verify** - you should see all tables in the Table Editor

### 2. Get Your Supabase Credentials

1. Go to **Settings > API** in your Supabase dashboard
2. Copy these values:
   - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - `service_role` key (SUPABASE_SERVICE_ROLE_KEY)

### 3. Deploy to Netlify

1. **Push your code to GitHub** (if not already done)
2. **Go to [netlify.com](https://netlify.com)** and sign up/login
3. **Click "New site from Git"**
4. **Connect your GitHub repository**
5. **Configure build settings** (should auto-detect):
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18`
6. **Set Environment Variables** in Site settings > Environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
7. **Click "Deploy site"**

### 4. Test Your Deployment

1. **Wait for build to complete** (usually 2-3 minutes)
2. **Visit your Netlify URL**
3. **Test the registration flow**:
   - Register a new coach account
   - Verify email (check Supabase Auth users)
   - Login and explore the dashboard

### 5. Optional: Custom Domain

1. Go to **Domain settings** in Netlify
2. **Add custom domain** if desired
3. **Update environment variables** with new domain:
   ```
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

## 🎯 What's Ready to Use

✅ **Authentication System** - Register/Login with email verification  
✅ **Dashboard** - Overview with team stats and quick actions  
✅ **Team Management** - Add/edit players with full profiles  
✅ **Tournament System** - Create and join tournaments with team codes  
✅ **Match Management** - Schedule and track matches  
✅ **Lineup Builder** - Drag-and-drop interface for match lineups  
✅ **Settings** - Profile and team management  

## 🔧 Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Ensure Node version is 18
- Check Netlify build logs for specific errors

### Database Issues
- Verify all tables were created in Supabase
- Check RLS policies are enabled
- Test database connection in Supabase dashboard

### Authentication Issues
- Verify email templates in Supabase Auth settings
- Check redirect URLs in Auth settings
- Test with a real email address

## 📱 Next Steps After Deployment

1. **Test all features** with real data
2. **Share team codes** with other coaches
3. **Create your first tournament**
4. **Add players to your roster**
5. **Schedule matches**

Your tennis coach management app is now live! 🎾
