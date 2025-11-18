# ShareChat

A production-ready, professional webchat application built with React.js and Node.js, featuring WhatsApp-like UI and optimized for efficient storage using CBOR encoding.

## Features

- 🔒 **Password Authentication** - Single password access stored in environment variables
- 💬 **Real-time Messaging** - Instant message delivery via Socket.io
- 📸 **Image Sharing** - Upload and share images (stored efficiently in MongoDB)
- 🗑️ **Message Deletion** - Delete individual messages and images
- 🔍 **Substring Search** - Search through chat history
- 📅 **Date Navigation** - Jump to specific dates in chat history
- ⏰ **Smart Timestamps** - Shows "Today", "Yesterday", "2 days ago", or actual dates
- 📱 **Responsive Design** - Works across all devices
- 💾 **CBOR Encoding** - Maximizes 512MB storage efficiency
- 🎨 **WhatsApp-like UI** - Professional and familiar interface

## Tech Stack

### Backend
- Node.js + Express
- Socket.io for real-time communication
- MongoDB with Mongoose
- CBOR encoding for efficient storage
- Multer for file handling

### Frontend
- React.js with Vite
- Material-UI (MUI) components
- Socket.io-client
- Axios for API calls
- date-fns for date formatting

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database (Atlas or local)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/aimatochysia/sharechat.git
cd sharechat
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Create `.env` file in the root directory:
```bash
cp .env.example .env
```

5. Update the `.env` file with your configuration:
```env
MONGO_URI=your_mongodb_connection_string
CHAT_PASSWORD=your_secure_password
CLIENT_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
```

6. Create `.env` file in the client directory:
```bash
cd client
cp .env.example .env
```

Update `client/.env`:
```env
VITE_API_URL=http://localhost:3000
```

## Development

Run the backend server:
```bash
npm run dev
```

In a separate terminal, run the frontend:
```bash
npm run client
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Production Deployment

### Build the frontend:
```bash
npm run build
```

This creates an optimized production build in `client/dist`.

### Deploy to a platform (e.g., Railway, Render, Heroku):

1. Set environment variables on your platform:
   - `MONGO_URI` - Your MongoDB connection string
   - `CHAT_PASSWORD` - Your secure password
   - `NODE_ENV=production`
   - `PORT` - (optional, platform may set this)

2. The server will automatically serve the built React app in production mode.

3. Start command: `npm start`

## Environment Variables

### Backend (.env)
- `MONGO_URI` - MongoDB connection string (required)
- `CHAT_PASSWORD` - Password for accessing the chat (required)
- `CLIENT_URL` - Frontend URL for CORS (development only)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

### Frontend (client/.env)
- `VITE_API_URL` - Backend API URL

## Storage Optimization

Images and messages are encoded using CBOR (Concise Binary Object Representation) format, which provides:
- Efficient binary encoding
- Smaller storage footprint compared to JSON
- Faster serialization/deserialization
- Maximum utilization of 512MB MongoDB storage limit

## API Endpoints

- `POST /api/auth` - Authenticate with password
- `GET /api/messages` - Get messages (supports search and date filters)
- `POST /api/messages` - Send a new message (with optional image)
- `DELETE /api/messages/:id` - Delete a message
- `GET /api/messages/dates` - Get date range of messages

## License

ISC

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

