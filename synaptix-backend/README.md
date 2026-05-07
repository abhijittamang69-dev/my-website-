# 🚀 Synaptix Solutions Ltd - Full Backend

Complete Node.js/Express backend for Synaptix Solutions Ltd website with MongoDB, payment integrations (Khalti & eSewa), and admin dashboard API.

---

## 📁 Project Structure

```
synaptix-backend/
├── config/
│   └── db.js                 # MongoDB connection
├── middleware/
│   ├── auth.js               # JWT authentication & admin check
│   ├── errorHandler.js       # Global error handling
│   └── validator.js          # Request validation
├── models/
│   ├── Product.js            # Product schema
│   ├── Order.js              # Order schema
│   ├── Booking.js            # Booking schema
│   ├── User.js               # User schema
│   ├── Contact.js            # Contact form schema
│   ├── Payment.js            # Payment tracking schema
│   └── index.js              # Model exports
├── routes/
│   ├── auth.js               # Authentication routes
│   ├── products.js           # Product CRUD
│   ├── orders.js             # Order management
│   ├── bookings.js           # Booking management
│   ├── payments.js           # Khalti & eSewa integration
│   ├── dashboard.js          # Analytics & statistics
│   ├── contacts.js           # Contact form submissions
│   └── users.js              # User management
├── utils/
│   └── seed.js               # Database seeding
├── public/                   # Frontend HTML/CSS/JS files
│   ├── index.html
│   ├── products.html
│   ├── booking.html
│   ├── admin.html
│   ├── script.js
│   └── style.css
├── .env.example              # Environment variables template
├── package.json
└── server.js                 # Main server entry
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ 
- **MongoDB** (Local or Atlas)
- **npm** or **yarn**

### 2. Installation

```bash
# Clone or extract the backend folder
cd synaptix-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 3. Environment Variables

Create a `.env` file with:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB (Get from MongoDB Atlas or use local)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/synaptix?retryWrites=true&w=majority

# JWT Secret (generate: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key

# Admin Password
ADMIN_PASSWORD=Abhijit@2

# Khalti (Get from https://khalti.com/merchant/)
KHALTI_SECRET_KEY=test_secret_key_xxxxxxxxxxxxxxxx
KHALTI_PUBLIC_KEY=test_public_key_xxxxxxxxxxxxxxxx
KHALTI_API_URL=https://dev.khalti.com/api/v2

# eSewa (Get from https://esewa.com.np/)
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_API_URL=https://rc-epay.esewa.com.np

# Frontend URL
FRONTEND_URL=http://localhost:5000
```

### 4. Seed Database

```bash
# Seed products and admin user
npm run seed
```

This creates:
- 12 sample security products
- Admin user: `admin@synaptix.com` / password from `.env`

### 5. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/admin-login` | Admin password check |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products (with filters) |
| GET | `/api/products/featured` | Get featured products |
| GET | `/api/products/categories` | Get categories with counts |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product (Admin) |
| PATCH | `/api/products/:id` | Update product (Admin) |
| DELETE | `/api/products/:id` | Delete product (Admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders (Admin) |
| GET | `/api/orders/:id` | Get single order |
| POST | `/api/orders` | Create new order |
| PATCH | `/api/orders/:id` | Update order status |
| DELETE | `/api/orders/:id` | Delete order |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List bookings (Admin) |
| GET | `/api/bookings/:id` | Get single booking |
| POST | `/api/bookings` | Create new booking |
| PATCH | `/api/bookings/:id` | Update booking status |
| DELETE | `/api/bookings/:id` | Delete booking |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/khalti/initiate` | Initiate Khalti payment |
| GET | `/api/payment/khalti/verify` | Khalti callback |
| POST | `/api/payment/khalti/verify` | Verify Khalti payment |
| POST | `/api/payment/esewa/initiate` | Initiate eSewa payment |
| GET | `/api/payment/esewa/verify` | eSewa callback |
| GET | `/api/payment/esewa/failed` | eSewa failure |
| GET | `/api/payment/status/:orderId` | Check payment status |

### Dashboard (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Full dashboard stats |
| GET | `/api/dashboard/summary` | Quick summary |
| GET | `/api/dashboard/revenue` | Revenue analytics |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts (Admin) |
| POST | `/api/contacts` | Submit contact form |
| PATCH | `/api/contacts/:id` | Update status |
| DELETE | `/api/contacts/:id` | Delete contact |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| GET | `/api/users/:id` | Get user |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

---

## 💳 Payment Integration

### Khalti Setup
1. Register at [khalti.com](https://khalti.com/)
2. Get your **Secret Key** and **Public Key** from Merchant Dashboard
3. Add to `.env`:
   ```env
   KHALTI_SECRET_KEY=live_secret_key_xxx
   KHALTI_PUBLIC_KEY=live_public_key_xxx
   KHALTI_API_URL=https://khalti.com/api/v2
   ```

### eSewa Setup
1. Register at [esewa.com.np](https://esewa.com.np/)
2. Get your **Merchant ID** and **Secret Key**
3. Add to `.env`:
   ```env
   ESEWA_MERCHANT_ID=your_merchant_id
   ESEWA_SECRET_KEY=your_secret_key
   ESEWA_API_URL=https://epay.esewa.com.np
   ```

---

## 🗄️ Database Models

### Product
- `name`, `description`, `price`
- `icon`, `badge`, `category`
- `inStock`, `stockQuantity`
- `images`, `specifications`
- `featured`, `views`, `sales`

### Order
- `orderId` (unique)
- `customer` (name, phone, email, address)
- `items[]` (product references)
- `total`, `paymentMethod`, `paymentStatus`
- `status`, `shipping`, `timeline`

### Booking
- `bookingId` (unique)
- `name`, `phone`, `email`, `address`
- `service`, `property`, `date`, `time`
- `status`, `assignedTo`, `estimatedCost`
- `timeline`

### User
- `name`, `email`, `phone`, `password`
- `role` (admin/supervisor/employee/customer)
- `avatar`, `isActive`, `permissions`
- `loginHistory`

---

## 🔒 Security Features

- ✅ **Helmet.js** - Security headers
- ✅ **CORS** - Configured for your domain
- ✅ **Rate Limiting** - 100 req/15min, 10 auth attempts
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcrypt with salt rounds 12
- ✅ **Input Validation** - express-validator
- ✅ **MongoDB Injection Protection** - Mongoose sanitization
- ✅ **Error Handling** - No stack traces in production

---

## 🚀 Deployment

### Render (Recommended - Free)
1. Push to GitHub
2. Connect repo to [Render](https://render.com)
3. Add environment variables in Render Dashboard
4. Set build command: `npm install && npm run seed`
5. Set start command: `npm start`

### MongoDB Atlas
1. Create cluster at [mongodb.com](https://mongodb.com)
2. Create database user
3. Whitelist IP `0.0.0.0/0` (or Render's IPs)
4. Copy connection string to `MONGODB_URI`

---

## 📝 License

MIT License - Synaptix Solutions Ltd

---

## 👨‍💻 Developer

**Abhijit Tamang**  
Founder & Lead Developer  
Synaptix Solutions Ltd, Nepal

📞 +977-9865057546  
📧 info@synaptixsolutions.com
