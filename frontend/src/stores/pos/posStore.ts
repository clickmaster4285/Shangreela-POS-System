import { create } from 'zustand';
import { type CartItem, type MenuItem, type TableInfo } from '@/data/pos/mockData';
import { type PakistaniSubfolder } from '@/components/pos/Form';
import { computePakistanTaxTotals } from '@/utils/pos/pakistanTax';

interface POSState {
  // Data
  menuItems: MenuItem[];
  floors: { id: string; name: string }[];
  tables: TableInfo[];
  taxRates: { gstRate: number; serviceChargeRate: number };

  // UI State - Navigation
  openFolder: string | null;
  pakistaniSub: PakistaniSubfolder | null;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  pendingOrderType: 'dine-in' | 'takeaway' | 'delivery' | null;
  pendingNavigation: string | null;
  selectedTableId: number | null;
  currentOrderForEdit: { dbId: string; id: string } | null;
  activeFloorId: string;

  // UI State - Searches
  categorySearch: string;
  folderItemSearch: string;
  pakistaniSubSearch: string;

  // UI State - Modals & Overlays
  showTablePicker: boolean;
  showCustomItemModal: boolean;
  showDiscardPopup: boolean;
  customizingItem: MenuItem | null;

  // UI State - Delivery
  deliveryCustomerName: string;
  deliveryPhone: string;
  deliveryAddress: string;

  // UI State - Custom Item Form
  customItemName: string;
  customItemPrice: string;
  customItemQty: string;

  // UI State - Customize Item Form
  editingCartItemIndex: number | null;
  extraName: string;
  extraPrice: number | string;
  itemNotes: string;
  isCustomAddon: boolean;

  // Settings
  gstEnabled: boolean;
  cart: CartItem[];

  // Actions - Data
  setMenuItems: (items: MenuItem[]) => void;
  setFloors: (floors: { id: string; name: string }[]) => void;
  setTables: (tables: TableInfo[]) => void;
  setTaxRates: (rates: { gstRate: number; serviceChargeRate: number }) => void;
  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;

  // Actions - Cart Logic
  addToCart: (item: MenuItem, quantity?: number, notes?: string, extraN?: string, extraP?: number) => void;
  updateQty: (id: string, delta: number, notes?: string, extraN?: string, extraP?: number, absoluteQty?: number) => void;
  removeItem: (id: string, notes?: string, extraN?: string, extraP?: number) => void;
  addCustomItem: (name: string, price: number, qty: number) => void;
  updateCartItem: (index: number, updates: { notes?: string; extraName?: string; extraPrice?: number }) => void;

  // Actions - Navigation
  setOpenFolder: (folder: string | null) => void;
  setPakistaniSub: (sub: PakistaniSubfolder | null) => void;
  setOrderType: (type: 'dine-in' | 'takeaway' | 'delivery') => void;
  setPendingOrderType: (type: 'dine-in' | 'takeaway' | 'delivery' | null) => void;
  setPendingNavigation: (nav: string | null) => void;
  setSelectedTableId: (id: number | null) => void;
  setCurrentOrderForEdit: (order: { dbId: string; id: string } | null) => void;
  setActiveFloorId: (id: string) => void;

  // Actions - Search
  setCategorySearch: (v: string) => void;
  setFolderItemSearch: (v: string) => void;
  setPakistaniSubSearch: (v: string) => void;

  // Actions - Modals
  setShowTablePicker: (v: boolean) => void;
  setShowCustomItemModal: (v: boolean) => void;
  setShowDiscardPopup: (v: boolean) => void;
  setCustomizingItem: (item: MenuItem | null) => void;

  // Actions - Delivery
  setDeliveryCustomerName: (v: string) => void;
  setDeliveryPhone: (v: string) => void;
  setDeliveryAddress: (v: string) => void;

  // Actions - Custom Item
  setCustomItemName: (v: string) => void;
  setCustomItemPrice: (v: string) => void;
  setCustomItemQty: (v: string) => void;

