import { useState } from 'react';
import { Box, Typography, IconButton, Paper, Menu, MenuItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function MessageList({ messages, onDeleteMessage, onEditMessage, messagesEndRef }) {
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    const daysAgo = differenceInDays(new Date(), date);
    if (daysAgo === 2) return '2 days ago';
    return format(date, 'yyyy-MM-dd');
  };

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((message) => {
      const dateKey = format(new Date(message.timestamp), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    return groups;
  };

  const handleContextMenu = (event, message) => {
    event.preventDefault();
    setSelectedMessage(message);
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : null,
    );
  };

  const handleLongPress = (message) => {
    setSelectedMessage(message);
    // For mobile, we'll use a different approach with the menu
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setSelectedMessage(null);
  };

  const handleCopyText = () => {
    if (selectedMessage?.text) {
      navigator.clipboard.writeText(selectedMessage.text);
    }
    handleCloseContextMenu();
  };

  const handleEdit = () => {
    if (selectedMessage?.text && onEditMessage) {
      const newText = prompt('Edit message:', selectedMessage.text);
      if (newText !== null && newText.trim()) {
        onEditMessage(selectedMessage._id, newText);
      }
    }
    handleCloseContextMenu();
  };

  const handleDelete = () => {
    if (selectedMessage) {
      onDeleteMessage(selectedMessage._id);
    }
    handleCloseContextMenu();
  };

  const handleDownloadFile = (messageId, fileName) => {
    window.open(`${API_URL}/api/messages/${messageId}/file`, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const messageGroups = groupMessagesByDate(messages);

  // Long press handler for mobile
  let pressTimer = null;
  const handleTouchStart = (message) => {
    pressTimer = setTimeout(() => {
      setSelectedMessage(message);
      // Show menu at center of screen on mobile
      setContextMenu({
        mouseX: window.innerWidth / 2,
        mouseY: window.innerHeight / 2,
      });
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {Object.entries(messageGroups).map(([date, msgs]) => (
        <Box key={date}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              my: 2,
            }}
          >
            <Paper
              sx={{
                px: 2,
                py: 0.5,
                bgcolor: '#dcf8c6',
                borderRadius: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {formatDate(msgs[0].timestamp)}
              </Typography>
            </Paper>
          </Box>

          {msgs.map((message) => (
            <Box
              key={message._id}
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                mb: 1,
              }}
            >
              <Paper
                onContextMenu={(e) => handleContextMenu(e, message)}
                onTouchStart={() => handleTouchStart(message)}
                onTouchEnd={handleTouchEnd}
                sx={{
                  maxWidth: '70%',
                  p: 1.5,
                  bgcolor: '#dcf8c6',
                  borderRadius: 2,
                  position: 'relative',
                  cursor: 'context-menu',
                  '&:hover .delete-btn': {
                    opacity: 1,
                  },
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  {message.text && (
                    <Typography
                      variant="body1"
                      sx={{
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        pr: 4,
                      }}
                    >
                      {message.text}
                    </Typography>
                  )}

                  {message.imageData && (
                    <Box sx={{ mt: message.text ? 1 : 0 }}>
                      <img
                        src={`data:${message.imageMimeType};base64,${message.imageData}`}
                        alt="Shared"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          borderRadius: '8px',
                          display: 'block',
                        }}
                      />
                    </Box>
                  )}

                  {message.fileName && (
                    <Box
                      sx={{
                        mt: message.text || message.imageData ? 1 : 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        bgcolor: 'rgba(0,0,0,0.05)',
                        borderRadius: 1,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleDownloadFile(message._id, message.fileName)}
                    >
                      <DownloadIcon fontSize="small" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {message.fileName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(message.fileSize)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      mt: 0.5,
                      gap: 0.5,
                    }}
                  >
                    {message.edited && (
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontStyle: 'italic', mr: 0.5 }}
                      >
                        edited
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Box>

                  <IconButton
                    className="delete-btn"
                    size="small"
                    onClick={() => onDeleteMessage(message._id)}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'error.main',
                      color: 'white',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '&:hover': {
                        bgcolor: 'error.dark',
                      },
                      width: 24,
                      height: 24,
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      ))}
      <div ref={messagesEndRef} />

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {selectedMessage?.text && (
          <MenuItem onClick={handleCopyText}>
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy text</ListItemText>
          </MenuItem>
        )}
        {selectedMessage?.text && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default MessageList;
