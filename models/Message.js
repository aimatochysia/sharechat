const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: String,
  // Store image data as CBOR-encoded buffer
  imageData: Buffer,
  imageMimeType: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
