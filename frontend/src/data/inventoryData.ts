export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  perishable: boolean;
  expiryDate?: string;
  supplier: string;
  lastRestocked: string;
}

export type InventoryCategory = 'Meat' | 'Poultry' | 'Seafood' | 'Vegetables' | 'Dairy' | 'Spices' | 'Grains' | 'Beverages' | 'Oils' | 'Dry Goods' | 'Other';

export interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  action: 'added' | 'used' | 'wasted' | 'adjusted' | 'restocked';
  quantity: number;
  note: string;
  timestamp: string;
  userId: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  items: string[];
}

export const inventoryCategories: InventoryCategory[] = [
  'Meat', 'Poultry', 'Seafood', 'Vegetables', 'Dairy', 'Spices', 'Grains', 'Beverages', 'Oils', 'Dry Goods', 'Other'
];

const today = new Date().toISOString().split('T')[0];
const inDays = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().split('T')[0];
};

export const defaultInventory: InventoryItem[] = [
  { id: '1', name: 'Lamb Meat', category: 'Meat', quantity: 50, unit: 'kg', minStock: 15, costPerUnit: 1800, perishable: true, expiryDate: inDays(3), supplier: 'Meat House', lastRestocked: today },
  { id: '2', name: 'Beef Meat', category: 'Meat', quantity: 40, unit: 'kg', minStock: 10, costPerUnit: 1200, perishable: true, expiryDate: inDays(3), supplier: 'Meat House', lastRestocked: today },
  { id: '3', name: 'Chicken (Whole)', category: 'Poultry', quantity: 80, unit: 'kg', minStock: 20, costPerUnit: 450, perishable: true, expiryDate: inDays(2), supplier: 'Al-Noor Poultry', lastRestocked: today },
  { id: '4', name: 'Chicken (Boneless)', category: 'Poultry', quantity: 30, unit: 'kg', minStock: 10, costPerUnit: 700, perishable: true, expiryDate: inDays(2), supplier: 'Al-Noor Poultry', lastRestocked: today },
  { id: '5', name: 'Rahu Fish', category: 'Seafood', quantity: 15, unit: 'kg', minStock: 5, costPerUnit: 900, perishable: true, expiryDate: inDays(1), supplier: 'Fisherman Port', lastRestocked: today },
  { id: '6', name: 'Finger Fish (Frozen)', category: 'Seafood', quantity: 10, unit: 'kg', minStock: 3, costPerUnit: 800, perishable: true, expiryDate: inDays(14), supplier: 'Fisherman Port', lastRestocked: today },
  { id: '7', name: 'Basmati Rice', category: 'Grains', quantity: 200, unit: 'kg', minStock: 50, costPerUnit: 250, perishable: false, supplier: 'Grain Mart', lastRestocked: today },
  { id: '8', name: 'Flour (Atta)', category: 'Grains', quantity: 150, unit: 'kg', minStock: 40, costPerUnit: 120, perishable: false, supplier: 'Grain Mart', lastRestocked: today },
  { id: '9', name: 'Cooking Oil', category: 'Oils', quantity: 60, unit: 'liter', minStock: 15, costPerUnit: 400, perishable: false, supplier: 'Wholesale Market', lastRestocked: today },
  { id: '10', name: 'Ghee', category: 'Oils', quantity: 30, unit: 'kg', minStock: 8, costPerUnit: 2200, perishable: false, supplier: 'Wholesale Market', lastRestocked: today },
  { id: '11', name: 'Onions', category: 'Vegetables', quantity: 100, unit: 'kg', minStock: 30, costPerUnit: 120, perishable: true, expiryDate: inDays(7), supplier: 'Sabzi Mandi', lastRestocked: today },
  { id: '12', name: 'Tomatoes', category: 'Vegetables', quantity: 60, unit: 'kg', minStock: 20, costPerUnit: 150, perishable: true, expiryDate: inDays(4), supplier: 'Sabzi Mandi', lastRestocked: today },
  { id: '13', name: 'Green Chili', category: 'Vegetables', quantity: 15, unit: 'kg', minStock: 5, costPerUnit: 200, perishable: true, expiryDate: inDays(3), supplier: 'Sabzi Mandi', lastRestocked: today },
  { id: '14', name: 'Ginger', category: 'Spices', quantity: 10, unit: 'kg', minStock: 3, costPerUnit: 500, perishable: true, expiryDate: inDays(7), supplier: 'Spice King', lastRestocked: today },
  { id: '15', name: 'Garlic', category: 'Spices', quantity: 12, unit: 'kg', minStock: 4, costPerUnit: 400, perishable: true, expiryDate: inDays(10), supplier: 'Spice King', lastRestocked: today },
  { id: '16', name: 'Yogurt', category: 'Dairy', quantity: 25, unit: 'kg', minStock: 8, costPerUnit: 200, perishable: true, expiryDate: inDays(3), supplier: 'Dairy Fresh', lastRestocked: today },
  { id: '17', name: 'Butter', category: 'Dairy', quantity: 10, unit: 'kg', minStock: 3, costPerUnit: 1800, perishable: true, expiryDate: inDays(14), supplier: 'Dairy Fresh', lastRestocked: today },
  { id: '18', name: 'Cheese', category: 'Dairy', quantity: 8, unit: 'kg', minStock: 3, costPerUnit: 1500, perishable: true, expiryDate: inDays(14), supplier: 'Dairy Fresh', lastRestocked: today },
  { id: '19', name: 'Soft Drinks (Cans)', category: 'Beverages', quantity: 200, unit: 'pcs', minStock: 50, costPerUnit: 80, perishable: false, supplier: 'Beverages Co', lastRestocked: today },
  { id: '20', name: 'Mineral Water', category: 'Beverages', quantity: 150, unit: 'pcs', minStock: 40, costPerUnit: 30, perishable: false, supplier: 'Beverages Co', lastRestocked: today },
  { id: '21', name: 'Mixed Spice Powder', category: 'Spices', quantity: 20, unit: 'kg', minStock: 5, costPerUnit: 800, perishable: false, supplier: 'Spice King', lastRestocked: today },
  { id: '22', name: 'Red Chili Powder', category: 'Spices', quantity: 15, unit: 'kg', minStock: 4, costPerUnit: 600, perishable: false, supplier: 'Spice King', lastRestocked: today },
  { id: '23', name: 'Salt', category: 'Dry Goods', quantity: 30, unit: 'kg', minStock: 10, costPerUnit: 50, perishable: false, supplier: 'Wholesale Market', lastRestocked: today },
  { id: '24', name: 'Sugar', category: 'Dry Goods', quantity: 25, unit: 'kg', minStock: 8, costPerUnit: 150, perishable: false, supplier: 'Wholesale Market', lastRestocked: today },
  { id: '25', name: 'Lemons', category: 'Vegetables', quantity: 20, unit: 'kg', minStock: 5, costPerUnit: 250, perishable: true, expiryDate: inDays(5), supplier: 'Sabzi Mandi', lastRestocked: today },
];

