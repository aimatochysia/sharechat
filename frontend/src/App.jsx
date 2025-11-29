import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import ChatInterface from './components/ChatInterface';

const theme = createTheme({
  palette: {
    primary: {
      main: '#075e54',
      light: '#128c7e',
    },
    secondary: {
      main: '#25d366',
    },
    background: {
      default: '#e5ddd5',
      paper: '#ffffff',
    },
  },
});

// Token storage utilities
const getStoredToken = () => localStorage.getItem('chatToken');
const setStoredToken = (token) => localStorage.setItem('chatToken', token);
const clearStoredToken = () => localStorage.removeItem('chatToken');

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify stored token on app load
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.ok) {
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            // Token invalid or expired
            clearStoredToken();
          }
        } catch (err) {
          console.error('Token verification failed:', err);
          clearStoredToken();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const handleLogin = useCallback((newToken) => {
    setStoredToken(newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  // Show loading state while verifying token
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: '#e5ddd5'
        }}>
          Loading...
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isAuthenticated ? (
        <ChatInterface onLogout={handleLogout} token={token} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </ThemeProvider>
  );
}

export default App;
