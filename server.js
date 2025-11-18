require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const cbor = require('cbor');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Get password from environment variable
const CHAT_PASSWORD = process.env.CHAT_PASSWORD;

if (!CHAT_PASSWORD) {
  console.error('ERROR: CHAT_PASSWORD environment variable not set!');
  process.exit(1);
}

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI environment variable not set!');
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Authentication endpoint
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === CHAT_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// Get all messages with pagination and search
app.get('/api/messages', async (req, res) => {
  try {
    const { search, date, limit = 100, skip = 0 } = req.query;
    let query = {};

    // Search in text content
    if (search) {
      query.text = { $regex: search, $options: 'i' };
    }

    // Filter by date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.timestamp = { $gte: startOfDay, $lte: endOfDay };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Decode CBOR data for transmission
    const decodedMessages = messages.map(msg => {
      const messageObj = {
        _id: msg._id,
        text: msg.text,
        timestamp: msg.timestamp
      };

      if (msg.imageData) {
        try {
          // Decode CBOR and convert to base64
          const decodedData = cbor.decode(msg.imageData);
          messageObj.imageData = decodedData.toString('base64');
          messageObj.imageMimeType = msg.imageMimeType;
        } catch (err) {
          console.error('Error decoding CBOR image:', err);
        }
      }

      return messageObj;
    });

    res.json(decodedMessages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Upload multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Send a new message (with optional image)
app.post('/api/messages', upload.single('image'), async (req, res) => {
  try {
    const { text } = req.body;
    const messageData = { text };

    // If image is provided, encode it with CBOR
    if (req.file) {
      // Encode the buffer using CBOR for storage efficiency
      const encodedImage = cbor.encode(req.file.buffer);
      messageData.imageData = encodedImage;
      messageData.imageMimeType = req.file.mimetype;
    }

    const message = new Message(messageData);
    await message.save();

    // Prepare response with decoded image
    const response = {
      _id: message._id,
      text: message.text,
      timestamp: message.timestamp
    };

    if (message.imageData) {
      const decodedData = cbor.decode(message.imageData);
      response.imageData = decodedData.toString('base64');
      response.imageMimeType = message.imageMimeType;
    }

    // Emit to all connected clients
    io.emit('message', response);

    res.status(201).json(response);
  } catch (err) {
    console.error('Error creating message:', err);
    res.status(500).json({ message: 'Failed to create message' });
  }
});

// Delete a message
app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByIdAndDelete(id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Emit deletion to all connected clients
    io.emit('message-deleted', id);

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// Get date range of messages (for date picker)
app.get('/api/messages/dates', async (req, res) => {
  try {
    const oldestMessage = await Message.findOne().sort({ timestamp: 1 });
    const newestMessage = await Message.findOne().sort({ timestamp: -1 });

    res.json({
      oldest: oldestMessage?.timestamp || new Date(),
      newest: newestMessage?.timestamp || new Date()
    });
  } catch (err) {
    console.error('Error fetching date range:', err);
    res.status(500).json({ message: 'Failed to fetch date range' });
  }
});

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
