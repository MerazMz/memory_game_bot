# Vercel Deployment Instructions

This document provides instructions for deploying the Memory Game Bot project to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Gemini API key

## Deployment Steps

1. **Install Vercel CLI (optional)**
   ```
   npm install -g vercel
   ```

2. **Login to Vercel (if using CLI)**
   ```
   vercel login
   ```

3. **Deploy to Vercel**
   
   **Option 1: Using Vercel Dashboard**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: Other
     - Build Command: None
     - Output Directory: None
   - Add Environment Variables:
     - GEMINI_API_KEY: Your Gemini API key
     - SECRET_KEY: A secure random string for Flask sessions
   - Deploy

   **Option 2: Using Vercel CLI**
   ```
   vercel
   ```
   - Follow the prompts to configure your project
   - When asked about environment variables, add:
     - GEMINI_API_KEY: Your Gemini API key
     - SECRET_KEY: A secure random string for Flask sessions

4. **Verify Deployment**
   - Once deployed, Vercel will provide a URL for your application
   - Visit the URL to ensure the application is working correctly

## Troubleshooting

If you encounter issues with the deployment:

1. Check Vercel logs for any error messages
2. Ensure all environment variables are correctly set
3. Verify that the Gemini API key is valid and has the necessary permissions
4. Check that the application is properly configured for Vercel in the vercel.json file

## Updating the Deployment

To update your deployment after making changes:

1. Push changes to your GitHub repository (if using GitHub integration)
2. Or run `vercel` again from your project directory (if using CLI)

Vercel will automatically build and deploy the updated application.
