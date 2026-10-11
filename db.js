const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Check Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-project'));

let supabase = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[Database] Connected to Supabase PostgreSQL at:', SUPABASE_URL);
  } catch (err) {
    console.warn('[Database] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('[Database] Supabase credentials not detected. Operating with persistent local database engine.');
}

// Local Database File Path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'BIRYANI', slug: 'biryani', sort_order: 1 },
  { id: 'cat-2', name: 'STARTERS', slug: 'starters', sort_order: 2 },
  { id: 'cat-3', name: 'SOUTH INDIAN SPECIALS', slug: 'south-indian-specials', sort_order: 3 },
  { id: 'cat-4', name: 'MEALS', slug: 'meals', sort_order: 4 },
  { id: 'cat-5', name: 'COMBOS', slug: 'combos', sort_order: 5 },
  { id: 'cat-6', name: 'BEVERAGES', slug: 'beverages', sort_order: 6 }
];

const INITIAL_MENU_ITEMS = [
  {
    id: 'item-1',
    name: 'Chicken Biryani',
    description: 'Authentic South Indian dum biryani made with fragrant seeraga samba rice, tender chicken, boiled egg, served with rich brinjal salna and raita.',
    price: 190,
    category: 'BIRYANI',
    image_url: '/images/biryani_hero.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-2',
    name: 'Mutton Biryani',
    description: 'Traditional Tamil Nadu military mess style mutton biryani slow-cooked with fresh ground spices, succulent baby goat meat, egg, salna & raita.',
    price: 280,
    category: 'BIRYANI',
    image_url: '/images/mutton_biryani.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-3',
    name: 'Egg Biryani',
    description: 'Fragrant dum-cooked biryani rice served with two seasoned hard-boiled eggs, spicy salna gravy, and cooling onion raita.',
    price: 140,
    category: 'BIRYANI',
    image_url: '/images/egg_biryani.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-4',
    name: 'Chicken 65',
    description: 'Classic Chennai style crispy boneless chicken chunks marinated in fiery spices, deep-fried with fresh curry leaves and green chilies.',
    price: 150,
    category: 'STARTERS',
    image_url: '/images/chicken_65.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-5',
    name: 'Chicken Lollipop',
    description: 'Crisp fried chicken wings drumettes tossed with aromatic South Indian pepper seasoning and garlic, served with sliced onions.',
    price: 170,
    category: 'STARTERS',
    image_url: '/images/chicken_lollipop.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-6',
    name: 'Mutton Chukka',
    description: 'Madurai street-style tender mutton pieces roasted in dark caramelized shallots, tellicherry black pepper, and fresh curry leaves in cast iron.',
    price: 260,
    category: 'STARTERS',
    image_url: '/images/mutton_chukka.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-7',
    name: 'Pepper Chicken',
    description: 'Dry roasted succulent bone-in chicken infused with freshly crushed black pepper, shallots, and fragrant curry leaves.',
    price: 180,
    category: 'STARTERS',
    image_url: '/images/pepper_chicken.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-8',
    name: 'Parotta (Set of 2)',
    description: 'Hot, flaky, layered South Indian Maida parottas served with aromatic salna gravy.',
    price: 50,
    category: 'SOUTH INDIAN SPECIALS',
    image_url: '/images/parotta_salna.jpg',
    available: true,
    is_veg: true,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-9',
    name: 'Chicken Kothu Parotta',
    description: 'Hot shredded flaky parotta stir-fried on high flame iron griddle with egg, tender chicken pieces, onions, and spicy salna.',
    price: 160,
    category: 'SOUTH INDIAN SPECIALS',
    image_url: '/images/kothu_parotta.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-10',
    name: 'Egg Kothu Parotta',
    description: 'Street style crushed parotta tossed with scrambled farm eggs, sliced onions, green chilies, and flavorful salna gravy.',
    price: 130,
    category: 'SOUTH INDIAN SPECIALS',
    image_url: '/images/kothu_parotta.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-11',
    name: 'Special Chicken Salna (Cup)',
    description: 'Authentic Tamil Nadu restaurant salna with rich coconut and poppy seed aroma, perfect accompaniment with parotta or biryani.',
    price: 40,
    category: 'SOUTH INDIAN SPECIALS',
    image_url: '/images/parotta_salna.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-12',
    name: 'South Indian Non-Veg Meals',
    description: 'Traditional banana leaf style feast: hot rice, chicken kulambu, mutton salna, pepper rasam, poriyal, kootu, curd & appalam.',
    price: 190,
    category: 'MEALS',
    image_url: '/images/south_indian_meals.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-13',
    name: 'Special Biryani Combo',
    description: '1 Full Chicken Biryani + 1 Half Chicken 65 + 1 Sweet Kesari / Jamun + 1 Beverage.',
    price: 290,
    category: 'COMBOS',
    image_url: '/images/biryani_combo.jpg',
    available: true,
    is_veg: false,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-14',
    name: 'Chilled Rose Milk',
    description: 'Refreshing traditional Chennai style chilled rose syrup milk with sabja basil seeds, served ice cold.',
    price: 60,
    category: 'BEVERAGES',
    image_url: '/images/rose_milk.jpg',
    available: true,
    is_veg: true,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-15',
    name: 'Nannari Sarbath',
    description: 'Authentic herbal sarsaparilla root cooler prepared with freshly squeezed lemon juice and chilled water.',
    price: 50,
    category: 'BEVERAGES',
    image_url: '/images/nannari_sarbath.jpg',
    available: true,
    is_veg: true,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'item-16',
    name: 'Paneer Soda / Goli Soda',
    description: 'Authentic Tamil Nadu street-style chilled marble goli soda with sweet fragrant paneer rose essence and fizzy sparkle.',
    price: 35,
    category: 'BEVERAGES',
    image_url: '/images/goli_soda.jpg',
    available: true,
    is_veg: true,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString()
  }
];

function initLocalDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'SudaSuda@2026';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(adminPassword, salt);

    const initialData = {
      users: [
        {
          id: 'user-admin-1',
          username: process.env.ADMIN_USERNAME || 'admin',
          email: 'admin@sudasudabriyani.com',
          password_hash: passwordHash,
          role: 'admin',
          created_at: new Date().toISOString()
        }
      ],
      categories: INITIAL_CATEGORIES,
      menu_items: INITIAL_MENU_ITEMS,
      orders: [],
      order_items: [],
      payments: []
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log('[Database] Local database initialized with default admin and authentic menu items.');
  }
}

initLocalDatabase();

function readLocalDb() {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('[Database] Read error, repairing local db:', err.message);
    initLocalDatabase();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  }
}

function writeLocalDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ==========================================
// MENU ITEMS API
// ==========================================

async function getMenuItems({ category = '', search = '' } = {}) {
  if (supabase) {
    try {
      let query = supabase.from('menu_items').select('*').order('created_at', { ascending: true });
      if (category && category !== 'ALL') {
        query = query.eq('category', category.toUpperCase());
      }
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      const { data, error } = await query;
      if (!error && data) return data;
      console.warn('[Database] Supabase getMenuItems error, falling back to local:', error?.message);
    } catch (e) {
      console.warn('[Database] Supabase call exception:', e.message);
    }
  }

  // Local fallback
  const db = readLocalDb();
  let items = db.menu_items || [];
  if (category && category !== 'ALL') {
    items = items.filter(i => i.category.toUpperCase() === category.toUpperCase());
  }
  if (search) {
    const term = search.toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(term) || (i.description && i.description.toLowerCase().includes(term)));
  }
  return items;
}

async function getAllMenuItemsAdmin() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('[Database] Supabase getAllMenuItemsAdmin error:', e.message);
    }
  }
  const db = readLocalDb();
  return [...(db.menu_items || [])].reverse();
}

async function getMenuItemById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('menu_items').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (e) {
      // fallback
    }
  }
  const db = readLocalDb();
  return db.menu_items.find(i => String(i.id) === String(id)) || null;
}

async function createMenuItem(itemData) {
  const newItem = {
    id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: itemData.name.trim(),
    description: itemData.description ? itemData.description.trim() : '',
    price: parseFloat(itemData.price) || 0,
    category: (itemData.category || 'BIRYANI').toUpperCase(),
    image_url: itemData.image_url || '/images/biryani_hero.jpg',
    available: itemData.available !== undefined ? Boolean(itemData.available) : true,
    is_veg: Boolean(itemData.is_veg),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('menu_items').insert([newItem]).select().single();
      if (!error && data) return data;
      console.warn('[Database] Supabase createMenuItem error:', error?.message);
    } catch (e) {
      console.warn('[Database] Supabase createMenuItem exception:', e.message);
    }
  }

  const db = readLocalDb();
  db.menu_items.push(newItem);
  writeLocalDb(db);
  return newItem;
}

