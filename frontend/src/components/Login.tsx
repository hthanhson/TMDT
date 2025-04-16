import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  Avatar,
  Alert,
  CircularProgress,
  Grid,
  Link,
  InputAdornment,
  IconButton
} from "@mui/material";
import {
  LockOutlined,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";
import AuthService from "../services/authService";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await AuthService.login(username, password);

      // Chuyển hướng dựa vào vai trò người dùng
      const primaryRole = response.primaryRole;
      
      if (primaryRole === "ROLE_ADMIN") {
        navigate("/admin/dashboard");
      } else if (primaryRole === "ROLE_SHIPPER") {
        navigate("/shipper/dashboard");
      } else if (primaryRole === "ROLE_MODERATOR") {
        navigate("/moderator");
      } else {
        navigate("/profile");
      }
    } catch (error: any) {
      const resMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      setLoading(false);
      setMessage(resMessage);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Đăng nhập
        </Typography>
        
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
          {message && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {message}
            </Alert>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Tên đăng nhập"
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
            label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePassword}
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
            {loading ? <CircularProgress size={24} /> : "Đăng nhập"}
          </Button>
          
          <Grid container>
            <Grid item xs>
              <Link href="#" variant="body2">
                Quên mật khẩu?
              </Link>
            </Grid>
            <Grid item>
              <Link href="/register" variant="body2">
                {"Chưa có tài khoản? Đăng ký"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Login; 