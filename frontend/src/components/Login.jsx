import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWarning('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth`, { password });
      if (response.data.success) {
        // Check if password is expiring soon (within 14 days)
        const daysUntilExpiry = response.data.passwordExpiresInDays;
        if (daysUntilExpiry !== null && daysUntilExpiry <= 14) {
          setWarning(`Password expires in ${daysUntilExpiry} days. Please update your password soon.`);
          // Still allow login but show warning
          setTimeout(() => {
            onLogin(response.data.token);
          }, 3000);
        } else {
          onLogin(response.data.token);
        }
      }
    } catch (err) {
      if (err.response?.data?.expired) {
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

              {warning && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {warning}
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
    </Container>
  );
}

export default Login;
