# ShareChat User Guide

Welcome to ShareChat! This guide will help you get started with your personal web chat application.

## Getting Started

### First Time Setup

1. **Access your chat**
   - Open your deployment URL in a web browser
   - You'll see the login screen

2. **Login**
   - Enter the password you configured during deployment
   - Click "Login"
   - Your session will be saved, so you won't need to login again unless you logout

## Features Overview

### 📱 Mobile & Desktop

ShareChat works seamlessly on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile phones (iOS, Android)
- Tablets
- All devices sync in real-time!

### 💬 Sending Messages

#### Text Messages
1. Type your message in the input box at the bottom
2. Press Enter or click the Send button (➤)
3. Your message appears immediately

#### Images
1. Click the attachment icon (📎)
2. Select an image from your device (JPG, PNG, GIF, etc.)
3. Preview appears below the input
4. Add optional text
5. Click Send
6. Image is uploaded and compressed efficiently

#### Text + Image
1. Click attachment icon and select image
2. Type your message
3. Send both together

### 🗑️ Deleting Messages

1. Hover over any message
2. A red delete button (🗑️) appears in the top-right corner
3. Click to delete the message
4. The message is removed from all your devices instantly

### 🔍 Searching Messages

1. Click the search icon (🔍) in the top bar
2. Type your search term
3. Click "Search"
4. Only messages containing your search term will be displayed
5. Click "Clear" to see all messages again

**Search Tips:**
- Search is case-insensitive
- Searches only text content (not image names)
- Use partial words (e.g., "hello" finds "hello world")

### 📅 Date Navigation

1. Click the calendar icon (📅) in the top bar
2. Select a date from the date picker
3. Messages from that specific date will be displayed
4. Return to normal view by refreshing the page or searching again

**Date Features:**
- Jump to any date in your chat history
- Useful for finding old conversations
- Date range shows from oldest to newest message

### ⏰ Message Timestamps

Each message shows when it was sent:
- **Time**: Displayed below each message (e.g., "14:30")
- **Date Headers**: 
  - "Today" for messages sent today
  - "Yesterday" for messages from yesterday
  - "2 days ago" for messages from 2 days ago
  - "YYYY-MM-DD" format for older messages (e.g., "2025-10-31")

### 🔄 Real-time Updates

- New messages appear instantly across all your devices
- Deleted messages disappear immediately everywhere
- No need to refresh - everything updates automatically

### 🚪 Logout

1. Click the logout icon (🚪) in the top bar
2. You'll be returned to the login screen
3. Login again anytime with your password

## Tips & Best Practices

### Storage Management

You have 512MB of storage for your messages and images. To maximize it:

1. **Image Optimization**
   - Images are automatically compressed using CBOR encoding
   - ~30-40% more efficient than standard storage
   - You can store approximately 4,700 images (100KB average each)

2. **Keep it Clean**
   - Regularly delete old messages you don't need
   - Delete unnecessary images
   - Use text when possible (much smaller than images)

3. **Storage Monitoring**
   - Check your MongoDB Atlas dashboard to monitor usage
   - You'll receive warnings when approaching the limit

### Performance Tips

1. **Image Sizes**
   - Keep images under 5MB for best performance
   - Larger images take longer to upload/download
   - Consider compressing images before uploading

2. **Search Performance**
   - Specific search terms work better than generic ones
   - Shorter search queries are faster

3. **Date Navigation**
   - Use date navigation instead of scrolling for old messages
   - More efficient for large chat histories

### Security

1. **Password**
   - Keep your password secure
   - Don't share it with others
   - Change it periodically (requires redeployment)

