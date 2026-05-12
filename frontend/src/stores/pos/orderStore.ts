import { create } from 'zustand';

interface OrderFilters {
  status: string;
  type: string;
  floor: string;
  cashier: string;
  dateRange: { from: string; to: string } | null;
  search: string;
}

interface OrderManagementState {
  // Filters
  filters: OrderFilters;
  debouncedSearch: string;
  
  // Pagination
  page: number;
  pageSize: number;

  // Dialogs
  editingOrder: any | null;
  cancellingOrderId: string | null;
  switchingTypeOrder: any | null;
  showFilters: boolean;

  // Actions
  setFilters: (filters: Partial<OrderFilters>) => void;
  setDebouncedSearch: (v: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  setEditingOrder: (order: any | null) => void;
  setCancellingOrderId: (id: string | null) => void;
  setSwitchingTypeOrder: (order: any | null) => void;
  setShowFilters: (v: boolean) => void;
  
  resetFilters: () => void;
}

const todayDate = new Date().toISOString().split('T')[0];

export const useOrderStore = create<OrderManagementState>((set) => ({
  filters: {
    status: 'all',
    type: 'all',
    floor: 'all',
    cashier: 'all',
    dateRange: { from: todayDate, to: todayDate },
    search: '',
  },
  debouncedSearch: '',
  page: 1,
  pageSize: 12,

  editingOrder: null,
  cancellingOrderId: null,
  switchingTypeOrder: null,
  showFilters: false,

  setFilters: (newFilters) => set((state) => ({ 
    filters: { ...state.filters, ...newFilters },
    page: 1 // Reset pagination on filter change
  })),
  
  setDebouncedSearch: (debouncedSearch) => set({ debouncedSearch }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),

  setEditingOrder: (editingOrder) => set({ editingOrder }),
  setCancellingOrderId: (cancellingOrderId) => set({ cancellingOrderId }),
  setSwitchingTypeOrder: (switchingTypeOrder) => set({ switchingTypeOrder }),
  setShowFilters: (showFilters) => set({ showFilters }),

  resetFilters: () => set({
    filters: {
      status: 'all',
      type: 'all',
      floor: 'all',
      cashier: 'all',
      dateRange: { from: todayDate, to: todayDate },
      search: '',
    },
    page: 1
  })
}));