async function updateMenuItem(id, updates) {
  const updatePayload = {
    updated_at: new Date().toISOString()
  };
  if (updates.name !== undefined) updatePayload.name = updates.name.trim();
  if (updates.description !== undefined) updatePayload.description = updates.description.trim();
  if (updates.price !== undefined) updatePayload.price = parseFloat(updates.price) || 0;
  if (updates.category !== undefined) updatePayload.category = updates.category.toUpperCase();
  if (updates.image_url !== undefined && updates.image_url) updatePayload.image_url = updates.image_url;
  if (updates.available !== undefined) updatePayload.available = Boolean(updates.available);
  if (updates.is_veg !== undefined) updatePayload.is_veg = Boolean(updates.is_veg);

  if (supabase) {
    try {
      const { data, error } = await supabase.from('menu_items').update(updatePayload).eq('id', id).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('[Database] Supabase updateMenuItem error:', e.message);
    }
  }

  const db = readLocalDb();
  const index = db.menu_items.findIndex(i => String(i.id) === String(id));
  if (index === -1) return null;
  db.menu_items[index] = { ...db.menu_items[index], ...updatePayload };
  writeLocalDb(db);
  return db.menu_items[index];
}

async function updateAvailability(id, available) {
  return updateMenuItem(id, { available: Boolean(available) });
}

async function deleteMenuItem(id) {
  if (supabase) {
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('[Database] Supabase deleteMenuItem error:', e.message);
    }
  }

  const db = readLocalDb();
  const index = db.menu_items.findIndex(i => String(i.id) === String(id));
  if (index === -1) return false;
  db.menu_items.splice(index, 1);
  writeLocalDb(db);
  return true;
}

// ==========================================
// ORDERS API
// ==========================================

function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SSB-${dateStr}-${randomNum}`;
}

async function createOrder(orderInput) {
  const { customer_name, phone, address, landmark, notes, items, payment_method } = orderInput;

  // Re-verify items and calculate server-side subtotal for security
  let subtotal = 0;
  const verifiedOrderItems = [];

  const allItems = await getAllMenuItemsAdmin();
  const itemsMap = new Map(allItems.map(i => [String(i.id), i]));

  for (const item of items) {
    const dbItem = itemsMap.get(String(item.id || item.menu_item_id));
    const price = dbItem ? Number(dbItem.price) : Number(item.price || 0);
    const itemName = dbItem ? dbItem.name : (item.name || item.item_name || 'Dish');
    const quantity = parseInt(item.quantity, 10) || 1;
    const itemTotal = price * quantity;
    subtotal += itemTotal;

    verifiedOrderItems.push({
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      menu_item_id: item.id || item.menu_item_id || null,
      item_name: itemName,
      quantity,
      price
    });
  }

  const delivery_charge = subtotal >= 500 ? 0 : 40; // Free delivery above 500
  const total_amount = subtotal + delivery_charge;
  const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const orderNumber = generateOrderNumber();

  const newOrder = {
    id: orderId,
    order_number: orderNumber,
    customer_name: customer_name.trim(),
    phone: phone.trim(),
    address: address.trim(),
    landmark: landmark ? landmark.trim() : '',
    notes: notes ? notes.trim() : '',
    subtotal,
    delivery_charge,
    total_amount,
    payment_method: payment_method || 'CASH ON DELIVERY',
    payment_status: payment_method === 'ONLINE' ? 'PENDING' : 'CASH ON DELIVERY',
    order_status: 'PENDING',
    items: verifiedOrderItems,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      // Insert order into orders table
      const { data: orderData, error: orderErr } = await supabase.from('orders').insert([{
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_name: newOrder.customer_name,
        phone: newOrder.phone,
        address: newOrder.address,
        landmark: newOrder.landmark,
        notes: newOrder.notes,
        subtotal: newOrder.subtotal,
        delivery_charge: newOrder.delivery_charge,
        total_amount: newOrder.total_amount,
        payment_method: newOrder.payment_method,
        payment_status: newOrder.payment_status,
        order_status: newOrder.order_status,
        created_at: newOrder.created_at,
        updated_at: newOrder.updated_at
      }]).select().single();

      if (!orderErr && orderData) {
        // Insert order items
        const itemsToInsert = verifiedOrderItems.map(i => ({
          order_id: newOrder.id,
          menu_item_id: i.menu_item_id,
          item_name: i.item_name,
          quantity: i.quantity,
          price: i.price
        }));
        await supabase.from('order_items').insert(itemsToInsert);
        return newOrder;
      }
      console.warn('[Database] Supabase order insert error, continuing to local:', orderErr?.message);
    } catch (e) {
      console.warn('[Database] Supabase order insert exception:', e.message);
    }
  }

  // Local storage
  const db = readLocalDb();
  db.orders.unshift(newOrder);
  for (const item of verifiedOrderItems) {
    db.order_items.push({ ...item, order_id: orderId });
  }
  writeLocalDb(db);
  return newOrder;
}

async function getOrderById(idOrNumber) {
  if (supabase) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${idOrNumber},order_number.eq.${idOrNumber}`)
        .single();

      if (!error && order) {
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
        return { ...order, items: items || [] };
      }
    } catch (e) {
      // fallback
    }
  }

  const db = readLocalDb();
  const order = db.orders.find(o => o.id === idOrNumber || o.order_number === idOrNumber);
  if (!order) return null;
  const items = db.order_items.filter(i => i.order_id === order.id);
  return { ...order, items: order.items || items };
}

