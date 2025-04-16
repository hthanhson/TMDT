export default function authHeader(): Record<string, string> {
  const userStr = localStorage.getItem('user');
  let user = null;
  
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('Lỗi khi phân tích dữ liệu người dùng từ localStorage:', e);
      localStorage.removeItem('user');
      return {};
    }
  }
  
  if (user) {
    // Kiểm tra cả hai trường token và accessToken
    const token = user.accessToken || user.token;
    if (token) {
      return { Authorization: 'Bearer ' + token };
    }
  }
  
  return {};
} 