# ShopEase - E-commerce Platform

A comprehensive e-commerce platform built with React, TypeScript, Node.js, Express, and MongoDB. This project features a modern, responsive design with full-featured shopping cart, user authentication, admin dashboard, and more.

## 🚀 Features

### Frontend (React + TypeScript)
- **Modern UI/UX**: Built with Tailwind CSS and responsive design
- **Product Catalog**: Browse products with advanced filtering and search
- **Shopping Cart**: Add/remove items, apply coupons, calculate totals
- **User Authentication**: Login, registration, profile management
- **Order Management**: View order history and track orders
- **Admin Dashboard**: Manage products, orders, and users
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### Backend (Node.js + Express)
- **RESTful API**: Well-structured API endpoints
- **Authentication**: JWT-based authentication with role-based access
- **Database**: MongoDB with Mongoose ODM
- **Security**: Rate limiting, input validation, CORS protection
- **File Upload**: Image upload with Cloudinary integration
- **Payment Processing**: Stripe integration for secure payments
- **Email Notifications**: Order confirmations and updates

### Database Models
- **Users**: Customer and admin user management
- **Products**: Comprehensive product catalog with variants
- **Categories**: Hierarchical category structure
- **Orders**: Complete order management with status tracking
- **Cart**: Persistent shopping cart functionality

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- React Query for data fetching
- Tailwind CSS for styling
- Lucide React for icons
- React Hook Form for form handling
- React Hot Toast for notifications

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Express Validator for input validation
- Multer for file uploads
- Stripe for payment processing
- Nodemailer for email notifications

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-platform
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `server` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:3000
   
   # Cloudinary (optional)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Stripe (optional)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # Email (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## 🎯 Usage

### Demo Credentials

**Admin Account:**
- Email: admin@example.com
- Password: password123

**Regular User:**
- Email: user@example.com
- Password: password123

### Key Features

1. **Browse Products**: Visit `/products` to see the product catalog
2. **User Registration**: Create an account at `/register`
3. **Shopping Cart**: Add items to cart and proceed to checkout
4. **Admin Panel**: Access admin features at `/admin` (admin users only)

## 📁 Project Structure

```
ecommerce-platform/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.tsx
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── config/            # Configuration files
│   ├── index.js           # Server entry point
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run build` - Build the frontend for production
- `npm start` - Start the production server

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

#### Products
- `GET /api/products` - Get all products with filtering
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

#### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove cart item

#### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status (admin)

## 🚀 Deployment

### Backend Deployment
1. Set up a MongoDB Atlas database
2. Deploy to platforms like Heroku, DigitalOcean, or AWS
3. Update environment variables in production
4. Configure CORS for your frontend domain

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to platforms like Netlify, Vercel, or AWS S3
3. Update API endpoints to point to your production backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Contact the development team

## 🔮 Future Enhancements

- [ ] Advanced product filtering and search
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Social media integration
- [ ] Advanced inventory management
- [ ] Email marketing integration
- [ ] Advanced reporting features

---

Built with ❤️ using modern web technologies
