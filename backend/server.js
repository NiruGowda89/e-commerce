const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/db');
const seed = require('./config/seed');

// Import controllers
const authController = require('./controllers/authController');
const productController = require('./controllers/productController');
const cartController = require('./controllers/cartController');
const orderController = require('./controllers/orderController');
const couponController = require('./controllers/couponController');
const reviewController = require('./controllers/reviewController');
const paymentController = require('./controllers/paymentController');
const adminController = require('./controllers/adminController');

// Import middleware
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'UP' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// 1. Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/forgot-password', authController.forgotPassword);

// 2. Products routes (Public read, ADMIN/SUPER_ADMIN write)
app.get('/api/products', productController.getAllProducts);
app.get('/api/products/filter', productController.filterProducts);
app.get('/api/products/:id', productController.getProductById);
app.post('/api/products', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), productController.createProduct);
app.put('/api/products/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), productController.updateProduct);
app.delete('/api/products/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), productController.deleteProduct);

// 3. Cart routes (requires authenticated user)
app.post('/api/cart/add', cartController.addToCart);
app.get('/api/cart/:userId', cartController.getCart);
app.delete('/api/cart/remove/:cartId', cartController.removeFromCart);

// 4. Order routes (specific routes MUST come before parameterized ones)
app.post('/api/order/place', orderController.placeOrder);
app.get('/api/order/all', orderController.getAllOrders);
app.get('/api/order/status/:status', orderController.getOrdersByStatus);
app.get('/api/order/:userId', orderController.getOrdersByUser);
app.put('/api/order/:orderId/status', orderController.updateOrderStatus);

// 5. Coupon routes (User validation, Admin editing)
app.post('/api/coupons/validate', couponController.validateCoupon);
app.get('/api/coupons', couponController.getAllCoupons);
app.post('/api/coupons', couponController.createCoupon);
app.delete('/api/coupons/:id', couponController.deleteCoupon);

// 6. Review routes
app.get('/api/reviews/product/:productId', reviewController.getProductReviews);
app.post('/api/reviews', reviewController.addReview);
app.delete('/api/reviews/:reviewId', reviewController.deleteReview);

// 7. Payment routes
app.post('/api/payment/create-order', paymentController.createOrder);
app.post('/api/payment/verify', paymentController.verifyPayment);

// 8. Admin / Super Admin routes
app.get('/api/admin/users', adminController.getAllUsers);
app.put('/api/admin/users/:userId/status', adminController.toggleUserStatus);
app.put('/api/admin/users/:userId/role', adminController.updateUserRole);
app.put('/api/admin/users/role', adminController.updateUserRoleByEmail);

// ─── Static files ─────────────────────────────────────────────────────────────
// Always serve the React/Vite production build
// In Docker: /app is backend/, /frontend/dist is the built React app
// Locally:   __dirname is backend/, ../Frontend/dist is the built React app
const reactBuildPath = path.join(__dirname, '../Frontend/dist');

app.use(express.static(reactBuildPath));
// SPA fallback — send index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/health') return next();
  res.sendFile(path.join(reactBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).json({
        message: "Karunada E-commerce API is running successfully.",
        status: "UP",
        info: "This is the backend service. To view the storefront, access your deployed Frontend service URL."
      });
    }
  });
});

// ─── Database Sync & Server Start ─────────────────────────────────────────────
sequelize.sync({ force: false })
  .then(async () => {
    console.log('MySQL Database Connected and Synchronized.');
    // Modify column type for image_url to handle long base64 strings
    try {
      await sequelize.query("ALTER TABLE products MODIFY COLUMN image_url LONGTEXT;");
      console.log('Altered products.image_url column to LONGTEXT.');
    } catch (e) {
      console.error('Failed to alter products.image_url column:', e.message);
    }
    // Seed default products
    await seed();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
    console.warn('Proceeding to start the server without a successful DB sync. Static frontend will still be served.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} (DB not connected)`);
    });
  });
