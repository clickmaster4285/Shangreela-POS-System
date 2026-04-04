export interface MenuItem {
  id: string;
  name: string;
  price: number;
  halfPrice?: number;
  category: string;
  image: string;
  description: string;
  available: boolean;
  perishable: boolean;
  expiryDays?: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  type: 'dine-in' | 'takeaway' | 'delivery';
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  table?: number;
  total: number;
  tax: number;
  subtotal: number;
  discount: number;
  notes: string;
  createdAt: string;
  customerName?: string;
  orderTaker?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export interface FloorInfo {
  id: string;
  name: string;
}

export const floors: FloorInfo[] = [
  { id: 'ground', name: 'Ground floor' },
  { id: 'first', name: 'First floor' },
  { id: 'outdoor', name: 'Outdoor' },
];

export interface TableInfo {
  id: number;
  name: string;
  seats: number;
  floorId: string;
  status: 'available' | 'occupied' | 'reserved';
  currentOrder?: string;
}

export const menuCategories = [
  'All', 'Shinwari', 'BBQ', 'Karahi', 'Handi', 'Chinese', 'Rice', 'Noodles',
  'Appetizers', 'Soups', 'Sea Food', 'Steam', 'Sandwiches', 'Salads',
  'Regular Items', 'Tandoor', 'Deals', 'Platters', 'Beverages', 'Desserts'
];

const img = (q: string) => `https://images.unsplash.com/${q}?w=400`;

let _id = 0;
const id = () => String(++_id);

export const menuItems: MenuItem[] = [
  // ── SHINWARI ──
  { id: id(), name: 'Shinwari Lamb Namkeen White Karahi', price: 3400, halfPrice: 1700, category: 'Shinwari', image: img('photo-1603360946369-dc9bb6258143'), description: 'Traditional white shinwari lamb karahi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Shinwari Lamb Namkeen Karahi', price: 3400, halfPrice: 1700, category: 'Shinwari', image: img('photo-1603360946369-dc9bb6258143'), description: 'Classic namkeen shinwari lamb karahi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Shinwari Lamb Sulamani Karahi', price: 3400, halfPrice: 1700, category: 'Shinwari', image: img('photo-1603360946369-dc9bb6258143'), description: 'Sulamani style lamb karahi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Shinwari Lamb Do Payaza Karahi', price: 3400, halfPrice: 1700, category: 'Shinwari', image: img('photo-1603360946369-dc9bb6258143'), description: 'Lamb karahi with onions', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Dum Pukht', price: 3400, halfPrice: 1700, category: 'Shinwari', image: img('photo-1544025162-d76694265947'), description: 'Slow-cooked lamb dum pukht', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Roash', price: 1200, category: 'Shinwari', image: img('photo-1544025162-d76694265947'), description: 'Traditional roash', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Lamb Namkeen Tikka', price: 3400, halfPrice: 1700, category: 'Shinwari', image: img('photo-1544025162-d76694265947'), description: 'Shinwari BBQ lamb tikka', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Lamb Patta Tikka 8PC', price: 1000, category: 'Shinwari', image: img('photo-1544025162-d76694265947'), description: '8 pieces of lamb patta tikka', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Ranjha Gosht', price: 3400, halfPrice: 1700, category: 'Shinwari', image: img('photo-1544025162-d76694265947'), description: 'Ranjha style gosht', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Badmi Chanp', price: 3400, halfPrice: 1700, category: 'Shinwari', image: img('photo-1544025162-d76694265947'), description: 'Tender badmi chanp', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Kabli Pulao', price: 1200, category: 'Shinwari', image: img('photo-1563379091339-03b21ab4a4f8'), description: 'Traditional Kabli pulao', available: true, perishable: true, expiryDays: 1 },

  // ── BBQ ──
  { id: id(), name: 'Chicken Boti with Bone 12PC', price: 950, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '12 pieces of chicken boti', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Namkeen Boti with Bone 12PC', price: 950, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '12 pieces namkeen boti', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Achari Boti with Bone 12PC', price: 950, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '12 pieces achari boti', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Kabab 4PC', price: 900, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '4 pieces chicken kabab', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Reshmi Kabab 4PC', price: 1100, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '4 pieces reshmi kabab', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Cheese Kabab 4PC', price: 1100, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '4 pieces cheese kabab', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Beef Kabab 4PC', price: 1000, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '4 pieces beef kabab', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken/Beef Gola Kabab 6PC', price: 900, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '6 pieces gola kabab', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken/Beef Lebnani Kabab 4PC', price: 1000, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '4 pieces lebnani kabab', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Malai Boti (Boneless) 10PC', price: 1000, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '10 pieces boneless malai boti', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Turkish Boti (Boneless) 10PC', price: 1000, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '10 pieces boneless turkish boti', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Cheese Boti (Boneless) 10PC', price: 1150, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '10 pieces boneless cheese boti', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Shish Taouk (Boneless)', price: 1100, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: 'Boneless shish taouk', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Angara Whole Chicken', price: 1500, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: 'Whole angara chicken', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Fish Tikka 10PC', price: 1700, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: '10 pieces fish tikka', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Rahu Fish (Per KG)', price: 1700, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: 'Fresh Rahu fish per KG', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Rahu Fish (Half KG)', price: 900, category: 'BBQ', image: img('photo-1529193591184-b1d58069ecdd'), description: 'Fresh Rahu fish half KG', available: true, perishable: true, expiryDays: 1 },

  // ── KARAHI ──
  { id: id(), name: 'Mutton Makhni Karahi', price: 4100, halfPrice: 2100, category: 'Karahi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Creamy makhni mutton karahi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Mutton Karahi', price: 4000, halfPrice: 2100, category: 'Karahi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Classic mutton karahi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Mutton White Karahi', price: 4100, halfPrice: 2100, category: 'Karahi', image: img('photo-1603360946369-dc9bb6258143'), description: 'White mutton karahi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Karahi Special', price: 2100, halfPrice: 1100, category: 'Karahi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Special chicken karahi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Makhni Karahi', price: 2100, halfPrice: 1100, category: 'Karahi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Creamy makhni chicken karahi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken White Karahi', price: 2100, halfPrice: 1100, category: 'Karahi', image: img('photo-1603360946369-dc9bb6258143'), description: 'White chicken karahi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Green Karahi', price: 2100, halfPrice: 1100, category: 'Karahi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Green masala chicken karahi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Karahi', price: 2000, halfPrice: 1100, category: 'Karahi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Traditional chicken karahi', available: true, perishable: true, expiryDays: 1 },

  // ── HANDI ──
  { id: id(), name: 'Special Chicken Handi', price: 2000, category: 'Handi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Chef special chicken handi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Makhni Handi', price: 2000, category: 'Handi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Creamy makhni handi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Achari Handi', price: 2000, category: 'Handi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Achari flavored handi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Ginger Handi', price: 1950, category: 'Handi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Ginger infused handi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Jelfrezi Handi', price: 1950, category: 'Handi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Spicy jelfrezi handi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken White Handi', price: 2000, category: 'Handi', image: img('photo-1603360946369-dc9bb6258143'), description: 'White chicken handi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Hyderabadi Handi', price: 2000, category: 'Handi', image: img('photo-1603360946369-dc9bb6258143'), description: 'Hyderabadi style handi', available: true, perishable: true, expiryDays: 1 },

  // ── CHINESE ──
  { id: id(), name: 'Chicken Chili Dry', price: 1400, category: 'Chinese', image: img('photo-1525755662778-989d0524087e'), description: 'Dry chili chicken', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Kung Pao Chicken', price: 1400, category: 'Chinese', image: img('photo-1525755662778-989d0524087e'), description: 'Spicy kung pao chicken with peanuts', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Kung Pao Fish', price: 1700, category: 'Chinese', image: img('photo-1525755662778-989d0524087e'), description: 'Kung pao style fish', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Black Pepper', price: 1400, category: 'Chinese', image: img('photo-1525755662778-989d0524087e'), description: 'Black pepper chicken', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Manchurian', price: 1400, category: 'Chinese', image: img('photo-1525755662778-989d0524087e'), description: 'Chicken manchurian', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Almond', price: 1400, category: 'Chinese', image: img('photo-1525755662778-989d0524087e'), description: 'Almond chicken', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Schezwan', price: 1400, category: 'Chinese', image: img('photo-1525755662778-989d0524087e'), description: 'Schezwan chicken', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Sweet & Sour Fish', price: 1700, category: 'Chinese', image: img('photo-1525755662778-989d0524087e'), description: 'Sweet and sour fish', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Fish Chili Dry', price: 1700, category: 'Chinese', image: img('photo-1525755662778-989d0524087e'), description: 'Dry chili fish', available: true, perishable: true, expiryDays: 1 },

  // ── RICE ──
  { id: id(), name: 'Shiraz Restaurant Special Rice', price: 1050, category: 'Rice', image: img('photo-1603133872878-684f208fb84b'), description: 'Shiraz Restaurant signature special rice', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Masala Rice', price: 900, category: 'Rice', image: img('photo-1603133872878-684f208fb84b'), description: 'Spiced masala rice', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Fried Rice', price: 900, category: 'Rice', image: img('photo-1603133872878-684f208fb84b'), description: 'Wok-fried rice with chicken', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Egg Fried Rice', price: 800, category: 'Rice', image: img('photo-1603133872878-684f208fb84b'), description: 'Classic egg fried rice', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Beef Chili Rice', price: 900, category: 'Rice', image: img('photo-1603133872878-684f208fb84b'), description: 'Spicy beef chili rice', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Chili Rice', price: 900, category: 'Rice', image: img('photo-1603133872878-684f208fb84b'), description: 'Spicy chicken chili rice', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Vegetable Rice', price: 850, category: 'Rice', image: img('photo-1603133872878-684f208fb84b'), description: 'Mixed vegetable fried rice', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Steam Rice', price: 600, category: 'Rice', image: img('photo-1603133872878-684f208fb84b'), description: 'Plain steamed rice', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Pulao', price: 600, category: 'Rice', image: img('photo-1563379091339-03b21ab4a4f8'), description: 'Traditional chicken pulao', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Pulao Kabab', price: 750, category: 'Rice', image: img('photo-1563379091339-03b21ab4a4f8'), description: 'Chicken pulao with kabab', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Pulao Kabab', price: 450, category: 'Rice', image: img('photo-1563379091339-03b21ab4a4f8'), description: 'Pulao with kabab', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Pulao', price: 400, category: 'Rice', image: img('photo-1563379091339-03b21ab4a4f8'), description: 'Plain pulao', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Shami Kabab Special', price: 80, category: 'Rice', image: img('photo-1563379091339-03b21ab4a4f8'), description: 'Special shami kabab', available: true, perishable: true, expiryDays: 1 },

  // ── NOODLES ──
  { id: id(), name: 'Shiraz Restaurant Special Chowmein', price: 1300, category: 'Noodles', image: img('photo-1603133872878-684f208fb84b'), description: 'Shiraz Restaurant special chowmein', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Chowmein', price: 1200, category: 'Noodles', image: img('photo-1603133872878-684f208fb84b'), description: 'Chicken chowmein noodles', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Beef Chowmein', price: 1200, category: 'Noodles', image: img('photo-1603133872878-684f208fb84b'), description: 'Beef chowmein noodles', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Vegetable Chowmein', price: 1000, category: 'Noodles', image: img('photo-1603133872878-684f208fb84b'), description: 'Vegetable chowmein noodles', available: true, perishable: true, expiryDays: 1 },

  // ── APPETIZERS ──
  { id: id(), name: 'Shiraz Restaurant Special Lemon Chicken', price: 1100, category: 'Appetizers', image: img('photo-1527477396000-e27163b4bfd2'), description: 'Signature lemon chicken', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Honey Wings 8PC', price: 850, category: 'Appetizers', image: img('photo-1527477396000-e27163b4bfd2'), description: '8 pieces honey glazed wings', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Fried Wings 8PC', price: 700, category: 'Appetizers', image: img('photo-1527477396000-e27163b4bfd2'), description: '8 pieces crispy fried wings', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Fish Crackers', price: 400, category: 'Appetizers', image: img('photo-1527477396000-e27163b4bfd2'), description: 'Crispy fish crackers', available: true, perishable: false },
  { id: id(), name: 'French Fries', price: 300, category: 'Appetizers', image: img('photo-1573080496219-bb080dd4f877'), description: 'Golden french fries', available: true, perishable: true, expiryDays: 1 },

  // ── SOUPS ──
  { id: id(), name: 'Shiraz Restaurant Special Soup (Family)', price: 1300, category: 'Soups', image: img('photo-1547592166-23ac45744acd'), description: 'Family size special soup', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Shiraz Restaurant Special Soup (Single)', price: 400, category: 'Soups', image: img('photo-1547592166-23ac45744acd'), description: 'Single serving special soup', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Hot & Sour Soup (Family)', price: 1150, category: 'Soups', image: img('photo-1547592166-23ac45744acd'), description: 'Family size hot & sour soup', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Hot & Sour Soup (Single)', price: 400, category: 'Soups', image: img('photo-1547592166-23ac45744acd'), description: 'Single hot & sour soup', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Corn Soup (Family)', price: 1100, category: 'Soups', image: img('photo-1547592166-23ac45744acd'), description: 'Family size chicken corn soup', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Corn Soup (Single)', price: 400, category: 'Soups', image: img('photo-1547592166-23ac45744acd'), description: 'Single chicken corn soup', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Vegetable Soup (Family)', price: 1050, category: 'Soups', image: img('photo-1547592166-23ac45744acd'), description: 'Family size vegetable soup', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Vegetable Soup (Single)', price: 400, category: 'Soups', image: img('photo-1547592166-23ac45744acd'), description: 'Single vegetable soup', available: true, perishable: true, expiryDays: 1 },

  // ── SEA FOOD ──
  { id: id(), name: 'Fish & Chips', price: 1500, category: 'Sea Food', image: img('photo-1529193591184-b1d58069ecdd'), description: 'Battered fish with chips', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Finger Fish', price: 1400, category: 'Sea Food', image: img('photo-1529193591184-b1d58069ecdd'), description: 'Crispy finger fish', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Dhaka Fish', price: 1400, category: 'Sea Food', image: img('photo-1529193591184-b1d58069ecdd'), description: 'Dhaka style fish', available: true, perishable: true, expiryDays: 1 },

  // ── STEAM ──
  { id: id(), name: 'Mutton Leg Roast', price: 3800, category: 'Steam', image: img('photo-1544025162-d76694265947'), description: 'Slow roasted mutton leg', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Full Chicken Roast', price: 1500, category: 'Steam', image: img('photo-1544025162-d76694265947'), description: 'Whole roasted chicken', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Half Chicken Roast', price: 800, category: 'Steam', image: img('photo-1544025162-d76694265947'), description: 'Half roasted chicken', available: true, perishable: true, expiryDays: 1 },

  // ── SANDWICHES ──
  { id: id(), name: 'Club Sandwich', price: 700, category: 'Sandwiches', image: img('photo-1568901346375-23c9450c58cd'), description: 'Classic club sandwich', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Sandwich', price: 600, category: 'Sandwiches', image: img('photo-1568901346375-23c9450c58cd'), description: 'Grilled chicken sandwich', available: true, perishable: true, expiryDays: 1 },

  // ── SALADS ──
  { id: id(), name: 'Russian Salad', price: 600, category: 'Salads', image: img('photo-1512621776951-a57141f2eefd'), description: 'Creamy Russian salad', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Kachumber Salad', price: 300, category: 'Salads', image: img('photo-1512621776951-a57141f2eefd'), description: 'Fresh kachumber salad', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Fresh Green Salad', price: 150, category: 'Salads', image: img('photo-1512621776951-a57141f2eefd'), description: 'Fresh green salad', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Raita / Mint Sauce', price: 150, category: 'Salads', image: img('photo-1512621776951-a57141f2eefd'), description: 'Yogurt raita or mint sauce', available: true, perishable: true, expiryDays: 1 },

  // ── REGULAR ITEMS ──
  { id: id(), name: 'Mutton Qorma', price: 850, category: 'Regular Items', image: img('photo-1603360946369-dc9bb6258143'), description: 'Traditional mutton qorma', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Qorma', price: 370, category: 'Regular Items', image: img('photo-1603360946369-dc9bb6258143'), description: 'Chicken qorma curry', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Qeema', price: 450, category: 'Regular Items', image: img('photo-1603360946369-dc9bb6258143'), description: 'Minced chicken qeema', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Beef Qeema', price: 450, category: 'Regular Items', image: img('photo-1603360946369-dc9bb6258143'), description: 'Minced beef qeema', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Shahi Daal', price: 370, category: 'Regular Items', image: img('photo-1603360946369-dc9bb6258143'), description: 'Creamy shahi daal', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Daal Mash', price: 330, category: 'Regular Items', image: img('photo-1603360946369-dc9bb6258143'), description: 'Daal mash', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Daal Chana', price: 300, category: 'Regular Items', image: img('photo-1603360946369-dc9bb6258143'), description: 'Daal chana', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Mix Vegetable', price: 300, category: 'Regular Items', image: img('photo-1603360946369-dc9bb6258143'), description: 'Mixed vegetable curry', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Piece', price: 170, category: 'Regular Items', image: img('photo-1603360946369-dc9bb6258143'), description: 'Single chicken piece', available: true, perishable: true, expiryDays: 1 },

  // ── TANDOOR ──
  { id: id(), name: 'Special Cheese Naan', price: 400, category: 'Tandoor', image: img('photo-1565557623262-b51c2513a641'), description: 'Stuffed cheese naan', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Roghni Naan', price: 90, category: 'Tandoor', image: img('photo-1565557623262-b51c2513a641'), description: 'Buttery roghni naan', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Garlic Naan', price: 100, category: 'Tandoor', image: img('photo-1565557623262-b51c2513a641'), description: 'Garlic flavored naan', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Kalwanji Naan', price: 100, category: 'Tandoor', image: img('photo-1565557623262-b51c2513a641'), description: 'Kalwanji seeds naan', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Ginger Naan', price: 100, category: 'Tandoor', image: img('photo-1565557623262-b51c2513a641'), description: 'Ginger flavored naan', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Plain Naan', price: 25, category: 'Tandoor', image: img('photo-1565557623262-b51c2513a641'), description: 'Plain tandoori naan', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Tandoori Pratha', price: 110, category: 'Tandoor', image: img('photo-1565557623262-b51c2513a641'), description: 'Crispy tandoori paratha', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Tandoori Roti', price: 20, category: 'Tandoor', image: img('photo-1565557623262-b51c2513a641'), description: 'Tandoor-baked roti', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Naan Basket', price: 400, category: 'Tandoor', image: img('photo-1565557623262-b51c2513a641'), description: 'Assorted naan basket', available: true, perishable: true, expiryDays: 1 },

  // ── DEALS ──
  { id: id(), name: 'Deal-1 (Kabli Pulao + Steam Roast)', price: 1200, category: 'Deals', image: img('photo-1504674900247-0877df9cc836'), description: 'Half Kabli Pulao, Half Steam Roast, 1 NR Drink, Mint Sauce', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Deal-2 (Egg Rice + Manchurian)', price: 1100, category: 'Deals', image: img('photo-1504674900247-0877df9cc836'), description: 'Half Egg Rice, Half Manchurian/Chili Dry, 1 NR Drink', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Deal-3 (Kabli + Kababs)', price: 1000, category: 'Deals', image: img('photo-1504674900247-0877df9cc836'), description: 'Half Kabli Pulao, 1 PC Chicken Kabab, 1 PC Beef Kabab, Drink', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Deal-4 (Kabli + Reshmi)', price: 1000, category: 'Deals', image: img('photo-1504674900247-0877df9cc836'), description: 'Half Kabli Pulao, 2 PC Reshmi Kabab, Drink, Mint Sauce', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Deal-5 (Kabli + Tikka)', price: 800, category: 'Deals', image: img('photo-1504674900247-0877df9cc836'), description: 'Half Kabli Pulao, Chicken Tikka, Drink, Mint Sauce', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Deal-6 (Karahi/Handi)', price: 650, category: 'Deals', image: img('photo-1504674900247-0877df9cc836'), description: '1/4 Chicken Karahi/Handi, 1 Roghni Naan, Drink, Raita', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Deal-7 (Kabli + Shami)', price: 700, category: 'Deals', image: img('photo-1504674900247-0877df9cc836'), description: 'Half Kabli Pulao, 2 PC Shami Kabab, Drink, Mint Sauce', available: true, perishable: true, expiryDays: 1 },

  // ── PLATTERS ──
  { id: id(), name: 'Mutton Platter (Full)', price: 8500, category: 'Platters', image: img('photo-1544025162-d76694265947'), description: 'Full mutton platter with BBQ, Kabli Pulao, Naan, Drink', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Mutton Platter (Half)', price: 4200, category: 'Platters', image: img('photo-1544025162-d76694265947'), description: 'Half mutton platter', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Platter (Full)', price: 6800, category: 'Platters', image: img('photo-1544025162-d76694265947'), description: 'Full chicken platter with steam roast, BBQ, Kabli Pulao', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Chicken Platter (Half)', price: 3300, category: 'Platters', image: img('photo-1544025162-d76694265947'), description: 'Half chicken platter', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'BBQ Platter (Full)', price: 6500, category: 'Platters', image: img('photo-1544025162-d76694265947'), description: 'Full BBQ platter with assorted kababs, Kabli Pulao', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'BBQ Platter (Half)', price: 3300, category: 'Platters', image: img('photo-1544025162-d76694265947'), description: 'Half BBQ platter', available: true, perishable: true, expiryDays: 1 },

  // ── BEVERAGES ──
  { id: id(), name: 'Fresh Mint Margarita', price: 250, category: 'Beverages', image: img('photo-1536935338788-846bb9981813'), description: 'Refreshing mint margarita', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Lemonade', price: 250, category: 'Beverages', image: img('photo-1523677011781-c91d1bbe2f9e'), description: 'Fresh lemonade', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Fresh Lime', price: 200, category: 'Beverages', image: img('photo-1523677011781-c91d1bbe2f9e'), description: 'Fresh lime drink', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Can Drink', price: 150, category: 'Beverages', image: img('photo-1536935338788-846bb9981813'), description: 'Canned soft drink', available: true, perishable: false },
  { id: id(), name: 'Diet Can Drink', price: 160, category: 'Beverages', image: img('photo-1536935338788-846bb9981813'), description: 'Diet canned drink', available: true, perishable: false },
  { id: id(), name: '1.5 Liter Drink', price: 280, category: 'Beverages', image: img('photo-1536935338788-846bb9981813'), description: '1.5 liter soft drink', available: true, perishable: false },
  { id: id(), name: 'Mix Tea', price: 100, category: 'Beverages', image: img('photo-1536935338788-846bb9981813'), description: 'Traditional mix tea', available: true, perishable: false },
  { id: id(), name: 'Green Tea', price: 80, category: 'Beverages', image: img('photo-1536935338788-846bb9981813'), description: 'Green tea', available: true, perishable: false },
  { id: id(), name: 'Milk Coffee', price: 400, category: 'Beverages', image: img('photo-1536935338788-846bb9981813'), description: 'Hot milk coffee', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Black Coffee', price: 300, category: 'Beverages', image: img('photo-1536935338788-846bb9981813'), description: 'Black coffee', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Mineral Water (Large)', price: 120, category: 'Beverages', image: img('photo-1536935338788-846bb9981813'), description: 'Large mineral water', available: true, perishable: false },
  { id: id(), name: 'Mineral Water (Small)', price: 100, category: 'Beverages', image: img('photo-1536935338788-846bb9981813'), description: 'Small mineral water', available: true, perishable: false },
  { id: id(), name: 'Lassi Mango', price: 300, category: 'Beverages', image: img('photo-1553530666-ba11a7da3888'), description: 'Mango flavored lassi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Lassi Sweet', price: 200, category: 'Beverages', image: img('photo-1553530666-ba11a7da3888'), description: 'Sweet lassi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Lassi Saltish', price: 200, category: 'Beverages', image: img('photo-1553530666-ba11a7da3888'), description: 'Salty lassi', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Shake (Small)', price: 120, category: 'Beverages', image: img('photo-1553530666-ba11a7da3888'), description: 'Small milkshake', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Shake (Large)', price: 200, category: 'Beverages', image: img('photo-1553530666-ba11a7da3888'), description: 'Large milkshake', available: true, perishable: true, expiryDays: 1 },

  // ── DESSERTS ──
  { id: id(), name: 'Kheer', price: 200, category: 'Desserts', image: img('photo-1624353365286-3f8d62daad51'), description: 'Traditional rice kheer', available: true, perishable: true, expiryDays: 1 },
  { id: id(), name: 'Gajar Halwa', price: 350, category: 'Desserts', image: img('photo-1624353365286-3f8d62daad51'), description: 'Carrot halwa dessert', available: true, perishable: true, expiryDays: 2 },
  { id: id(), name: 'Ice Cream (Single Scoop)', price: 120, category: 'Desserts', image: img('photo-1624353365286-3f8d62daad51'), description: 'Single scoop ice cream', available: true, perishable: true, expiryDays: 30 },
  { id: id(), name: 'Ice Cream (Double Scoop)', price: 200, category: 'Desserts', image: img('photo-1624353365286-3f8d62daad51'), description: 'Double scoop ice cream', available: true, perishable: true, expiryDays: 30 },
];

export const tables: TableInfo[] = [
  { id: 1, name: 'Table 1', seats: 2, floorId: 'ground', status: 'available' },
  { id: 2, name: 'Table 2', seats: 2, floorId: 'ground', status: 'occupied', currentOrder: 'ORD-001' },
  { id: 3, name: 'Table 3', seats: 4, floorId: 'ground', status: 'available' },
  { id: 4, name: 'Table 4', seats: 4, floorId: 'ground', status: 'reserved' },
  { id: 5, name: 'Table 5', seats: 6, floorId: 'first', status: 'occupied', currentOrder: 'ORD-002' },
  { id: 6, name: 'Table 6', seats: 6, floorId: 'first', status: 'available' },
  { id: 7, name: 'Table 7', seats: 8, floorId: 'first', status: 'available' },
  { id: 8, name: 'Table 8', seats: 4, floorId: 'first', status: 'occupied', currentOrder: 'ORD-003' },
  { id: 9, name: 'VIP 1', seats: 10, floorId: 'first', status: 'reserved' },
  { id: 10, name: 'VIP 2', seats: 12, floorId: 'outdoor', status: 'available' },
  { id: 11, name: 'Patio A', seats: 4, floorId: 'outdoor', status: 'available' },
  { id: 12, name: 'Patio B', seats: 4, floorId: 'outdoor', status: 'occupied', currentOrder: 'ORD-004' },
];

export const sampleOrders: Order[] = [
  {
    id: 'ORD-001', type: 'dine-in', status: 'preparing', table: 2,
    items: [
      { menuItem: menuItems[30], quantity: 1, notes: '' },
      { menuItem: menuItems[95], quantity: 2, notes: 'No ice' },
    ],
    subtotal: 4600, tax: 460, discount: 0, total: 5060, notes: '', createdAt: new Date().toISOString(),
  },
  {
    id: 'ORD-002', type: 'dine-in', status: 'pending', table: 5,
    items: [
      { menuItem: menuItems[0], quantity: 1, notes: '' },
      { menuItem: menuItems[10], quantity: 1, notes: '' },
    ],
    subtotal: 4600, tax: 460, discount: 0, total: 5060, notes: 'Family dinner', createdAt: new Date().toISOString(),
  },
  {
    id: 'ORD-003', type: 'takeaway', status: 'ready',
    items: [
      { menuItem: menuItems[14], quantity: 2, notes: '' },
      { menuItem: menuItems[70], quantity: 3, notes: '' },
    ],
    subtotal: 2070, tax: 207, discount: 0, total: 2277, notes: '', createdAt: new Date().toISOString(), customerName: 'Ahmed K.',
  },
];

export const dailySalesData = [
  { hour: '9AM', sales: 1200 }, { hour: '10AM', sales: 2800 },
  { hour: '11AM', sales: 4500 }, { hour: '12PM', sales: 8900 },
  { hour: '1PM', sales: 10200 }, { hour: '2PM', sales: 6800 },
  { hour: '3PM', sales: 4200 }, { hour: '4PM', sales: 3500 },
  { hour: '5PM', sales: 5200 }, { hour: '6PM', sales: 7800 },
  { hour: '7PM', sales: 11500 }, { hour: '8PM', sales: 9800 },
];

export const weeklySalesData = [
  { day: 'Mon', revenue: 24000 }, { day: 'Tue', revenue: 18900 },
  { day: 'Wed', revenue: 32000 }, { day: 'Thu', revenue: 27800 },
  { day: 'Fri', revenue: 41000 }, { day: 'Sat', revenue: 52000 },
  { day: 'Sun', revenue: 48000 },
];

export const topSellingItems = [
  { name: 'Mutton Karahi', sold: 145, revenue: 580000 },
  { name: 'Chicken Karahi Special', sold: 132, revenue: 277200 },
  { name: 'Kabli Pulao', sold: 98, revenue: 117600 },
  { name: 'Deal-1', sold: 87, revenue: 104400 },
  { name: 'Mutton Platter (Full)', sold: 76, revenue: 646000 },
];

export const testimonials = [
  { name: 'Ahmed Khan', rating: 5, text: 'The Shinwari karahi here is the best in town! Authentic flavors that remind me of Peshawar.', avatar: 'AK' },
  { name: 'Fatima Ali', rating: 5, text: 'Perfect family dining. The mutton platter is enormous and every item is cooked to perfection.', avatar: 'FA' },
  { name: 'Usman Malik', rating: 4, text: 'Great BBQ variety and the staff is always welcoming. The chicken malai boti is a must-try!', avatar: 'UM' },
  { name: 'Sana Rashid', rating: 5, text: 'From the special deals to the Kabli Pulao — everything is fresh and delicious. Highly recommended!', avatar: 'SR' },
];

export const galleryImages = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600',
  'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=600',
  'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
];
