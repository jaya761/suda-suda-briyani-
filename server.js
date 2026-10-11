require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'suda-suda-briyani-jwt-secret-key-2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage for Food Images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E4);
    cb(null, `${cleanBase}_${uniqueSuffix}${ext || '.jpg'}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only food images (JPEG, PNG, WEBP) are allowed.'));
  }
});

// Admin JWT Authentication Middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Admin authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin privileges required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session expired or invalid token.' });
  }
}

// ==========================================
// PUBLIC RESTAURANT CONFIGURATION API
// ==========================================

app.get('/api/config', (req, res) => {
  res.json({
    restaurantName: 'SUDA SUDA BRIYANI',
    phone: '9345372744',
    whatsappNumber: '9345372744',
    whatsappUrl: 'https://wa.me/919345372744',
    addressDisplay: 'Authentic South Indian Biryani • Tamil Nadu Kitchen',
    razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    supabaseConfigured: db.isSupabaseConfigured()
  });
});

// ==========================================
// MENU APIS
// ==========================================

// Public Menu items endpoint
app.get('/api/menu', async (req, res) => {
  try {
    const { category, search } = req.query;
    const items = await db.getMenuItems({ category, search });
    res.json(items);
  } catch (err) {
    console.error('Menu fetch error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to load menu items.' });
  }
});

// Admin All Menu items endpoint (including stock status)
app.get('/api/menu/admin', authenticateAdmin, async (req, res) => {
  try {
    const items = await db.getAllMenuItemsAdmin();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to load admin menu.' });
  }
});

// Admin Add New Dish
app.post('/api/menu', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, price, category, image_url, available, is_veg } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Dish name, price and category are required.' });
    }

    const newItem = await db.createMenuItem({
      name,
      description,
      price: parseFloat(price),
      category,
      image_url: image_url || '/images/biryani_hero.jpg',
      available: available !== undefined ? Boolean(available) : true,
      is_veg: Boolean(is_veg)
    });

    res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    console.error('Create dish error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create menu item.' });
  }
});

// Admin Edit Dish
app.put('/api/menu/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await db.updateMenuItem(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Dish not found.' });
    }
    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update dish.' });
  }
});

// Admin Toggle Availability (In Stock / Out of Stock)
app.patch('/api/menu/:id/availability', authenticateAdmin, async (req, res) => {
  try {
    const { available } = req.body;
    const updated = await db.updateAvailability(req.params.id, available);
    if (!updated) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Dish not found.' });
    }
    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update availability.' });
  }
});

// Admin Delete Dish
app.delete('/api/menu/:id', authenticateAdmin, async (req, res) => {
  try {
    const success = await db.deleteMenuItem(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Dish not found or already removed.' });
    }
    res.json({ success: true, message: 'Dish successfully deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete dish.' });
  }
});

// Food Image Upload Endpoint
app.post('/api/upload', authenticateAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'NO_FILE', message: 'No image file uploaded.' });
  }
  const publicUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: publicUrl });
});

// ==========================================
// CUSTOMER ORDER APIS
// ==========================================

// Create new customer order (COD or Online)
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, phone, address, landmark, notes, items, payment_method } = req.body;

    // Field Validations
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Customer Name is required.' });
    }
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Please enter a valid 10-digit mobile number.' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Delivery address is required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'EMPTY_CART', message: 'Cart cannot be empty. Please add items to order.' });
    }

    const order = await db.createOrder({
      customer_name,
      phone: cleanPhone,
      address,
      landmark,
      notes,
      items,
      payment_method: payment_method || 'CASH ON DELIVERY'
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'ORDER_FAILED', message: 'Could not place order. Please try again or order via WhatsApp.' });
  }
});

// Customer Order Lookup (Order Success Page)
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found.' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve order details.' });
  }
});

// ==========================================
// SECURE RAZORPAY PAYMENT FLOW
// ==========================================

app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Order ID is required.' });
    }

    const order = await db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found.' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes('rzp_test_placeholder')) {
      return res.status(400).json({
        error: 'RAZORPAY_NOT_CONFIGURED',
        message: 'Razorpay keys are not configured on this server. Please choose Cash on Delivery or WhatsApp Order, or configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.'
      });
    }

    // Initialize Razorpay SDK
    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const amountInPaise = Math.round(Number(order.total_amount) * 100);

    const razorpayOrder = await rzp.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.order_number || order.id,
      notes: {
        customer_name: order.customer_name,
        phone: order.phone
      }
    });

    res.json({
      success: true,
      keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
      orderNumber: order.order_number,
      customer: {
        name: order.customer_name,
        phone: order.phone
      }
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({ error: 'PAYMENT_INITIATION_FAILED', message: err.message || 'Payment initiation failed.' });
  }
});

// Verify Razorpay Payment Signature
app.post('/api/razorpay/verify', async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Missing payment verification credentials.' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ error: 'SERVER_MISCONFIGURED', message: 'Payment secret not configured on server.' });
    }

    // Verify HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.warn(`[Security Alert] Payment signature mismatch for Order ${orderId}`);
      await db.updatePaymentStatus(orderId, 'FAILED');
      return res.status(400).json({ error: 'VERIFICATION_FAILED', message: 'Payment signature verification failed.' });
    }

    // Signature verified! Mark order as PAID
    const updatedOrder = await db.updatePaymentStatus(orderId, 'PAID', { payment_method: 'ONLINE' });
    await db.updateOrderStatus(orderId, 'CONFIRMED');

    await db.createPaymentRecord({
      order_id: orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: updatedOrder ? updatedOrder.total_amount : 0,
      payment_method: 'ONLINE',
      payment_status: 'PAID'
    });

    res.json({
      success: true,
      message: 'Payment verified successfully and order confirmed.',
      order: updatedOrder
    });
  } catch (err) {
    console.error('Razorpay verification error:', err);
    res.status(500).json({ error: 'VERIFICATION_ERROR', message: 'Payment verification failed.' });
  }
});

// ==========================================
// ADMIN DASHBOARD & ORDER MANAGEMENT
// ==========================================

// Admin Login
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Username and password are required.' });
    }

    const adminUser = await db.verifyAdminUser(username, password);
    if (!adminUser) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid admin username or password.' });
    }

    const token = jwt.sign(
      { id: adminUser.id, username: adminUser.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Authentication error.' });
  }
});

// Admin Verify Session
app.get('/api/admin/auth/me', authenticateAdmin, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Admin Dashboard KPI Stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch dashboard stats.' });
  }
});

// Admin All Orders
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    const orders = await db.getAllOrdersAdmin();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch orders.' });
  }
});

// Admin Update Order Status
app.patch('/api/admin/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await db.updateOrderStatus(req.params.id, status);
    if (!order) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found.' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: 'UPDATE_FAILED', message: err.message });
  }
});

// Admin Update Payment Status
app.patch('/api/admin/orders/:id/payment', authenticateAdmin, async (req, res) => {
  try {
    const { payment_status } = req.body;
    const order = await db.updatePaymentStatus(req.params.id, payment_status);
    if (!order) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found.' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: 'UPDATE_FAILED', message: err.message });
  }
});

// Fallback HTML routing for clean URLs
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

app.use((req, res) => {
  // If it's an API route that wasn't caught, return 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Export app for Vercel serverless functions
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  SUDA SUDA BRIYANI SERVER RUNNING`);
    console.log(`  Customer Portal: http://localhost:${PORT}`);
    console.log(`  Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`  Admin Login:     http://localhost:${PORT}/admin/login`);
    console.log(`  WhatsApp Hotline: 9345372744`);
    console.log(`=======================================================`);
  });
}
