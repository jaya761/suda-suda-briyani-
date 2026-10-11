// ==============================================================
// SUDA SUDA BRIYANI - SYSTEM INTEGRATION TEST SUITE
// Runs complete automated validation across API, Database, Auth,
// Order Workflow, Menu CRUD, and Razorpay Security.
// ==============================================================

const http = require('http');
const app = require('./server');

const TEST_PORT = 3456;
let server;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: 'localhost',
      port: TEST_PORT,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  STARTING INTEGRATION TESTS FOR SUDA SUDA BRIYANI  ');
  console.log('====================================================');

  await new Promise(resolve => {
    server = app.listen(TEST_PORT, resolve);
  });
  console.log(`✓ Test Server started on http://localhost:${TEST_PORT}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. CONFIG & HEALTH
    console.log('--- 1. Testing Config & Restaurant Identity ---');
    const configRes = await makeRequest('GET', '/api/config');
    assert(configRes.status === 200, 'GET /api/config returns 200');
    assert(configRes.body.restaurantName === 'SUDA SUDA BRIYANI', 'Restaurant name is SUDA SUDA BRIYANI');
    assert(configRes.body.phone === '9345372744', 'Phone is 9345372744');
    assert(configRes.body.whatsappNumber === '9345372744', 'WhatsApp number is 9345372744');

    // 2. PUBLIC MENU
    console.log('\n--- 2. Testing Customer Menu System ---');
    const menuRes = await makeRequest('GET', '/api/menu');
    assert(menuRes.status === 200, 'GET /api/menu returns 200');
    assert(Array.isArray(menuRes.body) && menuRes.body.length >= 10, 'Menu contains initial sample items');
    const chickenBiryani = menuRes.body.find(i => i.name === 'Chicken Biryani');
    assert(chickenBiryani && chickenBiryani.price === 190, 'Chicken Biryani is present at ₹190');

    // Search filter test
    const searchRes = await makeRequest('GET', '/api/menu?search=Parotta');
    assert(searchRes.status === 200 && searchRes.body.some(i => i.name.includes('Parotta')), 'Menu search for Parotta works');

    // Category filter test
    const catRes = await makeRequest('GET', '/api/menu?category=STARTERS');
    assert(catRes.status === 200 && catRes.body.every(i => i.category === 'STARTERS'), 'Menu category filtering for STARTERS works');

    // 3. ADMIN AUTHENTICATION
    console.log('\n--- 3. Testing Admin Security & Auth ---');
    // Wrong password check
    const badLogin = await makeRequest('POST', '/api/admin/auth/login', { username: 'admin', password: 'WrongPassword' });
    assert(badLogin.status === 401, 'Rejects invalid admin credentials with 401');

    // Protected route without token
    const unauthMenu = await makeRequest('POST', '/api/menu', { name: 'Test Dish', price: 100, category: 'BIRYANI' });
    assert(unauthMenu.status === 401, 'Rejects dish creation without token with 401');

    // Valid Login
    const validLogin = await makeRequest('POST', '/api/admin/auth/login', { username: 'admin', password: 'SudaSuda@2026' });
    assert(validLogin.status === 200 && validLogin.body.token, 'Admin login succeeds and returns JWT token');
    const adminToken = validLogin.body.token;

    // Verify Me endpoint
    const meRes = await makeRequest('GET', '/api/admin/auth/me', null, { 'Authorization': `Bearer ${adminToken}` });
    assert(meRes.status === 200 && meRes.body.user.role === 'admin', 'Admin session verification succeeds');

    // 4. MENU CRUD (Add, Edit price, Stock toggle, Delete)
    console.log('\n--- 4. Testing Admin Menu Management ---');
    // Add New Dish
    const addRes = await makeRequest('POST', '/api/menu', {
      name: 'Madurai Kari Dosai',
      description: 'Crispy dosai topped with minced spicy mutton and egg.',
      price: 220,
      category: 'SOUTH INDIAN SPECIALS',
      image_url: '/images/mutton_chukka.jpg',
      available: true
    }, { 'Authorization': `Bearer ${adminToken}` });
    assert(addRes.status === 201 && addRes.body.item.name === 'Madurai Kari Dosai', 'Admin successfully adds new dish');
    const newDishId = addRes.body.item.id;

    // Verify it automatically appears in customer menu
    const verifyAdd = await makeRequest('GET', `/api/menu?search=Madurai`);
    assert(verifyAdd.body.some(i => i.id === newDishId), 'Newly added dish automatically appears in customer menu');

    // Edit Dish (Price change from ₹220 -> ₹240)
    const editRes = await makeRequest('PUT', `/api/menu/${newDishId}`, {
      name: 'Madurai Kari Dosai',
      price: 240,
      category: 'SOUTH INDIAN SPECIALS',
      description: 'Updated authentic recipe with pure ghee.'
    }, { 'Authorization': `Bearer ${adminToken}` });
    assert(editRes.status === 200 && editRes.body.item.price === 240, 'Admin changes price from ₹220 to ₹240');

    // Verify customer menu sees ₹240
    const verifyPrice = await makeRequest('GET', `/api/menu?search=Madurai`);
    const updatedDish = verifyPrice.body.find(i => i.id === newDishId);
    assert(updatedDish && updatedDish.price === 240, 'Customer menu reflects updated price ₹240 without code edits');

    // Toggle Availability (Out of Stock)
    const stockRes = await makeRequest('PATCH', `/api/menu/${newDishId}/availability`, { available: false }, { 'Authorization': `Bearer ${adminToken}` });
    assert(stockRes.status === 200 && stockRes.body.item.available === false, 'Admin marks dish Out of Stock');

    // Delete Dish
    const delRes = await makeRequest('DELETE', `/api/menu/${newDishId}`, null, { 'Authorization': `Bearer ${adminToken}` });
    assert(delRes.status === 200, 'Admin successfully deletes test dish');

    // 5. CUSTOMER ORDER WORKFLOW
    console.log('\n--- 5. Testing Customer Order Workflow (Cash on Delivery) ---');
    const orderPayload = {
      customer_name: 'Murugan Vel',
      phone: '9876543210',
      address: 'No 45, North Veli Street, Madurai',
      landmark: 'Opposite Meenakshi Amman Temple Tower',
      notes: 'Please pack extra salna and raita cups.',
      payment_method: 'CASH ON DELIVERY',
      items: [
        { id: chickenBiryani.id, quantity: 2, price: 190 }, // 380
        { name: 'Chicken 65', quantity: 1, price: 150 }    // 150 (Total: 530, free delivery > 500)
      ]
    };

    const orderRes = await makeRequest('POST', '/api/orders', orderPayload);
    assert(orderRes.status === 201 && orderRes.body.success, 'Customer places order successfully');
    const createdOrder = orderRes.body.order;
    assert(createdOrder.order_number && createdOrder.order_number.startsWith('SSB-'), 'Order assigned unique number SSB-...');
    assert(createdOrder.total_amount === 530, 'Total calculated correctly on server (₹530 with free delivery)');
    assert(createdOrder.order_status === 'PENDING', 'Initial order status is PENDING');
    assert(createdOrder.payment_status === 'CASH ON DELIVERY', 'Payment status is CASH ON DELIVERY');

    // Customer order lookup
    const lookupRes = await makeRequest('GET', `/api/orders/${createdOrder.id}`);
    assert(lookupRes.status === 200 && lookupRes.body.customer_name === 'Murugan Vel', 'Customer Order lookup succeeds for success screen');

    // 6. ADMIN ORDER PROGRESSION
    console.log('\n--- 6. Testing Admin Order Progression ---');
    const stages = ['CONFIRMED', 'PREPARING', 'READY', 'OUT FOR DELIVERY', 'DELIVERED'];
    for (const stage of stages) {
      const stageRes = await makeRequest('PATCH', `/api/admin/orders/${createdOrder.id}/status`, { status: stage }, { 'Authorization': `Bearer ${adminToken}` });
      assert(stageRes.status === 200 && stageRes.body.order.order_status === stage, `Order status advanced to ${stage}`);
    }

    // Payment marked as PAID
    const payRes = await makeRequest('PATCH', `/api/admin/orders/${createdOrder.id}/payment`, { payment_status: 'PAID' }, { 'Authorization': `Bearer ${adminToken}` });
    assert(payRes.status === 200 && payRes.body.order.payment_status === 'PAID', 'Order payment updated to PAID');

    // 7. RAZORPAY SECURITY VALIDATION
    console.log('\n--- 7. Testing Razorpay Payment Security & Signatures ---');
    // Forged signature test
    const fakeSigRes = await makeRequest('POST', '/api/razorpay/verify', {
      orderId: createdOrder.id,
      razorpay_order_id: 'order_fake_123',
      razorpay_payment_id: 'pay_fake_456',
      razorpay_signature: 'forged_invalid_signature_hex'
    });
    assert(fakeSigRes.status >= 400, 'Rejects fake payment signature without valid HMAC secret match');

    // 8. DASHBOARD KPI STATS
    console.log('\n--- 8. Testing Admin Dashboard KPIs ---');
    const statsRes = await makeRequest('GET', '/api/admin/stats', null, { 'Authorization': `Bearer ${adminToken}` });
    assert(statsRes.status === 200, 'Dashboard stats API returns 200');
    assert(statsRes.body.totalOrders >= 1, 'Total orders count increments');
    assert(statsRes.body.totalSales >= 530, 'Total sales incorporates completed order amount');

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    if (server) server.close();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