2. **Device Security**
   - Use secure devices to access your chat
   - Logout on shared devices
   - Use HTTPS (your deployment URL should start with https://)

3. **Data Privacy**
   - Only you can access your messages with the password
   - Messages are encrypted in transit
   - MongoDB Atlas encrypts data at rest

### Multi-Device Usage

**Recommended Workflow:**
1. Open ShareChat on your phone browser
2. Open ShareChat on your computer
3. Send from any device
4. Receive on all devices instantly
5. Delete from any device, removed from all

**Add to Home Screen (Mobile):**
- **iOS**: Safari → Share → "Add to Home Screen"
- **Android**: Chrome → Menu → "Add to Home Screen"
- Acts like a native app!

## Troubleshooting

### Can't Login
- **Check password**: Make sure you're using the correct password
- **Too many attempts**: Wait 15 minutes and try again
- **Browser issues**: Try clearing cache or using incognito mode

### Messages Not Appearing
- **Check connection**: Ensure you have internet access
- **Refresh page**: Sometimes helps with connection issues
- **Check other devices**: Message may be showing on other devices

### Images Not Loading
- **File size**: Images over 5MB won't upload
- **File type**: Only image files are supported (JPG, PNG, GIF, etc.)
- **Connection**: Slow connection may delay image upload

### Search Not Working
- **Case sensitivity**: Search is case-insensitive, but check spelling
- **Full words**: Make sure you're searching for text that exists
- **Clear search**: Use "Clear" button to reset

### Real-time Updates Not Working
- **Refresh page**: Close and reopen the browser tab
- **Check connection**: WebSocket requires stable internet
- **Browser support**: Use modern browsers (Chrome, Firefox, Safari, Edge)

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line in message
- **Esc**: Close search/date dialogs

## Accessibility

ShareChat is built with accessibility in mind:
- Keyboard navigation supported
- Screen reader compatible
- High contrast WhatsApp-like design
- Touch-friendly interface for mobile

## Mobile Optimization

- **Responsive Design**: Adapts to any screen size
- **Touch Gestures**: Tap, swipe, scroll all work naturally
- **Portrait/Landscape**: Works in both orientations
- **Mobile Keyboards**: Smart keyboard behavior

## Browser Support

**Fully Supported:**
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers on iOS and Android

**Not Supported:**
- Internet Explorer
- Very old browser versions

## Data & Privacy

**What is stored:**
- Your messages (text)
- Your images (compressed with CBOR)
- Timestamps

**What is NOT stored:**
- Your IP address
- Your location
- Your device information
- Any tracking or analytics
- Your password (only validated, never stored)

## Advanced Features

### Bulk Operations
Currently, messages must be deleted one at a time. Future updates may include:
- Select multiple messages
- Delete all messages
- Export chat history

### Future Enhancements
Planned features:
- Message editing
- Message reactions (emoji)
- Voice messages
- Dark mode
- Custom themes
- Export/backup functionality

## Support

If you encounter issues:

1. **Check this guide** for troubleshooting steps
2. **Check deployment logs** in your hosting platform
3. **MongoDB Atlas** dashboard for storage/connection issues
4. **GitHub Issues** for bug reports or feature requests

## FAQ

**Q: Can I use this with multiple people?**
A: Currently, ShareChat is designed for single-user personal use. All devices share the same password and see all messages.

**Q: Are my messages encrypted?**
A: Messages are encrypted in transit (HTTPS/WSS) and at rest (MongoDB Atlas), but not end-to-end encrypted within the application.

**Q: How much storage do I have?**
A: MongoDB Atlas free tier provides 512MB. With CBOR encoding, you can store approximately 4,700 images or hundreds of thousands of text messages.

**Q: Can I export my data?**
A: Currently no built-in export. Future feature. You can use MongoDB tools to export the database.

**Q: What happens if I exceed 512MB?**
A: MongoDB Atlas will prevent new writes. You'll need to delete old messages/images or upgrade your MongoDB plan.

**Q: Can I change the password?**
A: Yes, but requires updating the environment variable on your deployment platform and redeploying.

**Q: Is video supported?**
A: No, only images and text as per design. Videos would quickly exceed storage limits.

**Q: How do I backup my data?**
A: Use MongoDB Atlas export tools or consider upgrading to a paid tier for automated backups.

## Getting Help

Need more help?
- 📖 Read: [Technical Documentation](TECHNICAL.md)
- 🚀 Deploy: [Deployment Guide](DEPLOYMENT.md)
- 🔒 Security: [Security Summary](SECURITY.md)
- 📝 GitHub: [Issues & Feature Requests](https://github.com/aimatochysia/sharechat/issues)

---

**Enjoy your private, secure, and efficient web chat! 💬**
