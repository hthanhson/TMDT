import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Paper,
  Divider,
  Chip,
  Rating,
  TextField,
  Tabs,
  Tab,
  Skeleton,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Description as DescriptionIcon,
  Reviews as ReviewsIcon,
  Delete as DeleteIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
} from '@mui/icons-material';
import ProductService from '../services/productService';
import { Product } from '../types/product';
import { useCart } from '../contexts/CartContext';
import TopProducts from '../components/Products/TopProducts';
import { useAuth } from '../contexts/AuthContext';
import ReviewForm from '../components/Products/ReviewForm';
import api from '../services/api';
import WishlistService from '../services/WishlistService';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DEBUG = false;

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log(...args);
  }
}

const getImageUrl = (product: any): string => {
  if (!product || !product.id) {
    return '/assets/images/product-placeholder.jpg';
  }

  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  
  // Always use the direct product image endpoint which handles all server-side logic
  return `${BASE_URL}/products/images/product/${product.id}`;
};

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [loadingUserReviews, setLoadingUserReviews] = useState(false);
  const [processedReviews, setProcessedReviews] = useState<any[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const fixReviewsWithMissingUserId = (reviews: any[]) => {
    if (!isAuthenticated || !user) return;

    console.log('Checking reviews for missing userId...');
    let fixedCount = 0;

    // Tạo một map để lưu trữ thông tin về các reviews đã có userId
    const reviewsWithUserId = new Map();
    const userNameToUserIdMap = new Map();

    // Bước 1: Thu thập thông tin từ reviews đã có userId
    reviews.forEach((review, index) => {
      if (review.userId) {
        // Lưu trữ thông tin theo userId
        if (!reviewsWithUserId.has(review.userId)) {
          reviewsWithUserId.set(review.userId, []);
        }
        reviewsWithUserId.get(review.userId).push(review);

        // Ánh xạ từ các loại tên hiển thị đến userId
        if (review.userName) {
          userNameToUserIdMap.set(review.userName.toLowerCase(), review.userId);
        }
        if (review.user?.fullName) {
          userNameToUserIdMap.set(review.user.fullName.toLowerCase(), review.userId);
        }
        if (review.user?.username) {
          userNameToUserIdMap.set(review.user.username.toLowerCase(), review.userId);
        }
      }
    });

    // Bước 2: Xử lý các reviews thiếu userId
    reviews.forEach((review, index) => {
      if (!review.userId) {
        let matchedUserId = null;

        // Kiểm tra trước xem có phải review của user hiện tại không
        const isCurrentUserReview =
          // Kiểm tra theo username
          (review.user?.username && user.username && review.user.username === user.username) ||
          // Hoặc kiểm tra theo fullName nếu trùng khớp
          (review.user?.fullName && user.fullName && review.user.fullName === user.fullName) ||
          // Hoặc kiểm tra theo userName
          (review.userName && user.fullName && review.userName === user.fullName) ||
          (review.userName && user.username && review.userName === user.username);

        if (isCurrentUserReview) {
          console.log(`Review ${index}: Belongs to current user, setting userId to ${user.id}`);
          review.userId = user.id;
          if (!review.user) {
            review.user = { id: user.id };
          } else {
            review.user.id = user.id;
          }
          fixedCount++;
        } else {
          // Thử khớp theo tên hiển thị
          if (review.userName && userNameToUserIdMap.has(review.userName.toLowerCase())) {
            matchedUserId = userNameToUserIdMap.get(review.userName.toLowerCase());
          } else if (review.user?.fullName && userNameToUserIdMap.has(review.user.fullName.toLowerCase())) {
            matchedUserId = userNameToUserIdMap.get(review.user.fullName.toLowerCase());
          } else if (review.user?.username && userNameToUserIdMap.has(review.user.username.toLowerCase())) {
            matchedUserId = userNameToUserIdMap.get(review.user.username.toLowerCase());
          }

          // Nếu vẫn không tìm thấy, thử tìm kiếm dựa trên thời gian tạo
          if (!matchedUserId && review.createdAt) {
            // Tìm reviews có thời gian tạo gần nhau (trong vòng 5 phút)
            const reviewTime = new Date(review.createdAt).getTime();

            for (const [userId, userReviews] of Array.from(reviewsWithUserId.entries())) {
              for (const userReview of userReviews) {
                if (userReview.createdAt) {
                  const timeDiff = Math.abs(reviewTime - new Date(userReview.createdAt).getTime());
                  if (timeDiff < 1000 * 60 * 5) { // 5 phút
                    matchedUserId = userId;
                    console.log(`Review ${index}: Matched with userId ${userId} by creation time`);
                    break;
                  }
                }
              }
              if (matchedUserId) break;
            }
          }

          // Gán userId nếu tìm thấy match
          if (matchedUserId) {
            review.userId = matchedUserId;
            if (!review.user) {
              review.user = { id: matchedUserId };
            } else if (typeof review.user === 'object') {
              review.user.id = matchedUserId;
            } else {
              // Nếu user không phải là object, tạo object mới
              console.log(`Review ${index}: Converting user from ${typeof review.user} to object with value`, review.user);
              const originalUserValue = review.user;
              review.user = {
                id: matchedUserId,
                originalValue: originalUserValue // giữ giá trị gốc để debug
              };
            }
            fixedCount++;
            console.log(`Review ${index}: Fixed missing userId to ${matchedUserId}`);
          }
        }
      }
    });

    if (fixedCount > 0) {
      console.log(`Fixed ${fixedCount} reviews with missing userId`);
    }
  };

  const processProduct = (product: any) => {
    console.log('Raw product data:', product);

    if (product.reviews) {
      console.log(`Found ${product.reviews.length} reviews to process`);
      // Log chi tiết từng review để debug
      product.reviews.forEach((review: any, index: number) => {
        console.log(`Raw review ${index}:`, JSON.stringify(review));
      });
    }

    // Tạo map để nhóm thông tin người dùng theo userId
    const userInfoMap = new Map();

    // Thêm map để lưu trữ các tên hiển thị và khớp với userIds
    const userNameToIdMap = new Map();

    // Tạo map để lưu comment patterns cho mỗi user (dùng để nhận diện reviews của cùng một người)
    const commentPatternMap = new Map();

    // Kiểm tra xem user hiện tại có tồn tại không để thêm vào map
    if (isAuthenticated && user) {
      userInfoMap.set(user.id.toString(), {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        userName: user.fullName || user.username
      });
      // Lưu các patterns có thể dùng để nhận diện user này
      if (user.username) userNameToIdMap.set(user.username.toLowerCase(), user.id.toString());
      if (user.fullName) userNameToIdMap.set(user.fullName.toLowerCase(), user.id.toString());

      console.log(`Added current user to map: ${user.id}`);
    }

    // First pass: Collect user information from all reviews
    product.reviews?.forEach((review: any, index: number) => {
      let userId = null;
      let userName = null;

      console.log(`Extracting user info from review ${index}:`, review);

      // Extract userId first - be very thorough
      if (review.user && review.user.id) {
        userId = review.user.id.toString();
        console.log(`Review ${index}: Found userId ${userId} from user object`);
      } else if (review.userId) {
        userId = review.userId.toString();
        console.log(`Review ${index}: Found userId ${userId} from userId field`);
      } else if (isAuthenticated && user && review.createdBy === user.username) {
        // Nếu createdBy trùng với username hiện tại
        userId = user.id.toString();
        console.log(`Review ${index}: Matched createdBy with current user: ${userId}`);
      }

      // Extract user information
      if (review.user) {
        if (review.user.fullName) {
          userName = review.user.fullName;
          console.log(`Review ${index}: Found userName ${userName} from user.fullName`);

          // Lưu mapping từ userName đến userId nếu có cả hai
          if (userId && userName) {
            userNameToIdMap.set(userName.toLowerCase(), userId);
          }
        } else if (review.user.username) {
          userName = review.user.username;
          console.log(`Review ${index}: Found userName ${userName} from user.username`);

          // Lưu mapping từ userName đến userId nếu có cả hai
          if (userId && userName) {
            userNameToIdMap.set(userName.toLowerCase(), userId);
          }
        }
      } else if (review.fullName) {
        userName = review.fullName;
        console.log(`Review ${index}: Found userName ${userName} from fullName field`);

        // Lưu mapping từ userName đến userId nếu có cả hai
        if (userId && userName) {
          userNameToIdMap.set(userName.toLowerCase(), userId);
        }
      } else if (review.userName) {
        userName = review.userName;
        console.log(`Review ${index}: Found userName ${userName} from userName field`);

        // Lưu mapping từ userName đến userId nếu có cả hai
        if (userId && userName) {
          userNameToIdMap.set(userName.toLowerCase(), userId);
        }
      } else if (review.username) {
        userName = review.username;
        console.log(`Review ${index}: Found userName ${userName} from username field`);

        // Lưu mapping từ userName đến userId nếu có cả hai
        if (userId && userName) {
          userNameToIdMap.set(userName.toLowerCase(), userId);
        }
      }

      // Lưu comment pattern nếu có userId
      if (userId && review.comment) {
        const commentKey = typeof review.comment === 'string' ? review.comment.trim() : JSON.stringify(review.comment);
        if (!commentPatternMap.has(userId)) {
          commentPatternMap.set(userId, new Set());
        }
        commentPatternMap.get(userId).add(commentKey);
      }
    });

    console.log('User information collected:', Array.from(userInfoMap.entries()).map(([key, value]) => ({ userId: key, ...value })));
    console.log('User name to ID mappings:', Array.from(userNameToIdMap.entries()));
    console.log('Comment patterns by user:', Array.from(commentPatternMap.entries()).map(([userId, patterns]) =>
      ({ userId, patternCount: patterns.size })));

    // Second pass: Try to match reviews without userId to existing users based on names or patterns
    product.reviews?.forEach((review: any, index: number) => {
      if (!review.userId && !review.user?.id) {
        // Tìm kiếm dựa trên userName hoặc username
        let matchedUserId = null;

        // Kiểm tra từ localStorage xem đã có mapping nào trước đó không
        try {
          const storedMappings = localStorage.getItem('reviewUserMappings');
          if (storedMappings) {
            const mappings = JSON.parse(storedMappings);

            // Tìm mapping dựa trên các trường khác nhau
            if (review.user?.username && mappings.username && mappings.username[review.user.username]) {
              matchedUserId = mappings.username[review.user.username];
              console.log(`Review ${index}: Matched by username from stored mapping: ${matchedUserId}`);
            }
            else if (review.user?.fullName && mappings.fullName && mappings.fullName[review.user.fullName]) {
              matchedUserId = mappings.fullName[review.user.fullName];
              console.log(`Review ${index}: Matched by fullName from stored mapping: ${matchedUserId}`);
            }
            else if (review.userName && mappings.userName && mappings.userName[review.userName]) {
              matchedUserId = mappings.userName[review.userName];
              console.log(`Review ${index}: Matched by userName from stored mapping: ${matchedUserId}`);
            }
          }
        } catch (e) {
          console.error('Error reading from localStorage:', e);
        }

        // Nếu không tìm được từ localStorage, tiếp tục với phương pháp hiện tại
        if (!matchedUserId) {
          // Kiểm tra theo tên người dùng
          if (review.user?.fullName && userNameToIdMap.has(review.user.fullName.toLowerCase())) {
            matchedUserId = userNameToIdMap.get(review.user.fullName.toLowerCase());
            console.log(`Review ${index}: Matched by user.fullName to userId ${matchedUserId}`);
          } else if (review.user?.username && userNameToIdMap.has(review.user.username.toLowerCase())) {
            matchedUserId = userNameToIdMap.get(review.user.username.toLowerCase());
            console.log(`Review ${index}: Matched by user.username to userId ${matchedUserId}`);
          } else if (review.fullName && userNameToIdMap.has(review.fullName.toLowerCase())) {
            matchedUserId = userNameToIdMap.get(review.fullName.toLowerCase());
            console.log(`Review ${index}: Matched by fullName to userId ${matchedUserId}`);
          } else if (review.userName && userNameToIdMap.has(review.userName.toLowerCase())) {
            matchedUserId = userNameToIdMap.get(review.userName.toLowerCase());
            console.log(`Review ${index}: Matched by userName to userId ${matchedUserId}`);
          } else if (review.username && userNameToIdMap.has(review.username.toLowerCase())) {
            matchedUserId = userNameToIdMap.get(review.username.toLowerCase());
            console.log(`Review ${index}: Matched by username to userId ${matchedUserId}`);
          }
        }

        // Nếu không tìm thấy qua tên, thử tìm qua nội dung comment
        if (!matchedUserId && review.comment) {
          const commentKey = typeof review.comment === 'string' ? review.comment.trim() : JSON.stringify(review.comment);

          // Kiểm tra xem comment này có khớp với pattern của user nào không
          for (const userId of Array.from(commentPatternMap.keys())) {
            const patterns = commentPatternMap.get(userId);
            if (patterns.has(commentKey) ||
              // Thử kiểm tra nếu comment có chứa các pattern đã biết
              (typeof commentKey === 'string' && Array.from(patterns).some(pattern =>
                typeof pattern === 'string' && (
                  commentKey.includes(pattern) ||
                  pattern.includes(commentKey)
                )
              ))) {
              matchedUserId = userId;
              console.log(`Review ${index}: Matched by comment pattern to userId ${matchedUserId}`);
              break;
            }
          }
        }

        // Nếu vẫn không tìm thấy userId, thử tìm kiếm dựa trên thời gian tạo
        if (!matchedUserId && review.createdAt) {
          // Tìm reviews cùng thời gian (trong vòng 10 phút)
          const createdAtTime = new Date(review.createdAt).getTime();
          const potentialMatches = product.reviews.filter((r: any) =>
            r.userId && // Chỉ xem xét reviews đã có userId
            r.createdAt && // Cần có thời gian tạo để so sánh
            Math.abs(new Date(r.createdAt).getTime() - createdAtTime) < 1000 * 60 * 10 // Trong vòng 10 phút
          );

          if (potentialMatches.length > 0) {
            // Lọc lần nữa dựa trên IP hoặc thông tin browser nếu có
            const matchedByTime = potentialMatches.sort((a: any, b: any) =>
              Math.abs(new Date(a.createdAt).getTime() - createdAtTime) -
              Math.abs(new Date(b.createdAt).getTime() - createdAtTime)
            );

            matchedUserId = matchedByTime[0].userId;
            console.log(`Review ${index}: Matched by creation time proximity to userId ${matchedUserId}`);
          }
        }

        // FIX QUAN TRỌNG: Nếu vẫn không tìm được userId, tạo một userId ngẫu nhiên nhưng cố định
        // Điều này đảm bảo mỗi review luôn có userId và không bị thay đổi khi làm mới trang
        if (!matchedUserId) {
          // Tạo userId duy nhất và nhất quán cho mỗi review, dựa trên id hoặc nội dung của review
          const reviewIdentifier = review.id ||
            (review.createdAt ? new Date(review.createdAt).getTime() : '') ||
            (review.comment ? review.comment.substring(0, 20) : '');

          // Tạo một mã hash từ reviewIdentifier để đảm bảo tính nhất quán
          const hashCode = (str: string) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
              hash = ((hash << 5) - hash) + str.charCodeAt(i);
              hash |= 0; // Convert to 32bit integer
            }
            return Math.abs(hash).toString();
          };

          // Tạo một userId cố định từ thông tin review có sẵn
          matchedUserId = `anonymous-${hashCode(reviewIdentifier.toString())}-${index}`;
          console.log(`Review ${index}: Generated fixed anonymous userId: ${matchedUserId}`);

          // Đánh dấu review này là ẩn danh
          review.isAnonymous = true;
          review.anonymous = true;
        }

        // Nếu tìm thấy match, gán userId và user object
        if (matchedUserId) {
          review.userId = matchedUserId;
          if (!review.user) {
            review.user = { id: matchedUserId };
          } else if (typeof review.user === 'object') {
            review.user.id = matchedUserId;
          } else {
            // Nếu user không phải là object, tạo object mới
            console.log(`Review ${index}: Converting user from ${typeof review.user} to object with value`, review.user);
            const originalUserValue = review.user;
            review.user = {
              id: matchedUserId,
              originalValue: originalUserValue // giữ giá trị gốc để debug
            };
          }

          // Nếu user info có trong map, sử dụng để bổ sung thông tin
          if (userInfoMap.has(matchedUserId)) {
            const userInfo = userInfoMap.get(matchedUserId);
            if (!review.userName) review.userName = userInfo.userName;
            if (!review.fullName) review.fullName = userInfo.fullName;
            if (typeof review.user === 'object') {
              if (!review.user.username) review.user.username = userInfo.username;
              if (!review.user.fullName) review.user.fullName = userInfo.fullName;
            }

            // Lưu mapping vào localStorage để sử dụng cho lần sau
            try {
              const storedMappings = localStorage.getItem('reviewUserMappings') || '{}';
              const mappings = JSON.parse(storedMappings);

              // Lưu theo các trường khác nhau
              if (!mappings.username) mappings.username = {};
              if (!mappings.fullName) mappings.fullName = {};
              if (!mappings.userName) mappings.userName = {};

              if (review.user.username) mappings.username[review.user.username] = matchedUserId;
              if (review.user.fullName) mappings.fullName[review.user.fullName] = matchedUserId;
              if (review.userName) mappings.userName[review.userName] = matchedUserId;

              localStorage.setItem('reviewUserMappings', JSON.stringify(mappings));
              console.log(`Saved mapping to localStorage for future use`);
            } catch (e) {
              console.error('Error writing to localStorage:', e);
            }
          }

          console.log(`Review ${index}: Successfully assigned userId ${matchedUserId} and user info`);
        }
      }
    });

    // Third pass: Process each review with consistent user information
    const processedReviews = product.reviews?.map((review: any, index: number) => {
      console.log(`Processing review ${index} with ID ${review.id}`);

      // Extract user information
      let userId = null;
      let userInfo = null;
      let userName = null;
      let isAnonymous = review.anonymous || review.isAnonymous;

      // Determine userId - be exhaustive
      if (review.user && review.user.id) {
        userId = review.user.id.toString();
        console.log(`Review ${index}: Using userId ${userId} from user object`);
      } else if (review.userId) {
        userId = review.userId.toString();
        console.log(`Review ${index}: Using userId ${userId} from userId field`);
      }

      // VERY IMPORTANT: Nếu review không có userId, nhưng chúng ta biết nó thuộc về ai đó
      if (!userId && isAuthenticated && user) {
        // Kiểm tra các trường khác để xác định owner
        if (review.createdBy === user.username) {
          userId = user.id.toString();
          console.log(`Review ${index}: Found userId by matching createdBy with current user: ${userId}`);
        }
        // Thêm các kiểm tra khác nếu cần
      }

      // FIX CRITICAL: Đảm bảo mỗi review luôn có userId
      if (!userId) {
        // Tạo một userId cố định cho review này nếu không tìm thấy
        const reviewId = review.id || index;
        userId = `fixed-anonymous-${reviewId}`;
        console.log(`Review ${index}: Assigned fixed userId ${userId} to ensure userId exists`);

        // Cập nhật cả trong user object
        if (!review.user) {
          review.user = { id: userId };
        } else if (typeof review.user === 'object') {
          review.user.id = userId;
        } else {
          // Nếu user không phải là object, tạo object mới
          console.log(`Review ${index}: Converting user from ${typeof review.user} to object with value`, review.user);
          const originalUserValue = review.user;
          review.user = {
            id: userId,
            originalValue: originalUserValue // giữ giá trị gốc để debug
          };
        }

        // Đánh dấu là ẩn danh
        isAnonymous = true;
      }

      // Get user info from our map if available
      if (userId && userInfoMap.has(userId)) {
        userInfo = userInfoMap.get(userId);
        console.log(`Review ${index}: Found user info in map for ${userId}:`, userInfo);
      } else if (userId) {
        console.log(`Review ${index}: No user info in map for ${userId}`);
      }

      // Determine userName
      if (isAnonymous) {
        userName = "Người dùng ẩn danh";
        console.log(`Review ${index}: Anonymous review`);
      } else if (userInfo) {
        // Use the consistent user info we collected
        userName = userInfo.userName || userInfo.fullName || userInfo.username;
        console.log(`Review ${index}: Using stored user info: ${userName}`);
      } else if (review.user && review.user.fullName) {
        userName = review.user.fullName;
        console.log(`Review ${index}: Using fullName from user object: ${userName}`);
      } else if (review.userName && review.userName !== "Không xác định") {
        userName = review.userName;
        console.log(`Review ${index}: Using userName directly: ${userName}`);
      } else if (review.fullName) {
        userName = review.fullName;
        console.log(`Review ${index}: Using fullName directly: ${userName}`);
      } else if (review.user && review.user.username) {
        userName = review.user.username;
        console.log(`Review ${index}: Using username from user object: ${userName}`);
      } else if (review.username) {
        userName = review.username;
        console.log(`Review ${index}: Using username directly: ${userName}`);
      } else if (userId && isAuthenticated && user && user.id.toString() === userId) {
        userName = user.fullName || user.username || `Người dùng ${userId}`;
        console.log(`Review ${index}: Using current user's name: ${userName}`);
      } else {
        // Nếu không có thông tin người dùng, sử dụng userId làm tên hiển thị
        userName = isAnonymous ? "Người dùng ẩn danh" : `Người dùng ${userId.substring(0, 8)}`;
        console.log(`Review ${index}: Using generated name from userId: ${userName}`);
      }

      console.log(`Review ${index} final: userName=${userName}, userId=${userId}`);

      // Tạo review mới với thông tin được xử lý
      const processedReview = {
        ...review,
        userName: userName,
        userId: userId, // Đảm bảo luôn có userId
        fullName: userName, // Đảm bảo cả fullName và userName đều có giá trị giống nhau
        user: typeof review.user === 'object' ? {
          ...(userInfo || {}),
          ...review.user,
          id: userId, // Đảm bảo user.id cũng tồn tại và trùng khớp
          fullName: userName // Đảm bảo user.fullName cũng được thiết lập
        } : { id: userId, fullName: userName }, // Nếu user không phải object, tạo object mới
        isAnonymous: isAnonymous || false
      };

      return processedReview;
    }) || [];

    const processedProduct = {
      ...product,
      reviews: processedReviews,
      // Don't transform the URL here, let the image component handle it
      imageUrl: product.imageUrl || '',
      category: typeof product.category === 'object' ?
        (product.category ? (
          typeof product.category === 'object' && product.category !== null && 'name' in product.category
            ? (product.category as { name: string }).name
            : JSON.stringify(product.category)
        ) : '') :
        product.category,
      description: typeof product.description === 'object' ?
        JSON.stringify(product.description) :
        product.description
    };

    console.log(`Processed ${processedReviews.length} reviews successfully`);
    console.log('Review user names:', processedReviews.map((r: any) => ({
      id: r.id,
      userName: r.userName,
      userId: r.userId
    })));
    return processedProduct;
  };

  const fetchProduct = async () => {
    try {
      if (!productId) {
        setError('Product ID is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('Fetching product data for ID:', productId);

      const response = await ProductService.getProductById(productId as string);
      console.log('Raw product data received:', response.data);

      // Kiểm tra và sửa reviews thiếu userId trước khi xử lý
      if (response.data && response.data.reviews && Array.isArray(response.data.reviews)) {
        fixReviewsWithMissingUserId(response.data.reviews);
      }

      // Process the product to handle any object fields
      const processedProduct = processProduct(response.data);
      console.log('Product data processed successfully with', processedProduct.reviews?.length || 0, 'reviews');

      setProduct(processedProduct);

      // Check if product is in wishlist
      if (isAuthenticated) {
        try {
          const wishlistResponse = await WishlistService.checkInWishlist(productId as string);
          setInWishlist(wishlistResponse.data);
        } catch (err) {
          console.error('Error checking wishlist status:', err);
          setInWishlist(false);
        }
      } else {
        setInWishlist(false);
      }

      setError(null);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.response?.data?.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy đánh giá của người dùng hiện tại cho sản phẩm này
  const fetchUserReviews = async () => {
    if (!isAuthenticated || !productId || !user?.id) return;

    try {
      setLoadingUserReviews(true);
      console.log('Fetching user reviews for product:', productId);

      const response = await ProductService.getUserReviewsForProduct(productId as string);
      console.log('User reviews data:', response.data);

      if (Array.isArray(response.data)) {
        setUserReviews(response.data);
      }
    } catch (err) {
      console.error('Error fetching user reviews:', err);
    } finally {
      setLoadingUserReviews(false);
    }
  };

  // Thêm effect để lấy đánh giá người dùng khi sản phẩm hoặc user thay đổi
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserReviews();
    } else {
      setUserReviews([]);
    }
  }, [productId, isAuthenticated, user]);

  useEffect(() => {
    fetchProduct();
  }, [productId, isAuthenticated]);

  const handleQuantityChange = (value: number) => {
    if (product && value > 0 && value <= product.stock) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      // Always use our standardized image URL
      const imageUrl = getImageUrl(product);
      
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: imageUrl,
        quantity: quantity
      });
      setAddedToCart(true);
      setTimeout(() => {
        setAddedToCart(false);
      }, 3000);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      showSnackbar('Vui lòng đăng nhập để lưu sản phẩm yêu thích', 'error');
      setTimeout(() => {
        navigate('/login', { state: { from: `/products/${productId}` } });
      }, 1500);
      return;
    }

    try {
      if (inWishlist) {
        await WishlistService.removeFromWishlist(productId as string);
        setInWishlist(false);
        showSnackbar('Đã xóa khỏi danh sách yêu thích', 'success');
      } else {
        await WishlistService.addToWishlist(productId as string);
        setInWishlist(true);
        showSnackbar('Đã thêm vào danh sách yêu thích', 'success');
      }
    } catch (err: any) {
      console.error('Error updating wishlist:', err);
      if (err.message && err.message.includes('đăng nhập')) {
        showSnackbar(err.message, 'error');
        setTimeout(() => {
          navigate('/login', { state: { from: `/products/${productId}` } });
        }, 1500);
      } else {
        showSnackbar('Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.', 'error');
      }
    }
  };

  // Hàm xử lý sau khi đã thêm bình luận mới
  const handleReviewSubmitted = () => {
    console.log('Review submitted, refreshing product data');
    // Tải lại dữ liệu sản phẩm
    fetchProduct();
    // Tải lại reviews của người dùng
    fetchUserReviews();
  };

  // Hàm xử lý xóa bình luận
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) {
      return;
    }

    try {
      setSnackbarMessage('Đang xóa đánh giá...');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);

      console.log('Deleting review with ID:', reviewId);

      const response = await ProductService.deleteReview(reviewId);
      console.log('Delete review response:', response);

      showSnackbar('Đánh giá đã được xóa thành công', 'success');

      // Reload the product data and user reviews after a short delay
      setTimeout(() => {
        fetchProduct();
        fetchUserReviews();
      }, 500);
    } catch (err: any) {
      console.error('Error deleting review:', err);
      const errorMessage = err.response?.data?.message ||
        (err.message ? `Lỗi: ${err.message}` : 'Không thể xóa đánh giá');
      showSnackbar(errorMessage, 'error');
    }
  };

  const processReviews = useCallback((reviews: any[]) => {
    if (!reviews || !Array.isArray(reviews)) return [];

    return reviews.map(review => {
      // Ensure we have a valid user object
      const reviewUser = review.user || {};

      // Determine proper user name display
      let displayName = 'Người dùng ẩn danh';
      if (review.userName && review.userName !== 'Người dùng ẩn danh' && review.userName !== 'Không xác định') {
        displayName = review.userName;
      } else if (reviewUser.fullName) {
        displayName = reviewUser.fullName;
      } else if (reviewUser.username) {
        displayName = reviewUser.username;
      } else if (review.fullName) {
        displayName = review.fullName;
      } else if (review.username) {
        displayName = review.username;
      }

      // Create a safe date display value
      let displayDate = 'Ngày không xác định';
      if (typeof review.date === 'string' && review.date) {
        displayDate = new Date(review.date).toLocaleDateString('vi-VN');
      } else if (typeof review.createdAt === 'string' && review.createdAt) {
        displayDate = new Date(review.createdAt).toLocaleDateString('vi-VN');
      }

      return {
        ...review,
        user: {
          id: reviewUser.id || review.userId || 'unknown',
          name: displayName
        },
        displayDate,
        displayName
      };
    });
  }, []);

  useEffect(() => {
    if (product && product.reviews) {
      setProcessedReviews(processReviews(product.reviews));
    }
  }, [product, processReviews]);

  // Handle marking a review as helpful or not helpful
  const handleMarkHelpful = async (reviewId: string, isHelpful: boolean) => {
    try {
      await ProductService.markReviewHelpful(reviewId, isHelpful);
      // Refresh the product data to update the helpful counts
      fetchProduct();
      if (isHelpful) toast.success(`Đã đánh giá bài review là hữu ích`);
      else toast.success(`Đã đánh giá bài review là không hữu ích`);
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      toast.error('Không thể đánh giá bài review. Vui lòng thử lại sau.');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Skeleton variant="text" height={60} />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" height={40} />
              <Skeleton variant="text" height={100} />
              <Skeleton variant="rectangular" height={50} width="80%" />
              <Skeleton variant="rectangular" height={50} />
            </Stack>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Không tìm thấy sản phẩm'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/products')}>
          Quay lại danh sách sản phẩm
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {addedToCart && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Đã thêm sản phẩm vào giỏ hàng thành công!
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Product Image */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, position: 'relative' }}>
            <IconButton
              onClick={handleToggleWishlist}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                },
                zIndex: 1,
              }}
              color={inWishlist ? 'error' : 'default'}
              aria-label="add to favorites"
            >
              {inWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <Box sx={{ position: 'relative', width: '100%', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box
                component="img"
                src={getImageUrl(product)}
                alt={product.name}
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
                onError={(e) => {
                  console.log("Image failed to load");
                  // Just log the error - server will return a default image
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Product Details */}
        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {product.name}
            </Typography>

            <Box display="flex" alignItems="center" mb={2}>
              <Rating value={product.rating} precision={0.1} readOnly />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({product.reviews.length} đánh giá)
              </Typography>
            </Box>

            <Typography variant="h5" color="primary" gutterBottom>
              {formatCurrency(product.price)}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body1" paragraph>
              {product.description}
            </Typography>

            <Box display="flex" alignItems="center" mb={3}>
              <Chip
                label={product.stock > 0 ? `Còn hàng (${product.stock} sản phẩm)` : 'Hết hàng'}
                color={product.stock > 0 ? 'success' : 'error'}
                variant="outlined"
                sx={{ mr: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Danh mục: {product.category}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mr: 2 }}>
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                  disabled={product.stock === 0}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>

                <TextField
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value)) handleQuantityChange(value);
                  }}
                  InputProps={{
                    inputProps: { min: 1, max: product.stock },
                    disableUnderline: true,
                  }}
                  disabled={product.stock === 0}
                  variant="standard"
                  size="small"
                  sx={{
                    width: 50,
                    input: { textAlign: 'center' },
                    '& .MuiInputBase-input': { p: 0.5 }
                  }}
                />

                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(Math.min(product.stock, quantity + 1))}
                  disabled={product.stock === 0 || quantity >= product.stock}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              <Button
                variant="contained"
                startIcon={<CartIcon />}
                disabled={product.stock === 0}
                onClick={handleAddToCart}
                sx={{ mr: 1 }}
              >
                Thêm Vào Giỏ Hàng
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={inWishlist ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                onClick={handleToggleWishlist}
                sx={{ mr: 1 }}
              >
                {inWishlist ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Product Tabs */}
      <Box sx={{ width: '100%', mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="product tabs">
            <Tab label="Mô Tả" id="product-tab-0" />
            <Tab label="Đánh Giá" id="product-tab-1" />
            <Tab label="Vận Chuyển & Đổi Trả" id="product-tab-2" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <Typography variant="body1" paragraph>
            {typeof product.description === 'object' ?
              JSON.stringify(product.description) :
              product.description}
          </Typography>
          <Typography variant="body1" paragraph>
            {product.name} được thiết kế để đáp ứng mọi nhu cầu của bạn. Sản phẩm mang đến hiệu suất vượt trội, thiết kế sang trọng, và giá trị đồng tiền tuyệt vời.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Tính năng nổi bật:
          </Typography>
          <ul>
            <li>Chất lượng cao và vật liệu bền bỉ</li>
            <li>Hiệu suất vượt trội</li>
            <li>Bảo hành mở rộng</li>
            <li>Hỗ trợ khách hàng 24/7</li>
          </ul>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Đánh giá từ khách hàng
          </Typography>

          {processedReviews.length > 0 ? (
            processedReviews.map((review, index) => (
              <Paper key={review.id || index} elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {review.displayName || review.user?.name || 'Người dùng ẩn danh'}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {review.displayDate}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Button
                      size="small"
                      color={review.isHelpful ? "primary" : "inherit"}
                      startIcon={<ThumbUpIcon />}
                      onClick={() => handleMarkHelpful(review.id, true)}
                      sx={{
                        minWidth: 'auto',
                        '& .MuiButton-startIcon': { margin: 0 }
                      }}
                    >
                      <Typography variant="body2" sx={{ ml: 0.5 }}>
                        {review.helpfulCount || 0}
                      </Typography>
                    </Button>
                    <Button
                      size="small"
                      color={review.isHelpful === false ? "primary" : "inherit"}
                      startIcon={<ThumbDownIcon />}
                      onClick={() => handleMarkHelpful(review.id, false)}
                      sx={{
                        ml: 1,
                        minWidth: 'auto',
                        '& .MuiButton-startIcon': { margin: 0 }
                      }}
                    >
                      <Typography variant="body2" sx={{ ml: 0.5 }}>
                        {review.notHelpfulCount || 0}
                      </Typography>
                    </Button>
                    {isAuthenticated && user && (review.userId === user.id?.toString() || review.user?.id === user.id?.toString()) && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteReview(review.id)}
                        sx={{ ml: 1 }}
                        title="Xóa bình luận của bạn"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <Typography variant="body1" paragraph sx={{ mt: 1 }}>
                  {review.comment || review.content}
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="flex-end" sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {review.helpfulCount || 0} người thấy hữu ích • {review.notHelpfulCount || 0} người không thấy hữu ích
                  </Typography>
                </Box>
              </Paper>
            ))
          ) : (
            <Typography variant="body1" color="text.secondary">
              Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
            </Typography>
          )}

          {/* Form đánh giá sản phẩm */}
          <Box mt={4}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Viết đánh giá của bạn
            </Typography>
            <ReviewForm
              productId={productId as string}
              onReviewSubmitted={handleReviewSubmitted}
              reviews={product.reviews}
              onDeleteReview={handleDeleteReview}
            />
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Thông Tin Vận Chuyển
          </Typography>
          <Typography variant="body1" paragraph>
            Chúng tôi cung cấp các phương thức vận chuyển sau:
          </Typography>
          <ul>
            <li>Vận chuyển tiêu chuẩn (3-5 ngày làm việc): Miễn phí cho đơn hàng trên 1.200.000đ</li>
            <li>Vận chuyển nhanh (1-2 ngày làm việc): 200.000đ</li>
            <li>Giao hàng trong ngày: 350.000đ</li>
          </ul>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Chính Sách Đổi Trả
          </Typography>
          <Typography variant="body1" paragraph>
            Chúng tôi chấp nhận đổi trả trong vòng 30 ngày kể từ ngày mua. Sản phẩm phải còn nguyên trạng với đầy đủ nhãn mác và bao bì.
          </Typography>
          <Typography variant="body1">
            Để biết thêm chi tiết, vui lòng tham khảo chính sách đổi trả đầy đủ của chúng tôi.
          </Typography>
        </TabPanel>
      </Box>

      {/* Related Products */}
      <Box mt={6}>
        <TopProducts title="Sản Phẩm Tương Tự" maxItems={4} />
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductDetail; 