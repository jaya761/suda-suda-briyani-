# 🍲 SUDA SUDA BRIYANI - RESTAURANT ORDERING SYSTEM

A complete, production-ready, authentic South Indian / Tamil Nadu restaurant ordering website built for **SUDA SUDA BRIYANI** (`Helpline / WhatsApp: 9345372744`).

Designed specifically for South Indian culinary authenticity with warm deep red, maroon, dark brown, cream, and subtle gold tones. Built mobile-first with fast loading times, zero bloated CSS frameworks, and a secure backend architecture supporting **Supabase PostgreSQL**, **Razorpay Payments**, **WhatsApp Direct Ordering**, and a **Real-Time Admin Management Portal**.

---

## 🌟 Key Features

### 🍛 1. Customer Website
- **Authentic South Indian Aesthetics**: Designed in Tamil Nadu restaurant visual style (deep red `#8b181b`, dark roasted brown `#33180e`, cream `#fbf7f0`, and subtle gold `#c88e28`).
- **Dynamic Menu System**: Real-time menu fetched from the database with category tabs (`BIRYANI`, `STARTERS`, `SOUTH INDIAN SPECIALS`, `MEALS`, `COMBOS`, `BEVERAGES`), Veg/Non-Veg badges, descriptions, and prices.
- **Search & Filters**: Instant live dish search and category pills.
- **Out of Stock Handling**: When a dish is marked out of stock by admin, it remains visible with an "Out of Stock" badge and disabled cart button.
- **Interactive Cart & Drawer**: Add items, increase/decrease quantities, item deletion, subtotal calculation, and delivery fee calculation (₹40, free for orders above ₹500).
- **Mobile-First Experience**:
  - Sticky bottom cart bar on mobile showing item count & total.
  - Floating WhatsApp quick-action button (`9345372744`).
  - Hamburger mobile navigation.
  - Large touch-friendly buttons.
- **Checkout**:
  - Validates customer name, 10-digit mobile number, address, and landmark.
  - Choose between **Cash on Delivery (COD)**, **Pay Online (Razorpay)**, and **Order via WhatsApp**.
- **Instant WhatsApp Order Generator**: Formats a complete order parcel message with items, quantities, subtotal, delivery, and address directly sent to `https://wa.me/919345372744`.
- **Order Success Page**: Shows generated Order ID (`#SSB-...`), customer name, item summary, verified payment status, and order status.

---

### 🔐 2. Admin Management Portal (`/admin` & `/admin/login`)
- **Secure Authentication**: Protected by JWT session tokens, bcrypt password hashing, and server-side route guards.
- **Dashboard KPI Metrics**:
  - Total Orders
  - Today's Orders
  - Pending Orders
  - Completed Orders
  - Total Sales (₹)
