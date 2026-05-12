import { useEffect, useState } from 'react';
import { api } from '@/lib/api/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePosRealtimeScopes } from '@/hooks/pos/use-pos-realtime';
import { useOrderStore } from '@/stores/pos/orderStore';
import { useDebounce } from '@/hooks/common/use-debounce'; 
import { OrderCard } from './components/OrderCard';
import { EditOrderDialog } from './components/EditOrderDialog';
import { CancelOrderDialog } from './components/CancelOrderDialog';
import { SwitchTypeDialog } from './components/SwitchTypeDialog';
import { POSFilterBar } from '@/components/pos/POSFilterBar';
import { MenuItem, TableInfo } from '@/data/pos/mockData';
import { RefreshCcw } from 'lucide-react';

export default function OrderManagement() {
  const queryClient = useQueryClient();
  const store = useOrderStore();
  const { filters, setFilters, page, setPage, pageSize, setSwitchingTypeOrder } = store;

  // Debounce the search query
  const debouncedSearch = useDebounce(filters.search, 500);

  // Static data for filters
  const [floors, setFloors] = useState<{ id: string; key: string; name: string }[]>([]);
  const [cashiers, setCashiers] = useState<{ key: string; name: string }[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Main Orders Query - Use debounced search
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['orders-management', filters, page, pageSize, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        status: filters.status,
        type: filters.type,
        floorKey: filters.floor,
        orderTaker: filters.cashier,
        search: debouncedSearch,
      });
      if (filters.dateRange) {
        params.append('from', filters.dateRange.from);
        params.append('to', filters.dateRange.to);
      }
      return api<{ items: any[]; pagination: any }>(`/orders?${params.toString()}`);
    },
  });

  // Initialization Data
  const initDataQuery = useQuery({
    queryKey: ['order-mgmt-init'],
    queryFn: () => api<{
      floors: any[];
      users: any[];
      tables: any[];
      menu: any[];
    }>('/init-data?include=floors,users,tables,menu'),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (initDataQuery.data) {
      setFloors(initDataQuery.data.floors.map(f => ({ id: f.key, key: f.key, name: f.name })));
      setCashiers(initDataQuery.data.users.map(u => ({ key: u.name, name: u.name })));
      setTables(initDataQuery.data.tables.map(t => ({
        id: t.number,
        name: t.name,
        seats: t.seats,
        floorId: t.floorKey,
        status: t.status,
      })));
      setMenuItems(initDataQuery.data.menu);
    }
  }, [initDataQuery.data]);

  const updateStatusMutation = useMutation({
    mutationFn: (args: { id: string, status: string }) =>
      api(`/orders/${args.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: args.status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-management'] });
      toast.success('Order status updated');
    },
    onError: () => toast.error('Failed to update status')
  });

  usePosRealtimeScopes(['orders', 'tables'], () => refetch());

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
      <div className="shrink-0 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Order Management</h1>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
            Real-time Kitchen Operations & Terminal Insights
          </p>
        </div>

        <POSFilterBar
          searchQuery={filters.search}
          onSearchChange={(search) => setFilters({ search })}
          searchPlaceholder="Order ID, Table, or Customer..."
          floors={floors}
          selectedFloor={filters.floor}
          onFloorChange={(floor) => setFilters({ floor })}
          cashiers={cashiers}
          selectedCashier={filters.cashier}
          onCashierChange={(cashier) => setFilters({ cashier })}
          startDate={filters.dateRange?.from || ''}
          endDate={filters.dateRange?.to || ''}
          onDateRangeChange={(from, to) => setFilters({ dateRange: from && to ? { from, to } : null })}
          extraFilters={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex shrink-0 items-center gap-1 bg-muted/20 p-1 rounded-2xl border border-border/50">
                {['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilters({ status: s })}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters.status === s ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-1 bg-muted/20 p-1 rounded-2xl border border-border/50">
                {['all', 'dine-in', 'takeaway', 'delivery'].map(t => (
                  <button
                    key={t}
                    onClick={() => setFilters({ type: t })}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters.type === t ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-card/60 border border-border/50 rounded-3xl" />
            ))}
          </div>
        ) : ordersData?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 ring-8 ring-muted/20">
              <RefreshCcw className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-black uppercase tracking-[0.2em] text-foreground mb-3">No Orders Found for applied filters</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[400px]">
              Date Range: <span className="font-bold text-foreground">{filters.dateRange?.from || 'Any'}</span> to <span className="font-bold text-foreground">{filters.dateRange?.to || 'Any'}</span>.
              <br />Status: <span className="font-bold text-foreground capitalize">{filters.status}</span>
              <br />Type: <span className="font-bold text-foreground capitalize">{filters.type}</span>
              <br />Floor: <span className="font-bold text-foreground capitalize">{filters.floor}</span>
              <br />Cashier: <span className="font-bold text-foreground capitalize">{filters.cashier}</span>
              {debouncedSearch && <><br />Search: <span className="font-bold text-foreground">{debouncedSearch}</span></>}
              <br /><br />
              Please adjust your date filter or the criteria above to see more orders.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
            {ordersData?.items.map(order => (
              <OrderCard
                key={order.dbId}
                order={order}
                onUpdateStatus={handleUpdateStatus}
                tables={tables}
              />
            ))}
          </div>
        )}

        <div className="mt-12 mb-6 flex items-center justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-6 py-3 rounded-2xl border border-border bg-card font-black text-[10px] uppercase tracking-widest hover:bg-muted disabled:opacity-30 transition-all"
          >
            Prev
          </button>
          <span className="text-[10px] font-black text-foreground uppercase tracking-widest px-4 border-x border-border">
            Page {page} of {ordersData?.pagination?.pages || 1}
          </span>
          <button
            disabled={page >= (ordersData?.pagination?.pages || 1)}
            onClick={() => setPage(page + 1)}
            className="px-6 py-3 rounded-2xl border border-border bg-card font-black text-[10px] uppercase tracking-widest hover:bg-muted disabled:opacity-30 transition-all"
          >
            Next
          </button>
        </div>
      </div>

      {/* Dialogs */}
      <EditOrderDialog
        menuItems={menuItems}
        onSuccess={() => refetch()}
      />
      <CancelOrderDialog
        onSuccess={() => refetch()}
      />
      <SwitchTypeDialog
        tables={tables}
        floors={floors}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
