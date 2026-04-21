import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Order, TableInfo } from '@/data/pos/mockData';
import { useAuth } from '@/contexts/auth/AuthContext';
import { api, type PaginatedResponse } from '@/lib/api/api';
import { MAX_LIST_LIMIT } from '@/lib/api/paginatedFetch';
import { formatOrderDateTime, groupOrdersByCalendarDay } from '@/utils/common/formatOrderDateTime';
import { usePosRealtimeScopes } from '@/hooks/pos/use-pos-realtime';
import { useSubmitLock } from '@/hooks/pos/use-submit-lock';
import { POSFilterBar } from '@/components/pos/POSFilterBar';
import { billBreakdownForOrder, computePakistanTaxTotals } from '@/utils/pos/pakistanTax';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Utensils, ShoppingBag, Truck } from 'lucide-react';

// New sub-components
import { BillList } from './components/BillList';
import { BillPaymentPanel } from './components/BillPaymentPanel';

export default function Billing() {
  const { isLocked, runLocked } = useSubmitLock();
  const { hasAction, user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Core State
  const [orders, setOrders] = useState<(Order & { dbId?: string; printed?: boolean })[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { dbId?: string; printed?: boolean }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [taxRates, setTaxRates] = useState({ gstRate: 0.16, serviceChargeRate: 0.05 });
  const [printedOrderIds, setPrintedOrderIds] = useState<Set<string>>(new Set());

  // Filter State
  const [billingStatusFilter, setBillingStatusFilter] = useState<'all' | 'paid' | 'pending' | 'ready'>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedCashier, setSelectedCashier] = useState<string>('all');
  const [showMyBillsOnly, setShowMyBillsOnly] = useState<boolean>(false);
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [selectedOrderType, setSelectedOrderType] = useState<string>('all');
  
  const [cashiers, setCashiers] = useState<{ key: string; name: string }[]>([]);
  const [floors, setFloors] = useState<{ key: string; name: string }[]>([]);

  // Local Storage persistence
  useEffect(() => {
    const saved = localStorage.getItem('printed_order_ids');
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids)) setPrintedOrderIds(new Set(ids));
      } catch {}
    }
    const savedFilter = localStorage.getItem('billing_status_filter');
    if (savedFilter && ['all', 'paid', 'pending', 'ready'].includes(savedFilter)) {
      setBillingStatusFilter(savedFilter as any);
    }
    const savedFloor = localStorage.getItem('billing_selected_floor');
    if (savedFloor) setSelectedFloor(savedFloor);
    const savedType = localStorage.getItem('billing_selected_type');
    if (savedType) setSelectedOrderType(savedType);
    const savedCashier = localStorage.getItem('billing_selected_cashier');
    if (savedCashier) setSelectedCashier(savedCashier);
    if (localStorage.getItem('billing_my_bills_only') === 'true') setShowMyBillsOnly(true);
  }, []);

  useEffect(() => { localStorage.setItem('billing_status_filter', billingStatusFilter); }, [billingStatusFilter]);
  useEffect(() => { localStorage.setItem('billing_selected_floor', selectedFloor); }, [selectedFloor]);
  useEffect(() => { localStorage.setItem('billing_selected_type', selectedOrderType); }, [selectedOrderType]);
  useEffect(() => { localStorage.setItem('billing_selected_cashier', selectedCashier); }, [selectedCashier]);
  useEffect(() => { localStorage.setItem('billing_my_bills_only', String(showMyBillsOnly)); }, [showMyBillsOnly]);
  useEffect(() => { localStorage.setItem('printed_order_ids', JSON.stringify(Array.from(printedOrderIds))); }, [printedOrderIds]);

  const markOrderAsPrinted = (orderId: string) => setPrintedOrderIds(prev => new Set([...prev, orderId]));
  const isOrderPrinted = (orderId: string) => printedOrderIds.has(orderId);

  const getBillStatusLabel = (order?: Order & { printed?: boolean }) => {
    if (!order) return 'Pending';
    if (order.status === 'completed') return 'Paid';
    if (order.printed || isOrderPrinted(order.id)) return 'Ready';
    return 'Pending';
  };

  const getStatusBadgeClass = (order?: Order & { printed?: boolean }) => {
    if (!order) return 'bg-warning/15 text-warning border-warning/30';
    if (order.status === 'completed') return 'bg-success/15 text-success border-success/30';
    if (order.printed || isOrderPrinted(order.id)) return 'bg-primary/15 text-primary border-primary/30';
    return 'bg-warning/15 text-warning border-warning/30';
  };

  const loadOrders = (pageNum = 1, append = false) => {
    setLoading(true);
    const params = new URLSearchParams({
      status: 'all',
      limit: '50',
      page: String(pageNum),
      today: 'false',
      from: startDate,
      to: endDate,
      floorKey: selectedFloor,
      search: tableSearchQuery,
    });

    if (selectedOrderType !== 'all') {
      params.append('type', selectedOrderType);
    }
    
    if (showMyBillsOnly && currentUser?.name) {
      params.append('orderTaker', currentUser.name);
    } else if (selectedCashier !== 'all') {
      params.append('orderTaker', selectedCashier);
    }

    return api<PaginatedResponse<Order & { dbId: string }>>(`/orders?${params.toString()}`).then(r => {
      const filteredResult = r.items.filter(o => o.status !== 'cancelled');
      const ordersWithPrinted = filteredResult.map(o => ({ ...o, printed: isOrderPrinted(o.id) }));

      setOrders(prev => {
        const next = append ? [...prev, ...ordersWithPrinted] : ordersWithPrinted;
        return next.sort((a, b) => {
          const getPrio = (o: any) => o.status === 'completed' ? 3 : (o.printed ? 2 : 1);
          const pA = getPrio(a);
          const pB = getPrio(b);
          if (pA !== pB) return pA - pB;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });

      setHasMore(r.pagination.hasNext);
      setPage(pageNum);
      
      setOrders(current => {
        setSelectedOrder(prev => {
          if (prev) {
            const match = current.find(a => a.id === prev.id);
            if (match) return match;
          }
          return null;
        });
        return current;
      });
    }).finally(() => setLoading(false));
  };

  const loadTables = () =>
    api<PaginatedResponse<any>>(`/tables?page=1&limit=${MAX_LIST_LIMIT}`).then(r => {
      const floorsList = Array.from(new Set(r.items.map((t: any) => t.floorKey).filter(Boolean)));
      setFloors(floorsList.map((k: any) => ({ key: k, name: k })));
      setTables(r.items.map((t: any) => ({
        id: t.number,
        name: t.name,
        seats: t.seats,
        floorId: t.floorKey,
        status: t.status,
        currentOrder: t.currentOrder,
      })));
  });

  const loadUsers = () => {
    api<PaginatedResponse<any>>('/users?limit=100').then(r => {
      const relevant = r.items.filter((u: any) => ['cashier', 'admin'].includes(u.role));
      setCashiers(relevant.map((u: any) => ({ key: u.name, name: u.name })));
    });
  };

  const loadTaxRates = useCallback(() => {
    api<{ salesTaxRate: number; serviceChargeRate: number }>('/settings/tax').then(r => {
      const gst = Number(r.salesTaxRate ?? 16) / 100;
      const sc = Number(r.serviceChargeRate ?? 5) / 100;
      setTaxRates({
        gstRate: Number.isFinite(gst) ? gst : 0.16,
        serviceChargeRate: Number.isFinite(sc) ? sc : 0.05,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => { loadOrders(); }, [startDate, endDate, selectedFloor, tableSearchQuery, selectedCashier, showMyBillsOnly, selectedOrderType]);
  useEffect(() => { loadTables(); loadUsers(); loadTaxRates(); }, []);

  usePosRealtimeScopes(['orders', 'tables', 'settings'], () => {
    loadOrders();
    loadTables();
    loadTaxRates();
  });

  const tableMap = useMemo(() => new Map<number, TableInfo>(tables.map(t => [t.id, t])), [tables]);

  const filteredOrders = useMemo(() => {
    if (billingStatusFilter === 'all') return orders;
    return orders.filter(o => {
      const status = o.status === 'completed' ? 'paid' : (o.printed ? 'ready' : 'pending');
      return status === billingStatusFilter;
    });
  }, [orders, billingStatusFilter]);

  const billsByDay = useMemo(() => groupOrdersByCalendarDay(filteredOrders, true), [filteredOrders]);

  const grandTotalForBillCard = (o: Order & { dbId?: string }) => {
    if (o.status === 'completed' && Number.isFinite(Number(o.total))) return Number(o.total);
    return billBreakdownForOrder(o, taxRates).grandTotal;
  };

  const stats = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status !== 'completed' && !o.printed).length,
      ready: orders.filter(o => o.status !== 'completed' && o.printed).length,
      paid: orders.filter(o => o.status === 'completed').length,
    };
  }, [orders]);

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-4">
      <POSFilterBar
        searchQuery={tableSearchQuery}
        onSearchChange={setTableSearchQuery}
        searchPlaceholder="Search table number or ID..."
        floors={floors}
        selectedFloor={selectedFloor}
        onFloorChange={setSelectedFloor}
        cashiers={cashiers}
        selectedCashier={selectedCashier}
        onCashierChange={setSelectedCashier}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={(start, end) => { setStartDate(start); setEndDate(end); }}
        showMyBillsOnly={showMyBillsOnly}
        onMyBillsToggle={setShowMyBillsOnly}
        extraFilters={
          <div className="flex items-center gap-3">
            {/* Order Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap">Type</label>
              <Select value={selectedOrderType} onValueChange={setSelectedOrderType}>
                <SelectTrigger className="w-[130px] h-9 bg-background border-border rounded-xl text-xs font-semibold focus:ring-primary/20">
                  <div className="flex items-center gap-2">
                    {selectedOrderType === 'dine-in' && <Utensils className="w-3.5 h-3.5 text-primary" />}
                    {selectedOrderType === 'takeaway' && <ShoppingBag className="w-3.5 h-3.5 text-primary" />}
                    {selectedOrderType === 'delivery' && <Truck className="w-3.5 h-3.5 text-primary" />}
                    <SelectValue placeholder="All types" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-xl">
                  <SelectItem value="all" className="text-xs font-medium">All Types</SelectItem>
                  <SelectItem value="dine-in" className="text-xs font-medium">Dine-in</SelectItem>
                  <SelectItem value="takeaway" className="text-xs font-medium">Takeaway</SelectItem>
                  <SelectItem value="delivery" className="text-xs font-medium">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

             {/* Status Filter */}
             <div className="flex shrink-0 items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border">
                {(['all', 'pending', 'ready', 'paid'] as const).map(f => (
                  <button key={f} onClick={() => setBillingStatusFilter(f)} 
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${billingStatusFilter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {f} ({stats[f]})
                  </button>
                ))}
             </div>
          </div>
        }
      />


      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden xl:grid-cols-[480px_minmax(0,1fr)]">
        <BillList 
          billsByDay={billsByDay}
          activeFilters={{
            status: billingStatusFilter,
            floor: selectedFloor,
            cashier: selectedCashier,
            startDate,
            endDate,
            type: selectedOrderType
          }}
          selectedOrderId={selectedOrder?.id}
          onSelectOrder={setSelectedOrder}
          hasMore={hasMore}
          loading={loading}
          onLoadMore={() => loadOrders(page + 1, true)}
          tableMap={tableMap}
          grandTotalForBillCard={grandTotalForBillCard}
          getStatusBadgeClass={getStatusBadgeClass}
          getBillStatusLabel={getBillStatusLabel}
          formatOrderDateTime={formatOrderDateTime}
        />

        <BillPaymentPanel 
          order={selectedOrder}
          tableMap={tableMap}
          taxRates={taxRates}
          currentUser={currentUser}
          hasAction={hasAction}
          onPaymentComplete={async () => {
            await loadOrders();
            queryClient.invalidateQueries({ queryKey: ['pos-tables', 'dashboard-overview', 'reports-dashboard', 'analytics-dashboard'] });
          }}
          markOrderAsPrinted={markOrderAsPrinted}
          isOrderPrinted={isOrderPrinted}
          runLocked={runLocked}
          isLocked={isLocked}
          getStatusBadgeClass={getStatusBadgeClass}
          getBillStatusLabel={getBillStatusLabel}
          formatOrderDateTime={formatOrderDateTime}
        />
      </div>
    </div>
  );
}

