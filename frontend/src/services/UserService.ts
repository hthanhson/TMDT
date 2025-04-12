import api from './api';

interface ProfileData {
  fullName: string;
  email: string;
  address: string;
  phoneNumber: string;
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
  
  changePassword(oldPassword: string, newPassword: string) {
    return api.put('/user/change-password', { oldPassword, newPassword });
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