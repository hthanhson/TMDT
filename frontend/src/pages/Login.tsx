import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  Paper,
  Box,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra xem có redirect path không
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(username, password);
      
      // Đăng nhập thành công, cập nhật context
      await loginWithCredentials(username, password);
      
      // Chuyển hướng dựa vào vai trò
      const primaryRole = response.primaryRole;
      
      if (primaryRole === 'ROLE_ADMIN') {
        navigate('/admin/dashboard');
      } else if (primaryRole === 'ROLE_SHIPPER') {
        navigate('/shipper/dashboard');
      } else if (primaryRole === 'ROLE_MODERATOR') {
        navigate('/moderator');
      } else {
        // Quay lại trang trước đó hoặc về trang chủ
        navigate(from === '/login' ? '/' : from);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      );
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Đăng nhập
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Tên đăng nhập hoặc Email"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={toggleShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Đăng nhập'}
            </Button>
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Quên mật khẩu?
                </Link>
              </Grid>
              <Grid item>
                <Link href="/register" variant="body2">
                  {'Chưa có tài khoản? Đăng ký'}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;