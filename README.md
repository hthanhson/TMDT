# TMDT E-Commerce Application

A comprehensive e-commerce platform with modern features including user authentication, product management, shopping cart, order processing, reviews, wishlists, loyalty points, and recommendations.

## Features

### User Features
- User registration and authentication with JWT
- User profiles and address management
- Product browsing with search and filtering
- Shopping cart functionality
- Order placement and tracking
- Product reviews and ratings
- Wishlists
- Loyalty points and tier system
- Coupon application
- Notification system
- Payment integration

### Admin Features
- Product management (CRUD)
- Order management and tracking
- User management
- Category management
- Coupon management
- Loyalty tier management
- Analytics dashboard

## Tech Stack

### Backend
- Java Spring Boot
- Spring Security with JWT Authentication
- Spring Data JPA
- MySQL Database
- Maven

### Frontend
- React
- Redux for state management
- React Router
- Axios for API communication
- Material-UI components

## Getting Started

### Prerequisites
- Java JDK 17 or higher
- Node.js and npm
- MySQL Server

### Running with Docker
The easiest way to get started is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/tmdt-ecommerce.git
cd tmdt-ecommerce

# Start all services using Docker Compose
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api

### Running Locally

#### Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## API Documentation
API documentation is available at `http://localhost:8080/swagger-ui.html` when the backend is running.

## Database Schema
The database schema includes the following main entities:
- Users
- Products
- Categories
- Orders
- OrderItems
- Reviews
- Wishlists
- Coupons
- UserPoints
- LoyaltyTiers
- Notifications

## Authentication
The application uses JWT (JSON Web Tokens) for authentication. All protected routes require a valid JWT token sent in the Authorization header.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request. 