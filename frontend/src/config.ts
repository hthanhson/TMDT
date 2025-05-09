export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Log API URL cho mục đích debug
console.log('API URL configured as:', API_URL);

// WebSocket URL uses port 8089
export const WS_URL = process.env.REACT_APP_WS_URL || 
  'ws://localhost:8089';
console.log('WebSocket URL configured as:', WS_URL);

// Lưu ý: Các endpoint trong backend đã bao gồm tiền tố '/api'
// Ví dụ: '/api/chat/sessions', '/api/auth/signin'
// Do đó không cần thêm '/api' vào API_URL