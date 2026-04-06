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
