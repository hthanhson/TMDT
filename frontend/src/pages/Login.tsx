import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Avatar,
  Grid,
  Alert,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const { login, isAuthenticated, isAdmin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    console.log('Login attempt with username:', username);

    try {
      const userData = await login(username, password);
      console.log('Login successful:', userData);
      
      // Kiểm tra userData trực tiếp thay vì dựa vào isAuthenticated
      if (userData && (userData.accessToken || (userData as any).token)) {
        console.log('User authenticated successfully with token');
        
        // Kiểm tra nếu người dùng là admin
        if (userData.roles && userData.roles.includes('ROLE_ADMIN')) {
          console.log('User is admin, redirecting to admin dashboard');
          navigate('/admin/dashboard');
        } else {
          console.log('User is not admin, redirecting to home');
          // Chuyển hướng người dùng thường về trang chủ
          navigate('/');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const resMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      setMessage(resMessage);
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra nếu người dùng đã đăng nhập thì chuyển hướng phù hợp
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        console.log('User is already authenticated as admin, redirecting to admin dashboard');
        navigate('/admin/dashboard');
      } else {
        console.log('User is already authenticated, redirecting to home');
        navigate('/');
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          marginTop: 8,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>

        {message && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Sign In'}
          </Button>
          <Grid container>
            <Grid item xs>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;