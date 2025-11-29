# Technical Documentation

## Architecture Overview

ShareChat is a full-stack web application designed for personal use across multiple devices, featuring efficient storage optimization and a professional WhatsApp-like interface.

### System Architecture

```
┌─────────────────┐
│  React Client   │
│  (Vite + MUI)   │
└────────┬────────┘
         │ HTTP/WebSocket
         │
┌────────▼────────┐
│  Express Server │
│  (Node.js)      │
└────────┬────────┘
         │ Mongoose
         │
┌────────▼────────┐
│    MongoDB      │
│  (Atlas/Local)  │
└─────────────────┘
```

## CBOR Encoding

### What is CBOR?

CBOR (Concise Binary Object Representation) is a binary data serialization format defined in RFC 8949. It provides:

- **Smaller Size**: 20-40% reduction compared to JSON
- **Faster Processing**: Binary format is faster to parse/encode
- **Type Preservation**: Better handling of binary data
- **Standard Compliance**: Well-defined specification

### Implementation Details

#### Image Storage

Images are stored using CBOR encoding:

```javascript
// Server-side encoding (in server.js)
const encodedImage = cbor.encode(req.file.buffer);
messageData.imageData = encodedImage; // Stored as Buffer in MongoDB

// Server-side decoding for transmission
const decodedData = cbor.decode(message.imageData);
response.imageData = decodedData.toString('base64');
```

#### Storage Efficiency

For a 512MB MongoDB free tier:

| Data Type | JSON Storage | CBOR Storage | Savings |
|-----------|--------------|--------------|---------|
| Text (1KB) | 1.2 KB | 0.9 KB | ~25% |
| Image (100KB) | 133 KB (base64) | 100 KB | ~25% |
| Metadata | 0.5 KB | 0.3 KB | ~40% |

**Estimated Capacity**:
- Without CBOR: ~3,500 images (100KB avg)
- With CBOR: ~4,700 images (100KB avg)
- **+34% more storage capacity**

## Database Schema

### Message Model

```javascript
{
  text: String,              // Message text content
  imageData: Buffer,         // CBOR-encoded image data
  imageMimeType: String,     // e.g., 'image/jpeg', 'image/png'
  timestamp: Date            // Auto-generated timestamp
}
```

### Indexes

Recommended indexes for optimization:

```javascript
// In MongoDB
db.messages.createIndex({ timestamp: 1 });     // For date queries
db.messages.createIndex({ text: "text" });     // For search
```

## API Design

### RESTful Endpoints

#### Authentication
- `POST /api/auth`
  - Body: `{ password: string }`
  - Response: `{ success: boolean }`
  - Purpose: Validate password against environment variable

#### Messages
- `GET /api/messages`
  - Query params: `search`, `date`, `limit`, `skip`
  - Response: Array of messages with decoded images
  - Purpose: Retrieve messages with filtering

- `POST /api/messages`
  - Body: FormData with `text` and optional `image` file
  - Response: Created message object
  - Purpose: Create new message with optional image

- `DELETE /api/messages/:id`
  - Response: `{ success: boolean }`
  - Purpose: Delete specific message

- `GET /api/messages/dates`
  - Response: `{ oldest: Date, newest: Date }`
  - Purpose: Get date range for date picker

### WebSocket Events

#### Client → Server
- `connect` - Establish connection

#### Server → Client
- `message` - New message created
- `message-deleted` - Message was deleted

## Frontend Components

### Component Hierarchy

```
App
├── Login
└── ChatInterface
    ├── MessageList
    │   └── Message (multiple)
    ├── MessageInput
    ├── SearchDialog
    └── DatePickerDialog
```

### State Management

React hooks are used for state management:

- `useState` - Local component state
- `useEffect` - Side effects and lifecycle
- `useRef` - DOM references and mutable values

### Key Features

#### Date Grouping

Messages are grouped by date with smart labels:

```javascript
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  const daysAgo = differenceInDays(new Date(), date);
  if (daysAgo === 2) return '2 days ago';
  return format(date, 'yyyy-MM-dd');
};
```

#### Substring Search

Search uses MongoDB's regex for case-insensitive matching:

```javascript
query.text = { $regex: searchTerm, $options: 'i' };
```

#### Date Navigation

Jump to specific dates by filtering messages:

```javascript
const startOfDay = new Date(date);
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date(date);
endOfDay.setHours(23, 59, 59, 999);
query.timestamp = { $gte: startOfDay, $lte: endOfDay };
```

## Security Considerations

### Password Authentication

