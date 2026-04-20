import { useMemo, useCallback, lazy, Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api/api';
import { useQuery } from '@tanstack/react-query';
import { usePosRealtimeScopes } from '@/hooks/pos/use-pos-realtime';
import { useSubmitLock } from '@/hooks/pos/use-submit-lock';
import { usePOSStore } from '@/stores/pos/posStore';
import { computePakistanTaxTotals } from '@/utils/pos/pakistanTax';
import { toast } from 'sonner';

// Lazy loading existing areas
const POSMenuArea = lazy(() => import('./components/POSMenuArea').then((m) => ({ default: m.POSMenuArea })));
const POSCartArea = lazy(() => import('./components/POSCartArea').then((m) => ({ default: m.POSCartArea })));

// New modular components
import { TablePickerModal } from './components/TablePickerModal';
import { ItemCustomizationModal } from './components/ItemCustomizationModal';
import { AddCustomItemModal } from './components/AddCustomItemModal';
import { DiscardOrderDialog } from './components/DiscardOrderDialog';

export default function POSScreen() {
  const { isLocked, runLocked } = useSubmitLock();
  const [searchParams] = useSearchParams();
  
  // Connect to Zustand store
  const store = usePOSStore();
  const {
    menuItems, setMenuItems,
    floors, setFloors,
    tables, setTables,
    taxRates, setTaxRates,
    cart, setCart,
    orderType, setOrderType,
    selectedTableId, setSelectedTableId,
    currentOrderForEdit, setCurrentOrderForEdit,
    deliveryCustomerName, setDeliveryCustomerName,
    deliveryPhone, setDeliveryPhone,
    deliveryAddress, setDeliveryAddress,
    gstEnabled,
    activeFloorId, setActiveFloorId
  } = store;

  // Data Initializing via React Query
  const initDataQuery = useQuery({
    queryKey: ['pos-init-data'],
    queryFn: () =>
      api<{
        menu: any[];
        floors: any[];
        tables: any[];
      }>('/init-data?include=menu,floors,tables'),
    staleTime: 5 * 60 * 1000,
  });

  // Sync Query data to Store
  useEffect(() => {
    if (initDataQuery.data?.menu) setMenuItems(initDataQuery.data.menu);
    if (initDataQuery.data?.floors) {
      const fs = initDataQuery.data.floors.map(x => ({ id: x.key, name: x.name }));
      setFloors(fs);
      if (fs.length && !fs.some(f => f.id === activeFloorId)) setActiveFloorId(fs[0].id);
    }
    if (initDataQuery.data?.tables) {
      setTables(initDataQuery.data.tables.map(x => ({
        id: x.number,
        name: x.name,
        seats: x.seats,
        floorId: x.floorKey,
        status: x.status,
        currentOrder: x.currentOrder,
      })));
    }
  }, [initDataQuery.data, setMenuItems, setFloors, setTables, setActiveFloorId, activeFloorId]);

  // Tax and Realtime Logic
  const loadTaxRates = useCallback(() => {
    api<{ salesTaxRate: number; serviceChargeRate: number }>('/settings/tax')
      .then((r) => {
        setTaxRates({
          gstRate: Number(r.salesTaxRate ?? 16) / 100,
          serviceChargeRate: Number(r.serviceChargeRate ?? 5) / 100,
        });
      })
      .catch(() => {});
  }, [setTaxRates]);

  useEffect(() => { loadTaxRates(); }, [loadTaxRates]);
  usePosRealtimeScopes(['settings'], loadTaxRates);

  // URL Parameter Handling
  useEffect(() => {
    const tableParam = searchParams.get('table');
    const tableId = tableParam ? Number(tableParam) : null;
    if (tableId && tables.some(t => t.id === tableId)) {
      setSelectedTableId(tableId);
      setOrderType('dine-in');
    }
  }, [searchParams, tables, setSelectedTableId, setOrderType]);

  // Derived state for pricing
  const subtotal = useMemo(() => 
    cart.reduce((s, c) => s + (c.menuItem.price + (c.extraPrice || 0)) * c.quantity, 0)
  , [cart]);

  const { gstAmount, totalTaxAmount, grandTotal, taxableAmount, serviceCharge } = useMemo(() => 
    computePakistanTaxTotals(subtotal, 0, gstEnabled, taxRates, { applyServiceCharge: orderType === 'dine-in' })
  , [subtotal, gstEnabled, taxRates, orderType]);

  const selectedTable = useMemo(() => 
    selectedTableId != null ? tables.find(t => t.id === selectedTableId) ?? null : null
  , [selectedTableId, tables]);

  // Order Submission Logic
  const handlePlaceOrder = () => {
    if (!cart.length) return;
    
    if (orderType === 'dine-in' && !selectedTable?.id) {
      toast.error('Please select a table first');
      return;
    }
    
    if (orderType === 'delivery' && (!deliveryCustomerName.trim() || !deliveryPhone.trim() || !deliveryAddress.trim())) {
      toast.error('Enter customer name, phone, and delivery address');
      return;
    }

    const createOrAppend = async () => {
      // Logic for appending to existing or creating new order
      const orderPayload = {
        type: orderType,
        table: orderType === 'dine-in' && selectedTable ? selectedTable.id : undefined,
        status: 'pending',
        customerName: orderType === 'delivery' ? deliveryCustomerName.trim() : undefined,
        phone: orderType === 'delivery' ? deliveryPhone.trim() : undefined,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
        subtotal,
        tax: totalTaxAmount,
        discount: 0,
        total: grandTotal,
        gstEnabled,
        items: cart,
      };

      if (orderType === 'dine-in' && selectedTable?.id) {
        if (currentOrderForEdit?.dbId) {
          await api(`/orders/${currentOrderForEdit.dbId}/edit-items`, { method: 'PATCH', body: JSON.stringify(orderPayload) });
          return 'updated';
        }
        const existing = await api<{ item: { dbId: string } | null }>(`/orders/open-by-table/${selectedTable.id}`);
        if (existing.item?.dbId) {
          await api(`/orders/${existing.item.dbId}/add-items`, { method: 'PATCH', body: JSON.stringify(orderPayload) });
          return 'updated';
        }
      }

      await api('/orders', { method: 'POST', body: JSON.stringify(orderPayload) });
      return 'created';
    };

    void runLocked('place-order', createOrAppend)
      .then(mode => {
        if (!mode) return;
        toast.success(mode === 'updated' ? 'Order updated in kitchen' : 'Order sent to kitchen');
        setCart([]);
        setCurrentOrderForEdit(null);
        if (orderType !== 'dine-in') {
          setDeliveryCustomerName('');
          setDeliveryPhone('');
          setDeliveryAddress('');
        } else {
          setSelectedTableId(null);
        }
      })
      .catch(() => toast.error('Failed to submit order'));
  };

  return (
    <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-7rem)] overflow-hidden">
      <Suspense fallback={<div className="flex-1 pos-card flex items-center justify-center">Loading Menu...</div>}>
        <POSMenuArea />
      </Suspense>

      <Suspense fallback={<div className="w-full lg:w-[30rem] pos-card flex items-center justify-center">Loading Cart...</div>}>
        <POSCartArea 
          subtotal={subtotal}
          taxableAmount={taxableAmount}
          serviceCharge={serviceCharge}
          totalTaxAmount={totalTaxAmount}
          grandTotal={grandTotal}
          gstAmount={gstAmount}
          onPlaceOrder={handlePlaceOrder}
          placeOrderDisabled={isLocked('place-order')}
          tablesQuery={initDataQuery}
          selectedTable={selectedTable}
        />
      </Suspense>

      {/* Extracted components now handle their own visibility via store */}
      <TablePickerModal />
      <ItemCustomizationModal />
      <AddCustomItemModal />
      <DiscardOrderDialog />
    </div>
  );
}

