# TMDT Frontend

Frontend cho ứng dụng thương mại điện tử được phát triển với React và TypeScript.

## Cấu trúc

```
frontend/
├── src/
│   ├── assets/       # Hình ảnh, icon và tài nguyên tĩnh khác
│   ├── components/   # Các component có thể tái sử dụng
│   ├── contexts/     # Context API cho quản lý state
│   ├── hooks/        # Custom React hooks
│   ├── pages/        # Các trang chính
│   ├── services/     # API services
│   ├── types/        # TypeScript interfaces
│   ├── utils/        # Tiện ích và helpers
│   ├── App.tsx
│   └── index.tsx
├── package.json
└── tsconfig.json
```

## Công nghệ sử dụng

- React
- TypeScript
- Material-UI
- React Router
- Axios
- Swiper
- Context API

## Cài đặt và chạy

1. Cài đặt dependencies:
```
npm install
```

2. Chạy ứng dụng:
```
npm start
```

3. Build sản phẩm:
```
npm run build
```

## Tính năng đã phát triển

1. Authentication (Đăng nhập/Đăng ký)
2. Hiển thị sản phẩm (danh sách, chi tiết, top sản phẩm)
3. Giỏ hàng (thêm, xóa, cập nhật)
4. Chatbot hỗ trợ khách hàng
5. Layout chung và responsive 