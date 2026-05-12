export interface InventoryItem {
  id: string;
  _id?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  perishable: boolean;
  expiryDate?: string;
  supplier: string | { _id: string; name: string };
  lastRestocked?: string;
  restockHistory?: {
    quantity: number;
    costPerUnit: number;
    totalPrice: number;
    date?: string;
    note?: string;
  }[];
}

export type InventoryCategory = 'Meat' | 'Poultry' | 'Seafood' | 'Vegetables' | 'Dairy' | 'Spices' | 'Grains' | 'Beverages' | 'Oils' | 'Dry Goods' | 'Other';

export interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  action: 'added' | 'used' | 'wasted' | 'adjusted' | 'restocked' | 'transferred';
  quantity: number;
  price: number;
  unit?: string;
  note: string;
  timestamp: string;
  userId: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromLocation: string;
  toLocation: string;
  transferCategory: string;
  items: {
    itemId: string | { _id: string; name: string };
    itemName: string;
    quantity: number;
    unit: string;
    itemCategory?: string;
  }[];
  totalItems: number;
  status: 'pending' | 'completed' | 'cancelled';
  transferDate: string;
  note: string;
  createdBy: string | { _id: string; name: string };
}

export const transferCategories = [
  'Pakistani Section',
  'BBQ Section',
  'Shinwari Section',
  'Ice Cream Section',
  'Chinese Section',
  'Continental Section',
  'Beverage Section',
  'Chai Bar',
  'Tandoor',
  'General'
];

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  items: string[];
}

export const inventoryCategories: string[] = [
  'Meat', 'Poultry', 'Seafood', 'Vegetables', 'Dairy', 'Spices', 'Grains', 'Beverages', 'Oils', 'Dry Goods', 'Other'
];
