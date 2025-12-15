require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const cbor = require('cbor');
const rateLimit = require('express-rate-limit');
const pako = require('pako');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// Security: Parse allowed origins for CORS
const getAllowedOrigins = () => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  // Support multiple origins separated by comma
  return clientUrl.split(',').map(url => url.trim());
};

const io = socketIo(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Get password from environment variable
const CHAT_PASSWORD = process.env.CHAT_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// Validate JWT_SECRET in production
if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable must be set in production!');
  process.exit(1);
}

// Use a default secret only in development (with warning)
const jwtSecretKey = JWT_SECRET || (() => {
  console.warn('WARNING: Using default JWT_SECRET. Set JWT_SECRET in production!');
  return 'dev-only-default-secret-change-in-production';
})();

// Password expiration settings (default: 90 days / 3 months)
const PASSWORD_EXPIRY_DAYS = parseInt(process.env.PASSWORD_EXPIRY_DAYS, 10) || 90;
const PASSWORD_SET_DATE = process.env.PASSWORD_SET_DATE ? new Date(process.env.PASSWORD_SET_DATE) : null;

if (!CHAT_PASSWORD) {
  console.error('ERROR: CHAT_PASSWORD environment variable not set!');
  process.exit(1);
}

// Check if password has expired
const isPasswordExpired = () => {
  if (!PASSWORD_SET_DATE) {
    // If no date set, password is not expired (for backward compatibility)
    // Log a warning to encourage setting the date
    console.warn('WARNING: PASSWORD_SET_DATE not set. Password expiration check disabled.');
    return false;
  }
  const expiryDate = new Date(PASSWORD_SET_DATE);
  expiryDate.setDate(expiryDate.getDate() + PASSWORD_EXPIRY_DAYS);
  return new Date() > expiryDate;
};

// Validate password input
const validatePasswordInput = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length > 1000) {
    return { valid: false, error: 'Password is too long' };
  }
  return { valid: true };
};

// Compare password securely (supports both plain and hashed passwords)
const comparePassword = async (inputPassword, storedPassword) => {
  // Check if stored password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
    // Use bcrypt comparison for hashed passwords
    return await bcrypt.compare(inputPassword, storedPassword);
  } else {
    // Fallback to plain text comparison (for backward compatibility)
    // Log a warning to encourage using hashed passwords
    console.warn('WARNING: Using plain text password comparison. Consider using a bcrypt hash for CHAT_PASSWORD.');
    return inputPassword === storedPassword;
  }
};

// Sanitize text input to prevent XSS and injection attacks
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  // Remove null bytes and control characters (except newlines and tabs)
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
};

// Validate text message input
const validateTextInput = (text) => {
  if (!text) {
    return { valid: true }; // Empty text is valid (for image-only messages)
  }
  if (typeof text !== 'string') {
    return { valid: false, error: 'Text must be a string' };
  }
  if (text.length > 100000) { // 100KB text limit
    return { valid: false, error: 'Text message is too long' };
  }
  return { valid: true };
};

