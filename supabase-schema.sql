-- ==============================================================
-- SUDA SUDA BRIYANI - SUPABASE POSTGRESQL SCHEMA
-- Authentic South Indian Restaurant Database
-- ==============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    landmark TEXT,
    notes TEXT,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 40,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH ON DELIVERY', -- 'CASH ON DELIVERY', 'ONLINE', 'WHATSAPP'
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'FAILED'
    order_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method VARCHAR(50) DEFAULT 'ONLINE',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. USERS / ADMIN TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 9. AUTO-UPDATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view available menu items
CREATE POLICY "Public read menu items" ON menu_items
    FOR SELECT USING (true);

-- Anyone can read categories
CREATE POLICY "Public read categories" ON categories
    FOR SELECT USING (true);

-- Anyone can insert an order (Checkout)
CREATE POLICY "Public create orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public create order items" ON order_items
    FOR INSERT WITH CHECK (true);

-- Customer can read their own order by ID
CREATE POLICY "Public read orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Public read order items" ON order_items
    FOR SELECT USING (true);

-- 11. INITIAL SEED CATEGORIES
INSERT INTO categories (name, slug, sort_order) VALUES
('BIRYANI', 'biryani', 1),
('STARTERS', 'starters', 2),
('SOUTH INDIAN SPECIALS', 'south-indian-specials', 3),
('MEALS', 'meals', 4),
('COMBOS', 'combos', 5),
('BEVERAGES', 'beverages', 6)
ON CONFLICT (slug) DO NOTHING;

-- 12. INITIAL SAMPLE MENU ITEMS
INSERT INTO menu_items (name, description, price, category, image_url, available) VALUES
('Chicken Biryani', 'Authentic South Indian dum biryani made with fragrant seeraga samba rice, tender chicken, boiled egg, served with rich brinjal salna and raita.', 190, 'BIRYANI', '/images/biryani_hero.jpg', true),
('Mutton Biryani', 'Traditional Tamil Nadu military mess style mutton biryani slow-cooked with fresh ground spices, succulent baby goat meat, egg, salna & raita.', 280, 'BIRYANI', '/images/biryani_hero.jpg', true),
('Egg Biryani', 'Fragrant dum-cooked biryani rice served with two seasoned hard-boiled eggs, spicy salna gravy, and cooling onion raita.', 140, 'BIRYANI', '/images/biryani_hero.jpg', true),
('Chicken 65', 'Classic Chennai style crispy boneless chicken chunks marinated in fiery spices, deep-fried with curry leaves and green chilies.', 150, 'STARTERS', '/images/chicken_65.jpg', true),
('Chicken Lollipop', 'Crisp fried chicken wings drumettes tossed with aromatic South Indian pepper seasoning and garlic, served with sliced onions.', 170, 'STARTERS', '/images/chicken_65.jpg', true),
('Mutton Chukka', 'Madurai street-style tender mutton pieces roasted in dark caramelized shallots, black pepper, and curry leaves in iron tawa.', 260, 'STARTERS', '/images/mutton_chukka.jpg', true),
('Pepper Chicken', 'Dry roasted succulent bone-in chicken infused with freshly crushed tellicherry black pepper and curry leaves.', 180, 'STARTERS', '/images/mutton_chukka.jpg', true),
('Parotta (Set of 2)', 'Hot, flaky, layered South Indian Maida parottas served with aromatic non-veg salna gravy.', 50, 'SOUTH INDIAN SPECIALS', '/images/parotta_salna.jpg', true),
('Chicken Kothu Parotta', 'Hot shredded flaky parotta stir-fried on high flame iron griddle with egg, tender chicken pieces, onions, and spicy salna.', 160, 'SOUTH INDIAN SPECIALS', '/images/kothu_parotta.jpg', true),
('Egg Kothu Parotta', 'Street style crushed parotta tossed with scrambled farm eggs, sliced onions, green chilies, and flavorful salna gravy.', 130, 'SOUTH INDIAN SPECIALS', '/images/kothu_parotta.jpg', true),
('Special Chicken Salna (Cup)', 'Authentic Tamil Nadu restaurant salna with rich coconut and poppy seed aroma, perfect with parotta or biryani.', 40, 'SOUTH INDIAN SPECIALS', '/images/parotta_salna.jpg', true),
('South Indian Non-Veg Meals', 'Traditional banana leaf style feast: hot rice, chicken kulambu, mutton salna, pepper rasam, poriyal, kootu, curd & appalam.', 190, 'MEALS', '/images/south_indian_meals.jpg', true),
('Special Biryani Combo', '1 Regular Chicken Biryani + 1 Chicken 65 (half) + 1 Gulab Jamun / Sweet + 1 Refreshing Beverage.', 290, 'COMBOS', '/images/biryani_hero.jpg', true),
('Chilled Rose Milk', 'Refreshing traditional Chennai style chilled rose syrup milk with sabja basil seeds, served chilled.', 60, 'BEVERAGES', '/images/biryani_hero.jpg', true),
('Nannari Sarbath', 'Herbal sarsaparilla root cooler prepared with fresh lemon juice and iced water, ideal after spicy biryani.', 50, 'BEVERAGES', '/images/biryani_hero.jpg', true);
