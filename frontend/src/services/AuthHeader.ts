export default function authHeader() {
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
  
  if (user && user.accessToken) {
    return { Authorization: 'Bearer ' + user.accessToken };
  } else {
    return {};
  }
} 