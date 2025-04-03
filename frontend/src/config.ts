export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Log API URL cho mục đích debug
console.log('API URL configured as:', API_URL);

// Lưu ý: Backend đã cấu hình context-path là '/api' trong application.properties
// Vì vậy, không cần thêm '/api' vào API_URL khi gọi API