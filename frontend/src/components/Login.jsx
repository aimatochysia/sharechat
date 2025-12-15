import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import axios from 'axios';
import JSEncrypt from 'jsencrypt';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [warningDialog, setWarningDialog] = useState({ open: false, days: 0, token: null });
  const [publicKey, setPublicKey] = useState(null);
  const [keyError, setKeyError] = useState(false);

  // Fetch public key on component mount
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/public-key`);
        if (response.data.success && response.data.publicKey) {
          setPublicKey(response.data.publicKey);
          // Log key fingerprint for debugging (only in development)
          if (import.meta.env.DEV) {
            console.log('Public key loaded, fingerprint:', response.data.keyFingerprint);
          }
        } else {
          setKeyError(true);
        }
      } catch (err) {
        console.error('Failed to fetch public key:', err);
        setKeyError(true);
      }
    };

    fetchPublicKey();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Encrypt password with RSA public key
      let requestBody;
      if (publicKey) {
        const encrypt = new JSEncrypt();
        encrypt.setPublicKey(publicKey);
        const encryptedPassword = encrypt.encrypt(password);
        
        if (!encryptedPassword) {
          setError('Failed to encrypt password. Please refresh the page and try again.');
          setLoading(false);
          return;
        }
        
        requestBody = { encryptedPassword };
        
        // Log encryption success in development
        if (import.meta.env.DEV) {
          console.log('Password encrypted successfully');
        }
      } else {
        // Fallback to plain password if public key not available
        console.warn('Public key not available, sending plain password');
        requestBody = { password };
      }

      const response = await axios.post(
        `${API_URL}/api/auth`, 
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        // Check if password is expiring soon (within 14 days)
        const daysUntilExpiry = response.data.passwordExpiresInDays;
        if (daysUntilExpiry !== null && daysUntilExpiry <= 14) {
          // Show warning dialog and let user proceed
          setWarningDialog({ 
            open: true, 
            days: daysUntilExpiry, 
            token: response.data.token 
          });
        } else {
          onLogin(response.data.token);
        }
      }
    } catch (err) {
      // Only log errors in development mode
      if (import.meta.env.DEV) {
        console.error('Authentication error:', err);
      }
      
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Unable to connect to server. Please check your network connection and ensure the backend is running.');
      } else if (err.response?.data?.expired) {
        setError('Password has expired. Please contact the administrator to update the password.');
      } else if (err.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError(err.response?.data?.message || 'Invalid password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWarningClose = () => {
    const token = warningDialog.token;
    setWarningDialog({ open: false, days: 0, token: null });
    onLogin(token);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <LockIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                ShareChat
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter password to access your chat
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              {keyError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Secure encryption unavailable. Connection may be less secure.
                </Alert>
              )}
              
              <TextField
                fullWidth
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoFocus
                disabled={loading}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? 'Authenticating...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={warningDialog.open} onClose={handleWarningClose}>
        <DialogTitle>Password Expiration Warning</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            Your password expires in {warningDialog.days} days. Please update your password soon by changing the CHAT_PASSWORD and PASSWORD_SET_DATE environment variables.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleWarningClose} variant="contained" autoFocus>
            Continue to Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Login;