async function getAllOrdersAdmin() {
  if (supabase) {
    try {
      const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && orders) {
        // Load items for orders
        const { data: items } = await supabase.from('order_items').select('*');
        const itemsByOrder = (items || []).reduce((acc, item) => {
          acc[item.order_id] = acc[item.order_id] || [];
          acc[item.order_id].push(item);
          return acc;
        }, {});
        return orders.map(o => ({ ...o, items: itemsByOrder[o.id] || o.items || [] }));
      }
    } catch (e) {
      console.warn('[Database] Supabase getAllOrdersAdmin error:', e.message);
    }
  }

  const db = readLocalDb();
  return [...db.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function updateOrderStatus(orderId, orderStatus) {
  const allowed = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED'];
  if (!allowed.includes(orderStatus)) {
    throw new Error(`Invalid status: ${orderStatus}. Allowed: ${allowed.join(', ')}`);
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').update({ order_status: orderStatus, updated_at: new Date().toISOString() }).eq('id', orderId).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('[Database] Supabase updateOrderStatus error:', e.message);
    }
  }

  const db = readLocalDb();
  const order = db.orders.find(o => o.id === orderId || o.order_number === orderId);
  if (!order) return null;
  order.order_status = orderStatus;
  order.updated_at = new Date().toISOString();
  writeLocalDb(db);
  return order;
}

async function updatePaymentStatus(orderId, paymentStatus, details = {}) {
  const updatePayload = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase.from('orders').update(updatePayload).eq('id', orderId);
    } catch (e) {
      // local will sync
    }
  }

  const db = readLocalDb();
  const order = db.orders.find(o => o.id === orderId || o.order_number === orderId);
  if (order) {
    order.payment_status = paymentStatus;
    order.updated_at = new Date().toISOString();
    if (details.payment_method) order.payment_method = details.payment_method;
    writeLocalDb(db);
  }
  return order;
}

async function createPaymentRecord(paymentData) {
  const newPayment = {
    id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...paymentData,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase.from('payments').insert([newPayment]);
    } catch (e) {
      // ignore
    }
  }

  const db = readLocalDb();
  db.payments.push(newPayment);
  writeLocalDb(db);
  return newPayment;
}

// ==========================================
// ADMIN DASHBOARD STATS
// ==========================================

async function getDashboardStats() {
  const orders = await getAllOrdersAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const totalOrders = orders.length;
  const todayOrders = orders.filter(o => o.created_at && o.created_at.slice(0, 10) === today).length;
  const pendingOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.order_status)).length;
  const completedOrders = orders.filter(o => o.order_status === 'DELIVERED').length;
  
  const totalSales = orders
    .filter(o => o.order_status !== 'CANCELLED')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return {
    totalOrders,
    todayOrders,
    pendingOrders,
    completedOrders,
    totalSales: Math.round(totalSales)
  };
}

// ==========================================
// ADMIN USER AUTH
// ==========================================

async function verifyAdminUser(username, password) {
  const configuredUser = process.env.ADMIN_USERNAME || 'admin';
  const configuredPass = process.env.ADMIN_PASSWORD || 'SudaSuda@2026';

  // Direct check against configured credentials first
  if (username === configuredUser && password === configuredPass) {
    return {
      id: 'admin-master',
      username: configuredUser,
      role: 'admin'
    };
  }

  // Database check
  if (supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
      if (!error && data && data.password_hash) {
        const matches = bcrypt.compareSync(password, data.password_hash);
        if (matches) {
          return { id: data.id, username: data.username, role: data.role || 'admin' };
        }
      }
    } catch (e) {
      // fallback
    }
  }

  const db = readLocalDb();
  const user = (db.users || []).find(u => u.username === username || u.email === username);
  if (user && user.password_hash) {
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (isMatch) {
      return { id: user.id, username: user.username, role: user.role };
    }
  }

  return null;
}

module.exports = {
  isSupabaseConfigured: () => isSupabaseConfigured,
  getMenuItems,
  getAllMenuItemsAdmin,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  updateAvailability,
  deleteMenuItem,
  createOrder,
  getOrderById,
  getAllOrdersAdmin,
  updateOrderStatus,
  updatePaymentStatus,
  createPaymentRecord,
  getDashboardStats,
  verifyAdminUser
};
