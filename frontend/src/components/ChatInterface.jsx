import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import io from 'socket.io-client';
import axios from 'axios';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SearchDialog from './SearchDialog';
import DatePickerDialog from './DatePickerDialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function ChatInterface({ onLogout, token }) {
  const [messages, setMessages] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Create axios instance with auth header
  const apiClient = useCallback(() => {
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }, [token]);

  // Handle 401 errors (token expired)
  const handleApiError = useCallback((err) => {
    if (err.response?.status === 401) {
      console.log('Token expired, logging out...');
      onLogout();
    }
  }, [onLogout]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(async (query = {}) => {
    try {
      const params = new URLSearchParams(query);
      const response = await apiClient().get(`/api/messages?${params}`);
      setMessages(response.data);
    } catch (err) {
      console.error('Error loading messages:', err);
      handleApiError(err);
    }
  }, [apiClient, handleApiError]);

  // Load initial messages
  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        const response = await apiClient().get('/api/messages');
        setMessages(response.data);
      } catch (err) {
        console.error('Error loading messages:', err);
        handleApiError(err);
      }
    };
    fetchInitialMessages();
  }, [apiClient, handleApiError]);

  // Connect to socket.io with authentication
  useEffect(() => {
    const newSocket = io(API_URL, {
      auth: {
        token: token
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      if (err.message === 'Authentication required' || err.message === 'Invalid or expired token') {
        onLogout();
      }
    });

    // Listen for new messages
    newSocket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for deleted messages
    newSocket.on('message-deleted', (messageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    // Listen for edited messages
    newSocket.on('message-edited', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
    });

    socketRef.current = newSocket;

    return () => {
      newSocket.close();
    };
  }, [token, onLogout]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (text, image, file) => {
    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (image) formData.append('image', image);
      if (file) formData.append('file', file);

      await apiClient().post('/api/messages', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
      });
    } catch (err) {
      console.error('Error sending message:', err);
      handleApiError(err);
      alert('Failed to send message');
    }
  };

  const handleEditMessage = async (messageId, newText) => {
    try {
      await apiClient().put(`/api/messages/${messageId}`, {
        text: newText,
      });
    } catch (err) {
      console.error('Error editing message:', err);
      handleApiError(err);
      alert('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await apiClient().delete(`/api/messages/${messageId}`);
    } catch (err) {
      console.error('Error deleting message:', err);
      handleApiError(err);
      alert('Failed to delete message');
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      loadMessages({ search: query });
    } else {
      loadMessages();
    }
  };

  const handleDateSelect = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    loadMessages({ date: dateStr });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ShareChat
          </Typography>
          <IconButton color="inherit" onClick={() => setSearchOpen(true)}>
            <SearchIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => setDatePickerOpen(true)}>
            <CalendarTodayIcon />
          </IconButton>
          <IconButton color="inherit" onClick={onLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Paper
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#e5ddd5',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23e5ddd5\'/%3E%3Cpath d=\'M0 0L50 50M50 50L100 0M0 100L50 50M50 50L100 100\' stroke=\'%23d1ccc0\' stroke-width=\'0.5\' opacity=\'0.3\'/%3E%3C/svg%3E")',
        }}
      >
        <MessageList
          messages={messages}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          messagesEndRef={messagesEndRef}
          token={token}
        />
        <MessageInput onSendMessage={handleSendMessage} />
      </Paper>

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={handleSearch}
        currentQuery={searchQuery}
      />

      <DatePickerDialog
        open={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        onDateSelect={handleDateSelect}
      />
    </Box>
  );
}

export default ChatInterface;