- **Order Management**:
  - Filter by status (`PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `OUT FOR DELIVERY`, `DELIVERED`, `CANCELLED`).
  - Click-to-call (`tel:...`) and click-to-WhatsApp for every customer.
  - Status progression dropdowns with instant database persistence.
  - Payment status updater (`PENDING`, `PAID`, `FAILED`).
- **Menu Management**:
  - **Add New Dish**: Modal form to add dish name, category, price, description, and upload food images.
  - **Edit Dish**: Change dish name, category, price (e.g. ₹180 → ₹200), description, image, or stock status. Customer website updates automatically without editing code!
  - **Delete Dish**: Two-step confirmation modal with CANCEL and DELETE buttons.
  - **Instant Stock Toggle**: One-click switch between *In Stock* and *Out of Stock*.
- **Payment History**: Detailed transaction table showing order IDs, amounts, payment methods, and statuses.
- **System Settings**: Overview of restaurant phone numbers, delivery charges, and database/payment gateway connection health.

---

### 💳 3. Secure Razorpay Online Payment Flow
- **Server-Side Security**: Razorpay secret keys are **never** exposed in frontend code.
- **Tamper-Proof Totals**: Order amounts are verified and calculated on the server from active database menu prices.
- **HMAC-SHA256 Signature Verification**: Payment orders are marked as `PAID` **only** after server-side cryptographic signature verification with `RAZORPAY_KEY_SECRET`.
- **Development Fallback**: If Razorpay keys are not yet configured in `.env`, the system provides a clean notice and safely logs the order for Cash on Delivery rather than faking payment success.

---

### 🗄️ 4. Resilient Database Layer (Supabase PostgreSQL + Local Storage)
- **Supabase PostgreSQL Schema**: Complete SQL schema provided in [`supabase-schema.sql`](file:///c:/Users/jayas/OneDrive/Desktop/mine/briyani%20restaurant/supabase-schema.sql) with tables:
  - `categories`
  - `menu_items`
  - `orders`
  - `order_items`
  - `payments`
  - `users`
  - Row-Level Security (RLS) policies, triggers, and sample seed items.
- **Local Fallback Engine**: If Supabase credentials are not yet entered in `.env`, the application automatically falls back to a persistent JSON database engine (`data/database.json`) so the entire site, admin panel, and order workflow run smoothly right out of the box!

---

## 🚀 Quick Start Guide

### 1. Start the Local Server
```bash
npm start
```
The server will start on `http://localhost:3000`:
- **Customer Website**: `http://localhost:3000`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **Admin Login**: `http://localhost:3000/admin/login`

### 2. Default Admin Credentials
- **Username**: `admin`
- **Password**: `SudaSuda@2026`
*(Can be changed anytime in `.env`)*

### 3. Run Integration Tests
```bash
npm test
```
Runs 35 automated integration tests validating public APIs, menu CRUD, order placement, order status updates, Razorpay HMAC security, and auth protection.

---

## ⚙️ Environment Configuration (`.env`)

Copy `.env.example` to `.env` and fill in your keys:

```ini
PORT=3000

# Supabase PostgreSQL (Optional - falls back to local engine if omitted)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Razorpay Payment Gateway (Optional - for online payments)
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SudaSuda@2026
JWT_SECRET=your_production_secret_key_9345372744
```

---

## ☁️ Deploying to Vercel

The application is pre-configured for one-click deployment on **Vercel**:
1. Push this repository to GitHub.
2. In the Vercel dashboard, click **"Add New Project"** and import the repository.
3. In **Environment Variables**, add the variables from `.env.example` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `ADMIN_PASSWORD`, etc.).
4. Click **Deploy**. Vercel will use [`vercel.json`](file:///c:/Users/jayas/OneDrive/Desktop/mine/briyani%20restaurant/vercel.json) and [`api/index.js`](file:///c:/Users/jayas/OneDrive/Desktop/mine/briyani%20restaurant/api/index.js) to serve the static frontend and serverless API endpoints.

---

## 📁 Project Structure

```
briyani-restaurant/
├── api/
│   └── index.js              # Vercel serverless function entrypoint
├── data/
│   └── database.json         # Local persistent database store (resilient fallback)
├── public/
│   ├── admin/
│   │   ├── index.html        # Admin Dashboard interface
│   │   └── login.html        # Admin Login interface
│   ├── css/
│   │   ├── admin.css         # Admin styling & dashboard layout
│   │   └── style.css         # Customer South Indian responsive styling
│   ├── images/
│   │   ├── biryani_hero.jpg  # Authentic South Indian Dum Biryani photo
│   │   ├── chicken_65.jpg    # Crispy Chicken 65 with curry leaves
│   │   ├── mutton_chukka.jpg # Madurai style roasted Mutton Chukka
│   │   ├── parotta_salna.jpg # Flaky Parottas with hot Salna
│   │   ├── kothu_parotta.jpg # Iron-tossed Street Chicken Kothu Parotta
│   │   └── south_indian_meals.jpg # Authentic Banana Leaf South Indian Meals
│   ├── js/
│   │   ├── admin.js          # Admin dashboard & Menu CRUD logic
│   │   └── app.js            # Customer menu, cart, checkout & WhatsApp logic
│   ├── uploads/              # Storage directory for newly uploaded dish photos
│   └── index.html            # Main customer website
├── .env.example              # Environment variables template
├── db.js                     # Unified database layer (Supabase + Local Fallback)
├── package.json              # Project dependencies and npm scripts
├── server.js                 # Express backend with APIs & Razorpay verification
├── supabase-schema.sql       # Complete PostgreSQL schema for Supabase
├── test-runner.js            # Automated test suite (35 integration tests)
└── vercel.json               # Vercel deployment routes and serverless config
```
