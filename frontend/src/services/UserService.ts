import api from './api';

interface ProfileData {
  fullName: string;
  email: string;
  address: string;
  phoneNumber: string;
}

interface ProfileUpdateData extends ProfileData {
  password: string; // For verification
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

interface DepositRequest {
  amount: string;
  description: string;
}

const UserService = {
  getUserProfile() {
    return api.get('/user/profile');
  },
  
  updateProfile(profileData: ProfileData) {
    return api.put('/user/profile', profileData);
  },
  
  updateProfileWithVerification(profileData: ProfileUpdateData) {
    return api.post('/auth/update-profile', profileData);
  },
  
  // Phương thức đổi mật khẩu chính
  changePassword(oldPassword: string, newPassword: string) {
    return api.post('/auth/change-password', { 
      currentPassword: oldPassword, 
      newPassword: newPassword 
    });
  },
  
  // Phương thức đổi mật khẩu xem xét
  changePasswordWithVerification(passwordData: PasswordChangeData) {
    return api.post('/auth/change-password', passwordData);
  },
  
  // Balance-related methods
  getBalance() {
    return api.get('/user-balance');
  },
  
  deposit(depositRequest: DepositRequest) {
    return api.post('/user-balance/deposit', depositRequest);
  },
  
  getTransactionHistory(page = 0, size = 10) {
    return api.get(`/user-balance/transactions?page=${page}&size=${size}`);
  }
};

export default UserService;