export interface UserData {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  roles: string[];
  accessToken: string;
  token?: string; // Thêm thuộc tính token để hỗ trợ cả hai trường hợp API trả về
  points: number;
}

export interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<UserData>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}