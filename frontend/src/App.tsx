import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SnackbarProvider } from 'notistack';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ChatBot from './components/Chat/ChatBot';
import AdminRoute from './components/AdminRoute';

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

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Thêm component mới để chuyển hướng người dùng admin
const NavigationGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Nếu đã đăng nhập với vai trò admin và không đang ở trang admin
    if (isAuthenticated && isAdmin && !location.pathname.startsWith('/admin')) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, isAdmin, navigate, location.pathname]);

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <SnackbarProvider maxSnack={3}>
          <Router>
            <ToastContainer position="top-right" autoClose={3000} />
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
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NavigationGuard>
            
            {/* Chatbot - visible on all pages */}
            <ChatBot />
          </Router>
        </SnackbarProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App; 