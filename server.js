require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const multer = require('multer');
const path = require('path');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Secret key for JWT (store in .env in production)
const JWT_SECRET = 'your-secret-key';

// User registration route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User does not exist' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Middleware to protect routes
const protect = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Image upload setup using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const fs = require('fs');

// Store file upload date in the database
const imageUploadDate = Date.now();

// Upload route
app.post('/upload', upload.single('image'), async (req, res) => {
  const imageUrl = `/uploads/${req.file.filename}`;
  const message = new Message({
    sender: req.body.sender,
    text: req.body.text || '',
    image: imageUrl,
    imageUploadDate // Save the upload date of the image
  });

  await message.save();
  res.json({ imageUrl });
});

// Delete images older than 90 days
setInterval(async () => {
  const expirationDate = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
  const messages = await Message.find({ imageUploadDate: { $lt: expirationDate } });

  messages.forEach((message) => {
    if (message.image) {
      const imagePath = path.join(__dirname, 'uploads', path.basename(message.image));
      fs.unlink(imagePath, (err) => {
        if (err) console.error(`Failed to delete image ${message.image}:`, err);
        else console.log(`Deleted expired image: ${message.image}`);
      });
    }
  });
}, 24 * 60 * 60 * 1000); // Run this check once every 24 hours

// Get all messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('A user connected');

  
  socket.on('new-message', async (messageData) => {
    const message = new Message(messageData);
    await message.save();
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