export const defaultSuppliers: Supplier[] = [
  { id: '1', name: 'Meat House', phone: '0300-1234567', email: 'meathouse@mail.com', address: 'Saddar, Rawalpindi', items: ['Lamb Meat', 'Beef Meat'] },
  { id: '2', name: 'Al-Noor Poultry', phone: '0301-2345678', email: 'alnoor@mail.com', address: 'Commercial Market, Rawalpindi', items: ['Chicken (Whole)', 'Chicken (Boneless)'] },
  { id: '3', name: 'Fisherman Port', phone: '0302-3456789', email: 'fishport@mail.com', address: 'Fish Market, Islamabad', items: ['Rahu Fish', 'Finger Fish'] },
  { id: '4', name: 'Sabzi Mandi', phone: '0303-4567890', email: 'sabzi@mail.com', address: 'Sabzi Mandi, Rawalpindi', items: ['Onions', 'Tomatoes', 'Green Chili', 'Lemons'] },
  { id: '5', name: 'Grain Mart', phone: '0304-5678901', email: 'grain@mail.com', address: 'Aabpara Market, Islamabad', items: ['Basmati Rice', 'Flour'] },
  { id: '6', name: 'Spice King', phone: '0305-6789012', email: 'spiceking@mail.com', address: 'Raja Bazar, Rawalpindi', items: ['Ginger', 'Garlic', 'Mixed Spice', 'Red Chili'] },
  { id: '7', name: 'Dairy Fresh', phone: '0306-7890123', email: 'dairy@mail.com', address: 'Blue Area, Islamabad', items: ['Yogurt', 'Butter', 'Cheese'] },
  { id: '8', name: 'Wholesale Market', phone: '0307-8901234', email: 'wholesale@mail.com', address: 'I-9 Industrial, Islamabad', items: ['Cooking Oil', 'Ghee', 'Salt', 'Sugar'] },
  { id: '9', name: 'Beverages Co', phone: '0308-9012345', email: 'beverages@mail.com', address: 'I-10 Markaz, Islamabad', items: ['Soft Drinks', 'Mineral Water'] },
];

export const defaultInventoryLogs: InventoryLog[] = [
  { id: '1', itemId: '3', itemName: 'Chicken (Whole)', action: 'restocked', quantity: 80, note: 'Morning delivery', timestamp: new Date().toISOString(), userId: '1' },
  { id: '2', itemId: '1', itemName: 'Lamb Meat', action: 'restocked', quantity: 50, note: 'Morning delivery', timestamp: new Date().toISOString(), userId: '1' },
  { id: '3', itemId: '11', itemName: 'Onions', action: 'restocked', quantity: 100, note: 'Weekly restock', timestamp: new Date().toISOString(), userId: '1' },
];
