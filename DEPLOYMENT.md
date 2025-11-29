# Deployment Guide

## Environment Variables

### Required Variables
| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `CHAT_PASSWORD` | Password for authentication |
| `CLIENT_URL` | Frontend URL (for CORS, e.g., `https://your-app.vercel.app`) |

### Security Variables (Recommended for Production)
| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | auto-generated | **IMPORTANT**: Set a strong, unique secret key in production! |
| `JWT_EXPIRY` | `24h` | JWT token expiration time |
| `PASSWORD_SET_DATE` | none | Date when password was last set (YYYY-MM-DD format). Set this when you change the password. |
| `PASSWORD_EXPIRY_DAYS` | `90` | Days until password expires (default: 3 months) |

### Optional Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Set to `production` for deployment |

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
     JWT_SECRET=<your_strong_secret_key>
     PASSWORD_SET_DATE=2024-01-15
     CLIENT_URL=<your_railway_app_url>
     NODE_ENV=production
     ```

5. **Deploy**
   - Railway will automatically build and deploy your app
   - The build process runs `cd backend && npm install && cd ../frontend && npm install && npm run build && cd ../backend && npm start`
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
   - Build Command: `cd backend && npm install && cd ../frontend && npm install && npm run build`
   - Start Command: `cd backend && npm start`

4. **Add Environment Variables**
   - Go to Environment tab
   - Add:
     ```
     MONGO_URI=<your_mongodb_connection_string>
     CHAT_PASSWORD=<your_secure_password>
     JWT_SECRET=<your_strong_secret_key>
     PASSWORD_SET_DATE=2024-01-15
     CLIENT_URL=<your_render_app_url>
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
   heroku config:set JWT_SECRET=your_strong_secret_key
   heroku config:set PASSWORD_SET_DATE=2024-01-15
   heroku config:set CLIENT_URL=https://your-app.herokuapp.com
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
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`

4. **Add Environment Variables**
   - Add the following:
     ```
     MONGO_URI=<your_mongodb_connection_string>
     CHAT_PASSWORD=<your_secure_password>
     JWT_SECRET=<your_strong_secret_key>
     PASSWORD_SET_DATE=2024-01-15
     CLIENT_URL=<your_vercel_app_url>
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
   - You'll receive a JWT token that expires based on `JWT_EXPIRY`

2. **Monitor Storage**
   - MongoDB Atlas provides monitoring tools
   - Keep an eye on your 512MB limit
   - Messages and images are CBOR-encoded for efficiency

3. **Security**
   - Keep your `CHAT_PASSWORD` secure
   - Update `PASSWORD_SET_DATE` when you change the password
   - Password expires after 90 days by default (configurable via `PASSWORD_EXPIRY_DAYS`)
   - Never commit `.env` file to version control
   - Use a strong, unique `JWT_SECRET` in production

4. **Password Rotation**
   - The system warns you 14 days before password expiration
   - To change your password:
     1. Update `CHAT_PASSWORD` in your environment variables
     2. Update `PASSWORD_SET_DATE` to today's date (YYYY-MM-DD format)
     3. Redeploy your application

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
- Verify `VITE_API_URL` is pointing to correct backend
- Check CORS settings - `CLIENT_URL` must match your frontend domain

### Authentication issues
- Ensure `JWT_SECRET` is set and consistent across deployments
- Check token expiration settings
- Verify password hasn't expired (check `PASSWORD_SET_DATE`)

### "Token expired" errors
- Clear browser local storage
- Re-login with your password
- Consider increasing `JWT_EXPIRY` if tokens expire too quickly

## Performance Tips

1. **CBOR Encoding** reduces storage by ~30-40% compared to JSON
2. **Image Limit**: Keep images under 50MB for best performance
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