  // Actions - Customize Item
  setEditingCartItemIndex: (v: number | null) => void;
  setExtraName: (v: string) => void;
  setExtraPrice: (v: number | string) => void;
  setItemNotes: (v: string) => void;
  setIsCustomAddon: (v: boolean) => void;

  // Actions - Settings
  setGstEnabled: (v: boolean) => void;

  // Helpers
  resetCustomItemForm: () => void;
  resetCustomizeForm: () => void;
}

export const usePOSStore = create<POSState>((set) => ({
  // Data Defaults
  menuItems: [],
  floors: [],
  tables: [],
  taxRates: { gstRate: 0.16, serviceChargeRate: 0.05 },

  // UI Defaults
  openFolder: 'All',
  pakistaniSub: null,
  orderType: 'dine-in',
  pendingOrderType: null,
  pendingNavigation: null,
  selectedTableId: null,
  currentOrderForEdit: null,
  activeFloorId: localStorage.getItem('pos_active_floor_id') || 'ground',

  categorySearch: '',
  folderItemSearch: '',
  pakistaniSubSearch: '',

  showTablePicker: false,
  showCustomItemModal: false,
  showDiscardPopup: false,
  customizingItem: null,

  deliveryCustomerName: '',
  deliveryPhone: '',
  deliveryAddress: '',

  customItemName: '',
  customItemPrice: '',
  customItemQty: '1',

  editingCartItemIndex: null,
  extraName: '',
  extraPrice: '',
  itemNotes: '',
  isCustomAddon: false,

  gstEnabled: localStorage.getItem('pos_gst_enabled') !== 'false',
  cart: [],

  // Basic Setters
  setMenuItems: (menuItems) => set({ menuItems }),
  setFloors: (floors) => set({ floors }),
  setTables: (tables) => set({ tables }),
  setTaxRates: (taxRates) => set({ taxRates }),
  setCart: (cart) => set((state) => ({ 
    cart: typeof cart === 'function' ? cart(state.cart) : cart 
  })),

  // Cart Logic
  addToCart: (item, quantity = 1, notes = '', extraN = '', extraP = 0) => {
    set((state) => {
      const targetId = String(item.id);
      const targetNotes = notes || '';
      const targetExtraN = extraN || '';
      const targetExtraP = Number(extraP || 0);

      const existingIndex = state.cart.findIndex(c => 
        String(c.menuItem.id) === targetId && 
        (c.notes || '') === targetNotes && 
        (c.extraName || '') === targetExtraN && 
        (Number(c.extraPrice || 0)) === targetExtraP
      );

      if (existingIndex > -1) {
        const newCart = [...state.cart];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + quantity
        };
        return { cart: newCart };
      }

      return { 
        cart: [...state.cart, { 
          menuItem: item, 
          quantity, 
          notes: targetNotes, 
          extraName: targetExtraN, 
          extraPrice: targetExtraP 
        }] 
      };
    });
  },

  updateQty: (id, delta, notes = '', extraN = '', extraP = 0, absoluteQty) => {
    set((state) => {
      const targetId = String(id);
      const targetNotes = notes || '';
      const targetExtraN = extraN || '';
      const targetExtraP = Number(extraP || 0);

      return {
        cart: state.cart
          .map(c =>
            (String(c.menuItem.id) === targetId && 
             (c.notes || '') === targetNotes && 
             (c.extraName || '') === targetExtraN && 
             (Number(c.extraPrice || 0)) === targetExtraP) 
              ? { ...c, quantity: absoluteQty !== undefined ? Math.max(0, absoluteQty) : Math.max(0, c.quantity + delta) } 
              : c
          )
          .filter(c => c.quantity > 0)
      };
    });
  },

  removeItem: (id, notes = '', extraN = '', extraP = 0) => {
    set((state) => {
      const targetId = String(id);
      const targetNotes = notes || '';
      const targetExtraN = extraN || '';
      const targetExtraP = Number(extraP || 0);

      return {
        cart: state.cart.filter(c => 
          !(String(c.menuItem.id) === targetId && 
            (c.notes || '') === targetNotes && 
            (c.extraName || '') === targetExtraN && 
            (Number(c.extraPrice || 0)) === targetExtraP)
        )
      };
    });
  },

  addCustomItem: (name, price, qty) => {
    const customId = `custom:${name.toLowerCase()}:${price}`;
    const customMenuItem: MenuItem = {
      id: customId,
      name,
      price,
      category: 'Custom',
      image: '',
      description: 'Waiter added custom item',
      available: true,
      perishable: false,
    };

    set((state) => {
      const existing = state.cart.find(c => c.menuItem.id === customId);
      if (existing) {
        return {
          cart: state.cart.map(c => (c.menuItem.id === customId ? { ...c, quantity: c.quantity + qty } : c))
        };
      }
      return { cart: [...state.cart, { menuItem: customMenuItem, quantity: qty, notes: '' }] };
    });
  },

  updateCartItem: (index: number, updates: { notes?: string; extraName?: string; extraPrice?: number }) => {
    set((state) => {
      const newCart = [...state.cart];
      if (newCart[index]) {
        newCart[index] = {
          ...newCart[index],
          notes: updates.notes !== undefined ? updates.notes : newCart[index].notes,
          extraName: updates.extraName !== undefined ? updates.extraName : newCart[index].extraName,
          extraPrice: updates.extraPrice !== undefined ? updates.extraPrice : newCart[index].extraPrice,
        };
      }
      return { cart: newCart };
    });
  },

  setOpenFolder: (openFolder) => set({ openFolder }),
  setPakistaniSub: (pakistaniSub) => set({ pakistaniSub }),
  setOrderType: (orderType) => set({ orderType }),
  setPendingOrderType: (pendingOrderType) => set({ pendingOrderType }),
  setPendingNavigation: (pendingNavigation) => set({ pendingNavigation }),
  setSelectedTableId: (selectedTableId) => set({ selectedTableId }),
  setCurrentOrderForEdit: (currentOrderForEdit) => set({ currentOrderForEdit }),
  setActiveFloorId: (activeFloorId) => {
    localStorage.setItem('pos_active_floor_id', activeFloorId);
    set({ activeFloorId });
  },

  setCategorySearch: (categorySearch) => set({ categorySearch }),
  setFolderItemSearch: (folderItemSearch) => set({ folderItemSearch }),
  setPakistaniSubSearch: (pakistaniSubSearch) => set({ pakistaniSubSearch }),

  setShowTablePicker: (showTablePicker) => set({ showTablePicker }),
  setShowCustomItemModal: (showCustomItemModal) => set({ showCustomItemModal }),
  setShowDiscardPopup: (showDiscardPopup) => set({ showDiscardPopup }),
  setCustomizingItem: (customizingItem) => set({ customizingItem }),

  setDeliveryCustomerName: (deliveryCustomerName) => set({ deliveryCustomerName }),
  setDeliveryPhone: (deliveryPhone) => set({ deliveryPhone }),
  setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),

  setCustomItemName: (customItemName) => set({ customItemName }),
  setCustomItemPrice: (customItemPrice) => set({ customItemPrice }),
  setCustomItemQty: (customItemQty) => set({ customItemQty }),

  setEditingCartItemIndex: (editingCartItemIndex) => set({ editingCartItemIndex }),
  setExtraName: (extraName) => set({ extraName }),
  setExtraPrice: (extraPrice) => set({ extraPrice }),
  setItemNotes: (itemNotes) => set({ itemNotes }),
  setIsCustomAddon: (isCustomAddon) => set({ isCustomAddon }),

  setGstEnabled: (gstEnabled) => {
    localStorage.setItem('pos_gst_enabled', gstEnabled.toString());
    set({ gstEnabled });
  },

  resetCustomItemForm: () => set({
    customItemName: '',
    customItemPrice: '',
    customItemQty: '1'
  }),

  resetCustomizeForm: () => set({
    editingCartItemIndex: null,
    extraName: '',
    extraPrice: '',
    itemNotes: '',
    isCustomAddon: false,
    customizingItem: null
  })
}));

