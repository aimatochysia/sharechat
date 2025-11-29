const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: String,
  // Store image/file data as CBOR-encoded buffer (compressed)
  imageData: Buffer,
  imageMimeType: String,
  // File attachment support
  fileData: Buffer,
  fileName: String,
  fileMimeType: String,
  fileSize: Number,
  timestamp: { type: Date, default: Date.now },
  edited: { type: Boolean, default: false },
  editedAt: Date
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
