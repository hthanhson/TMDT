import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SnackbarProvider } from 'notistack';
import { Toaster } from 'react-hot-toast';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ShipperLayout from './components/ShipperLayout';
import ChatBot from './components/Chat/ChatBot';
import AdminChat from './components/admin/AdminChat';
import AdminRoute from './components/AdminRoute';
import ShipperRoute from './components/ShipperRoute';
import AdminChatButton from './components/admin/AdminChatButton';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderSuccess from './pages/OrderSuccess';
import PaySuccess from './pages/PaySuccess';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminCategories from './pages/admin/Categories';
import AdminReviews from './pages/admin/Reviews';
import AdminNotifications from './pages/admin/Notifications';
import AdminReports from './pages/admin/Reports';
import NotFound from './pages/NotFound';
import Products from './pages/Products';
import Wishlist from './pages/Wishlist';
import ProductForm from './pages/admin/ProductForm';
import AdminCoupons from './pages/admin/Coupons';
import RefundRequests from './pages/RefundRequests'; // Import RefundRequests page

// Shipper Pages - Tạm thởi nhập từ components đến khi tạo các pages riêng
import ShipperDashboard from './components/ShipperDashboard';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Thêm component mới để chuyển hướng người dùng dựa trên vai trò
const NavigationGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Nếu đã đăng nhập với vai trò admin và không đang ở trang admin
    if (isAuthenticated && isAdmin && !location.pathname.startsWith('/admin')) {
      navigate('/admin/dashboard');
      return;
    }

    // Nếu đã đăng nhập với vai trò shipper và không đang ở trang shipper hoặc admin
    if (isAuthenticated && user && user.roles && 
        user.roles.includes('ROLE_SHIPPER') && 
        !user.roles.includes('ROLE_ADMIN') && 
        !location.pathname.startsWith('/shipper') && 
        !location.pathname.startsWith('/admin')) {
      navigate('/shipper/dashboard');
      return;
    }
  }, [isAuthenticated, isAdmin, user, navigate, location.pathname]);

  return <>{children}</>;
};

// ChatBot Conditional Component
const ConditionalChatBot: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Chỉ hiển thị ChatBot khi user đã đăng nhập và không phải admin hoặc shipper
  if (!isAuthenticated || (user?.roles && (user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_SHIPPER')))) {
    return null;
  }
  
  return <ChatBot />;
};

// Admin Chat Component - hiển thị cho người dùng admin
const AdminChatComponent: React.FC = () => {
  const { user } = useAuth();
  
  if (user && user.roles && user.roles.includes('ROLE_ADMIN')) {
    return <AdminChatButton />;
  }
  
  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <SnackbarProvider maxSnack={3}>
            <Router>
              <ToastContainer position="top-right" autoClose={3000} />
              <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
              <NavigationGuard>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="products" element={<Products />} />
                    <Route path="products/:productId" element={<ProductDetail />} />
                    <Route path="cart" element={<Cart />} />
                    
                    {/* Protected Routes - chỉ hiển thị cho người dùng thông thường */}
                    <Route 
                      path="checkout" 
                      element={<ProtectedRoute adminOnly={false}><Checkout /></ProtectedRoute>} 
                    />
                    <Route 
                      path="order-success" 
                      element={<ProtectedRoute adminOnly={false}><OrderSuccess /></ProtectedRoute>} 
                    />
                    <Route 
                      path="pay-success" 
                      element={<ProtectedRoute adminOnly={false}><PaySuccess /></ProtectedRoute>} 
                    />
                    <Route 
                      path="orders" 
                      element={<ProtectedRoute adminOnly={false}><Orders /></ProtectedRoute>} 
                    />
                    <Route 
                      path="orders/:id" 
                      element={<ProtectedRoute adminOnly={false}><OrderDetail /></ProtectedRoute>} 
                    />
                    <Route 
                      path="profile" 
                      element={<ProtectedRoute adminOnly={false}><Profile /></ProtectedRoute>} 
                    />
                    <Route 
                      path="notifications" 
                      element={<ProtectedRoute adminOnly={false}><Notifications /></ProtectedRoute>} 
                    />
                    <Route 
                      path="dashboard" 
                      element={<ProtectedRoute adminOnly={false}><UserDashboard /></ProtectedRoute>} 
                    />
                    <Route 
                      path="wishlist" 
                      element={<ProtectedRoute adminOnly={false}><Wishlist /></ProtectedRoute>} 
                    />
                    <Route 
                      path="refund-requests" 
                      element={<ProtectedRoute adminOnly={false}><RefundRequests /></ProtectedRoute>} 
                    />
                  </Route>
                  
                  {/* Admin Routes */}
                  <Route 
                    path="/admin" 
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<ProductForm />} />
                    <Route path="products/edit/:id" element={<ProductForm />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                    <Route path="reports" element={<AdminReports />} />
                  </Route>
                  
                  {/* Shipper Routes */}
                  <Route 
                    path="/shipper" 
                    element={<ShipperRoute><ShipperLayout /></ShipperRoute>}
                  >
                    <Route path="dashboard" element={<ShipperDashboard />} />
                    <Route path="available-orders" element={<ShipperDashboard />} />
                    <Route path="my-orders" element={<ShipperDashboard />} />
                  </Route>
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </NavigationGuard>
              
              {/* Chatbot - visible on all pages except for admin users */}
              <ConditionalChatBot />
              
              {/* Admin Chat - only visible for admin users */}
              <AdminChatComponent />
            </Router>
          </SnackbarProvider>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App; 