- Single password stored in environment variable
- No user registration/database
- Password validation on every authentication attempt
- Client stores auth state in localStorage

### Data Protection

- HTTPS required in production
- CORS configured to allow only trusted origins
- File size limits prevent DoS attacks (5MB per image)
- MongoDB connection secured with SSL

### Environment Variables

Sensitive data is never hardcoded:

```bash
MONGO_URI=<connection_string>      # Database access
CHAT_PASSWORD=<secure_password>    # Authentication
```

## Performance Optimization

### Backend Optimizations

1. **CBOR Encoding**: Reduces storage by ~30%
2. **Pagination**: Limit queries to prevent memory issues
3. **Indexes**: Fast queries on timestamp and text
4. **Connection Pooling**: MongoDB connection reuse

### Frontend Optimizations

1. **Code Splitting**: Vite automatically splits bundles
2. **Image Lazy Loading**: Images load as needed
3. **Virtual Scrolling**: Could be added for thousands of messages
4. **Memoization**: React components re-render only when needed

### Network Optimizations

1. **WebSocket**: Real-time updates without polling
2. **Compression**: Gzip enabled on server
3. **Caching**: Static assets cached by browser
4. **CDN**: Consider for production deployment

## Deployment Considerations

### Build Process

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Build frontend
cd frontend && npm run build

# Start server (serves built frontend)
cd backend && npm start
```

### Environment Setup

Required environment variables:
- `MONGO_URI` - MongoDB connection string
- `CHAT_PASSWORD` - Access password
- `NODE_ENV=production` - Production mode
- `PORT` - Server port (optional)

### Scaling Considerations

Current implementation is suitable for:
- Single user or small team
- Up to ~5,000 messages
- 512MB MongoDB free tier

For scaling:
- Add Redis for session management
- Implement pagination on frontend
- Upgrade MongoDB tier
- Add CDN for static assets
- Consider horizontal scaling with load balancer

## Testing

### Manual Testing Checklist

- [ ] Authentication with correct password
- [ ] Authentication with wrong password
- [ ] Send text-only message
- [ ] Send image-only message
- [ ] Send text + image message
- [ ] Delete message
- [ ] Search for messages
- [ ] Navigate to specific date
- [ ] Test on mobile device
- [ ] Test on tablet device
- [ ] Test on desktop browser

### Automated Testing

```javascript
// Example test with Jest
describe('Message API', () => {
  test('should create message with text', async () => {
    const response = await api.post('/api/messages', {
      text: 'Test message'
    });
    expect(response.status).toBe(201);
    expect(response.data.text).toBe('Test message');
  });
});
```

## Monitoring and Maintenance

### Logs

Server logs include:
- Connection attempts
- API requests
- WebSocket connections
- Database operations
- Errors with stack traces

### Metrics to Monitor

1. **Storage Usage**: Track MongoDB storage
2. **Response Time**: API endpoint latency
3. **Error Rate**: Failed requests
4. **Connection Count**: Active WebSocket connections

### Backup Strategy

1. Regular MongoDB exports
2. Store backups securely
3. Test restore procedures
4. Consider MongoDB Atlas automated backups (paid tier)

## Future Enhancements

Possible improvements:

1. **Message Editing**: Allow editing sent messages
2. **Message Reactions**: Add emoji reactions
3. **File Types**: Support PDFs, documents
4. **Video Support**: Add video sharing (storage intensive)
5. **Multi-user**: Support multiple users with separate chats
6. **Encryption**: End-to-end encryption for messages
7. **PWA**: Progressive Web App for offline support
8. **Push Notifications**: Browser notifications for new messages
9. **Message Replies**: Thread support
10. **Voice Messages**: Audio message support

## Troubleshooting Guide

### Common Issues

#### "Cannot connect to MongoDB"
- Check MONGO_URI format
- Verify network access in MongoDB Atlas
- Check firewall rules

#### "Invalid password"
- Verify CHAT_PASSWORD is set correctly
- Check for trailing spaces in password
- Ensure .env file is loaded

#### "Build fails"
- Clear node_modules and reinstall
- Check Node.js version (requires v16+)
- Verify all dependencies are installed

#### "Images not displaying"
- Check CBOR encoding/decoding
- Verify MIME type is correct
- Check image size limits

#### "Real-time updates not working"
- Verify WebSocket connection
- Check CORS settings
- Ensure Socket.io versions match

## License

ISC License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/aimatochysia/sharechat/issues
- Documentation: See README.md and DEPLOYMENT.md