// Security logging helper
const logSecurityEvent = (event, details) => {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event}:`, JSON.stringify(details));
};

// Generate JWT token
const generateToken = () => {
  return jwt.sign(
    { authenticated: true, iat: Math.floor(Date.now() / 1000) },
    jwtSecretKey,
    { expiresIn: JWT_EXPIRY }
  );
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    jwt.verify(token, jwtSecretKey);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token.' });
  }
};

// Socket.io authentication middleware
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;
  
  if (!token) {
    return next(new Error('Authentication required'));
  }
  
  try {
    jwt.verify(token, jwtSecretKey);
    next();
  } catch (err) {
    return next(new Error('Invalid or expired token'));
  }
};

io.use(authenticateSocket);

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

// Security middleware - configure CSP appropriately for each environment
const getHelmetConfig = () => {
  const config = {
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny' // Prevent clickjacking
    },
    noSniff: true, // Prevent MIME type sniffing
    xssFilter: true, // Enable XSS filter
  };
  
  // In development, allow inline scripts and styles for hot reloading
  if (process.env.NODE_ENV !== 'production') {
    config.contentSecurityPolicy = {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      }
    };
  } else {
    // In production, be more restrictive
    config.contentSecurityPolicy = {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // MUI requires inline styles
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "wss:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      }
    };
  }
  
  return config;
};

app.use(helmet(getHelmetConfig()));

// Middleware
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Trust proxy for accurate IP detection behind reverse proxies
app.set('trust proxy', 1);

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip, // Use IP for rate limiting
});

// Stricter rate limiting for authentication (anti-brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth attempts per windowMs
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skipSuccessfulRequests: false, // Count all requests including successful ones
});

// Even stricter limiter for repeated failed attempts (progressive lockout)
const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Maximum 10 attempts per hour
  message: { success: false, message: 'Too many failed authentication attempts. Account locked for 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 uploads per windowMs
  message: { success: false, message: 'Too many uploads, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Authentication endpoint with JWT token generation
app.post('/api/auth', authLimiter, strictAuthLimiter, async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  
  try {
    const { password } = req.body;
    
    // Validate password input
    const validation = validatePasswordInput(password);
    if (!validation.valid) {
      logSecurityEvent('AUTH_VALIDATION_FAILED', { ip: clientIp, reason: validation.error });
      return res.status(400).json({ 
        success: false, 
        message: validation.error 
      });
    }
    
    // Check password expiration first
    if (isPasswordExpired()) {
      logSecurityEvent('AUTH_PASSWORD_EXPIRED', { ip: clientIp });
      return res.status(403).json({ 
        success: false, 
        message: 'Password has expired. Please update CHAT_PASSWORD and PASSWORD_SET_DATE in your environment variables.',
        expired: true
      });
    }
    
    // Compare password securely (supports both plain and hashed)
    const isPasswordValid = await comparePassword(password, CHAT_PASSWORD);
    
    if (isPasswordValid) {
      const token = generateToken();
      
      // Calculate days until password expires (if date is set)
      let daysUntilExpiry = null;
      if (PASSWORD_SET_DATE) {
        const expiryDate = new Date(PASSWORD_SET_DATE);
        expiryDate.setDate(expiryDate.getDate() + PASSWORD_EXPIRY_DAYS);
        daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      }
      
      logSecurityEvent('AUTH_SUCCESS', { ip: clientIp });
      
      res.json({ 
        success: true, 
        token,
        expiresIn: JWT_EXPIRY,
        passwordExpiresInDays: daysUntilExpiry
      });
    } else {
      logSecurityEvent('AUTH_FAILED', { ip: clientIp, reason: 'Invalid password' });
      res.status(401).json({ success: false, message: 'Invalid password' });
    }
  } catch (err) {
    console.error('Authentication error:', err);
    logSecurityEvent('AUTH_ERROR', { ip: clientIp, error: err.message });
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed. Please try again.' 
    });
  }
});

// Token refresh endpoint
app.post('/api/auth/refresh', verifyToken, (req, res) => {
  const token = generateToken();
  res.json({ success: true, token, expiresIn: JWT_EXPIRY });
});

// Verify token endpoint (for frontend to check if token is still valid)
app.get('/api/auth/verify', verifyToken, (req, res) => {
  res.json({ success: true, valid: true });
});

// Get all messages with pagination and search (protected)
app.get('/api/messages', verifyToken, async (req, res) => {
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
        text: typeof msg.text === 'string' ? msg.text : decompressText(msg.text),
        timestamp: msg.timestamp,
        edited: msg.edited,
        editedAt: msg.editedAt
      };

      if (msg.imageData) {
        try {
          // Decode CBOR and decompress
          const decodedCompressed = cbor.decode(msg.imageData);
          const decompressed = pako.ungzip(decodedCompressed);
          messageObj.imageData = Buffer.from(decompressed).toString('base64');
          messageObj.imageMimeType = msg.imageMimeType;
        } catch (err) {
          console.error('Error decoding CBOR image:', err);
        }
      }

      if (msg.fileData) {
        messageObj.fileName = msg.fileName;
        messageObj.fileMimeType = msg.fileMimeType;
        messageObj.fileSize = msg.fileSize;
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
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for files
});

// Compress text using pako (gzip)
function compressText(text) {
  if (!text) return null;
  const compressed = pako.gzip(text);
  return cbor.encode(compressed);
}

// Decompress text using pako
function decompressText(compressed) {
  if (!compressed) return null;
  try {
    const decoded = cbor.decode(compressed);
    const decompressed = pako.ungzip(decoded, { to: 'string' });
    return decompressed;
  } catch (err) {
    console.error('Error decompressing text:', err);
    return null;
  }
}

// Send a new message (with optional image/file) - protected
app.post('/api/messages', verifyToken, uploadLimiter, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), async (req, res) => {
  try {
    const { text } = req.body;
    const messageData = {};

    // Validate and sanitize text if present
    if (text && text.trim()) {
      const validation = validateTextInput(text);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }
      
      const sanitizedText = sanitizeText(text);
      messageData.text = sanitizedText; // Store sanitized text
      if (sanitizedText.length > 100) {
        // Compress text larger than 100 characters
        messageData.text = compressText(sanitizedText);
      }
    }

    // Handle image upload with CBOR encoding
    if (req.files && req.files.image && req.files.image[0]) {
      const imageFile = req.files.image[0];
      // Compress and encode the buffer using CBOR
      const compressed = pako.gzip(imageFile.buffer);
      const encodedImage = cbor.encode(compressed);
      messageData.imageData = encodedImage;
      messageData.imageMimeType = imageFile.mimetype;
    }

    // Handle file upload with CBOR encoding
    if (req.files && req.files.file && req.files.file[0]) {
      const file = req.files.file[0];
      // Compress and encode the buffer using CBOR
      const compressed = pako.gzip(file.buffer);
      const encodedFile = cbor.encode(compressed);
      messageData.fileData = encodedFile;
      messageData.fileName = file.originalname;
      messageData.fileMimeType = file.mimetype;
      messageData.fileSize = file.size;
    }

    const message = new Message(messageData);
    await message.save();

    // Prepare response with decoded image/file
    const response = {
      _id: message._id,
      text: typeof message.text === 'string' ? message.text : decompressText(message.text),
      timestamp: message.timestamp,
      edited: message.edited
    };

    if (message.imageData) {
      try {
        const decodedCompressed = cbor.decode(message.imageData);
        const decompressed = pako.ungzip(decodedCompressed);
        response.imageData = Buffer.from(decompressed).toString('base64');
        response.imageMimeType = message.imageMimeType;
      } catch (err) {
        console.error('Error decoding image:', err);
      }
    }

    if (message.fileData) {
      response.fileName = message.fileName;
      response.fileMimeType = message.fileMimeType;
      response.fileSize = message.fileSize;
      // We'll send file data on demand, not in list
    }

    // Emit to all connected clients
    io.emit('message', response);

    res.status(201).json(response);
  } catch (err) {
    console.error('Error creating message:', err);
    res.status(500).json({ message: 'Failed to create message' });
  }
});

// Edit a message (protected)
app.put('/api/messages/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Validate and sanitize text if present
    if (text && text.trim()) {
      const validation = validateTextInput(text);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }
      
      const sanitizedText = sanitizeText(text);
      message.text = sanitizedText.length > 100 ? compressText(sanitizedText) : sanitizedText;
      message.edited = true;
      message.editedAt = new Date();
    }

    await message.save();

    // Prepare response
    const response = {
      _id: message._id,
      text: typeof message.text === 'string' ? message.text : decompressText(message.text),
      timestamp: message.timestamp,
      edited: message.edited,
      editedAt: message.editedAt
    };

    if (message.imageData) {
      try {
        const decodedCompressed = cbor.decode(message.imageData);
        const decompressed = pako.ungzip(decodedCompressed);
        response.imageData = Buffer.from(decompressed).toString('base64');
        response.imageMimeType = message.imageMimeType;
      } catch (err) {
        console.error('Error decoding image:', err);
      }
    }

    if (message.fileData) {
      response.fileName = message.fileName;
      response.fileMimeType = message.fileMimeType;
      response.fileSize = message.fileSize;
    }

    // Emit to all connected clients
    io.emit('message-edited', response);

    res.json(response);
  } catch (err) {
    console.error('Error editing message:', err);
    res.status(500).json({ message: 'Failed to edit message' });
  }
});

// Download file attachment (protected)
app.get('/api/messages/:id/file', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    
    if (!message || !message.fileData) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Decode and decompress file
    const decodedCompressed = cbor.decode(message.fileData);
    const decompressed = pako.ungzip(decodedCompressed);

    res.setHeader('Content-Type', message.fileMimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${message.fileName}"`);
    res.send(Buffer.from(decompressed));
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({ message: 'Failed to download file' });
  }
});

// Delete a message (protected)
app.delete('/api/messages/:id', verifyToken, async (req, res) => {
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

// Get date range of messages (for date picker) - protected
app.get('/api/messages/dates', verifyToken, async (req, res) => {
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
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
