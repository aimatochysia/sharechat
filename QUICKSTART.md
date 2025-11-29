# Quick Start Guide

Get ShareChat running in 10 minutes!

## Prerequisites

- Node.js v16 or higher
- MongoDB database (Atlas free tier or local)
- A code editor (VS Code, etc.)

## Installation Steps

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/aimatochysia/sharechat.git
cd sharechat

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Configure Environment

```bash
# Copy example environment file
cd backend
cp .env.example .env
```

Edit `backend/.env` and set your values:

```env
MONGO_URI=your_mongodb_connection_string
CHAT_PASSWORD=your_secure_password
CLIENT_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
```

Configure frontend:

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Get MongoDB Connection String

**Option A: MongoDB Atlas (Recommended)**

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free M0 cluster (512MB)
3. Create database user
4. Add IP address `0.0.0.0/0` (allow all)
5. Get connection string
6. Replace `<password>` and `<dbname>` with your values

**Option B: Local MongoDB**

```bash
# Install MongoDB locally
# macOS: brew install mongodb-community
# Linux: sudo apt-get install mongodb
# Windows: Download from mongodb.com

# Use connection string:
MONGO_URI=mongodb://localhost:27017/sharechat
```

### 4. Run Development Server

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access Your Chat

Open browser and go to: http://localhost:5173

Login with the password you set in `.env`

## Quick Test

### Test the API
```bash
cd backend
node test-api.js
```

### Send Your First Message
1. Type "Hello ShareChat!" in the input box
2. Press Enter or click Send (➤)
3. Your message appears instantly!

### Upload an Image
1. Click the attachment icon (📎)
2. Select an image from your device
3. Add optional text
4. Click Send
5. Image appears in chat!

### Search Messages
1. Click search icon (🔍) in top bar
2. Type "Hello"
3. Click Search
4. Only matching messages show

### Delete a Message
1. Hover over any message
2. Click the red delete button (🗑️) that appears
3. Message is removed instantly

## Production Deployment

### Option 1: Railway (Easiest)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Add MongoDB
railway add mongodb

# Deploy
railway up
```

Set environment variables in Railway dashboard:
- `MONGO_URI` - From Railway MongoDB
- `CHAT_PASSWORD` - Your secure password
- `NODE_ENV=production`

### Option 2: Render

1. Go to https://render.com
2. Connect GitHub repository
3. Create Web Service
4. Set build command: `cd backend && npm install && cd ../frontend && npm install && npm run build`
5. Set start command: `cd backend && npm start`
6. Add environment variables

### Option 3: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create sharechat

# Add MongoDB
heroku addons:create mongodb:sandbox

# Set password
heroku config:set CHAT_PASSWORD=your_password
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### MongoDB Connection Error

- Check `MONGO_URI` is correct
- Verify MongoDB is running (local) or accessible (Atlas)
- Check firewall/network access
- Verify credentials

### Build Errors

```bash
# Clear and reinstall backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Clear and reinstall frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Can't Login

- Verify `CHAT_PASSWORD` is set in `.env`
- Check browser console for errors
- Try incognito/private mode
- Clear browser cache

## Next Steps

- ✅ Read the [User Guide](USER_GUIDE.md) for all features
- ✅ Check [Deployment Guide](DEPLOYMENT.md) for production
- ✅ Review [Security Summary](SECURITY.md) for best practices
- ✅ Explore [Technical Docs](TECHNICAL.md) for architecture

## Common Commands

```bash
# Development
cd backend && npm run dev   # Start backend server
cd frontend && npm run dev  # Start frontend dev server

# Production
cd frontend && npm run build  # Build frontend for production
cd backend && npm start       # Start production server

# Testing
cd backend && node test-api.js  # Test API endpoints

# Database
mongodump --uri="..."   # Backup database
mongorestore --uri="..." # Restore database
```

## File Structure

```
sharechat/
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.jsx     # Main app
│   │   └── main.jsx    # Entry point
│   └── public/         # Static assets
├── backend/            # Node.js backend
│   ├── models/         # MongoDB models
│   │   └── Message.js  # Message schema
│   ├── server.js       # Express server
│   ├── package.json    # Backend deps
│   └── .env           # Environment config
├── README.md          # Main documentation
└── docs/              # Additional documentation
```

## Getting Help

- 📖 Read documentation in `/docs`
- 🐛 Report issues on GitHub
- 💬 Check existing issues for solutions

## What You Get

✅ Professional WhatsApp-like UI  
✅ Real-time messaging  
✅ Image sharing  
✅ Search & date navigation  
✅ Message deletion  
✅ CBOR storage optimization  
✅ Secure authentication  
✅ Mobile responsive  
✅ Production ready  

**Enjoy your personal web chat! 🎉**

---

**Total setup time: ~10 minutes**  
**Ready for production: Yes**  
**Free tier compatible: Yes (MongoDB Atlas M0)**
