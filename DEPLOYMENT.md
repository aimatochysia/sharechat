# Deployment Guide

## Deploy to Railway

1. **Create a Railway Account**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `sharechat` repository

3. **Add MongoDB**
   - Click "New" → "Database" → "MongoDB"
   - Railway will provision a MongoDB instance
   - Copy the connection string from the MongoDB service

4. **Configure Environment Variables**
   - Go to your project settings
   - Add the following variables:
     ```
     MONGO_URI=<your_railway_mongodb_connection_string>
     CHAT_PASSWORD=<your_secure_password>
     NODE_ENV=production
     ```

5. **Deploy**
   - Railway will automatically build and deploy your app
   - The build process runs `npm install && npm run build && npm start`
   - Your app will be available at the generated Railway URL

## Deploy to Render

1. **Create a Render Account**
   - Visit https://render.com
   - Sign up with GitHub

2. **Create a Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   - Name: sharechat
   - Environment: Node
   - Build Command: `npm install && cd client && npm install && npm run build && cd ..`
   - Start Command: `npm start`

4. **Add Environment Variables**
   - Go to Environment tab
   - Add:
     ```
     MONGO_URI=<your_mongodb_connection_string>
     CHAT_PASSWORD=<your_secure_password>
     NODE_ENV=production
     ```

5. **Create MongoDB Database**
   - Use MongoDB Atlas (free tier available)
   - Create a cluster at https://www.mongodb.com/cloud/atlas
   - Get connection string and add to MONGO_URI

## Deploy to Heroku

1. **Create a Heroku Account**
   - Visit https://heroku.com
   - Sign up for free

2. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

3. **Login to Heroku**
   ```bash
   heroku login
   ```

4. **Create Heroku App**
   ```bash
   heroku create sharechat-app
   ```

5. **Add MongoDB Add-on**
   ```bash
   heroku addons:create mongodb:sandbox
   ```

6. **Set Environment Variables**
   ```bash
   heroku config:set CHAT_PASSWORD=your_secure_password
   heroku config:set NODE_ENV=production
   ```

7. **Deploy**
   ```bash
   git push heroku main
   ```

## Deploy to Vercel

1. **Create Vercel Account**
   - Visit https://vercel.com
   - Sign up with GitHub

2. **Import Repository**
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Build Settings**
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `client/dist`

4. **Add Environment Variables**
   - Add the following:
     ```
     MONGO_URI=<your_mongodb_connection_string>
     CHAT_PASSWORD=<your_secure_password>
     NODE_ENV=production
     ```

5. **Deploy**
   - Vercel will automatically deploy your app

## MongoDB Atlas Setup (Free Tier)

1. **Create Account**
   - Visit https://www.mongodb.com/cloud/atlas
   - Sign up for free

2. **Create a Cluster**
   - Choose the M0 Free tier (512 MB storage)
   - Select a region close to your users

3. **Create Database User**
   - Go to Database Access
   - Add a new database user with username and password
   - Save credentials securely

4. **Configure Network Access**
   - Go to Network Access
   - Add IP Address: `0.0.0.0/0` (allow from anywhere)
   - Note: In production, restrict to your deployment platform's IPs

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `sharechat`

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sharechat?retryWrites=true&w=majority
```

## Post-Deployment

1. **Access Your Chat**
   - Navigate to your deployed URL
   - Login with the password you set in `CHAT_PASSWORD`

2. **Monitor Storage**
   - MongoDB Atlas provides monitoring tools
   - Keep an eye on your 512MB limit
   - Messages and images are CBOR-encoded for efficiency

3. **Security**
   - Keep your `CHAT_PASSWORD` secure
   - Change it periodically
   - Never commit `.env` file to version control

## Troubleshooting

### Cannot connect to MongoDB
- Check that `MONGO_URI` is correct
- Verify network access allows your platform's IP
- Ensure database user credentials are correct

### Build failures
- Check all environment variables are set
- Verify Node.js version (requires v16+)
- Check build logs for specific errors

### Chat not loading
- Check browser console for errors
- Verify API_URL is pointing to correct backend
- Check CORS settings allow your frontend domain

## Performance Tips

1. **CBOR Encoding** reduces storage by ~30-40% compared to JSON
2. **Image Limit**: Keep images under 5MB for best performance
3. **Message Pagination**: The default limit is 100 messages per load
4. **Search Optimization**: Use indexed text search for better performance

## Backup and Recovery

1. **MongoDB Atlas Backups**
   - M0 tier doesn't include continuous backups
   - Consider upgrading to M2+ for automated backups
   - Or manually export data periodically

2. **Export Data**
   ```bash
   mongodump --uri="your_connection_string"
   ```

3. **Import Data**
   ```bash
   mongorestore --uri="your_connection_string" dump/
   ```
