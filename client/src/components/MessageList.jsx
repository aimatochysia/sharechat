import { Box, Typography, IconButton, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

function MessageList({ messages, onDeleteMessage, messagesEndRef }) {
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

  const messageGroups = groupMessagesByDate(messages);

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
                sx={{
                  maxWidth: '70%',
                  p: 1.5,
                  bgcolor: '#dcf8c6',
                  borderRadius: 2,
                  position: 'relative',
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

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      mt: 0.5,
                      gap: 0.5,
                    }}
                  >
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
    </Box>
  );
}

export default MessageList;
