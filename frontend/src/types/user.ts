export interface UserData {
  id: number;
  username: string;
  email: string;
  accessToken?: string;
  token?: string;
  roles: string[];
  fullName?: string;
  primaryRole?: string;
  phoneNumber?: string;
  address?: string;
  points: number;
}

export interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isShipper: boolean;
  login: (userData: UserData) => UserData;
  loginWithCredentials: (username: string, password: string) => Promise<UserData>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  roles?: string[];
  token?: string;
  phoneNumber?: string;
  address?: string;
  profileImageUrl?: string;
}