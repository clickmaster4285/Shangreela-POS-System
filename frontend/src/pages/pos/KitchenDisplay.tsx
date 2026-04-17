import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Order, TableInfo } from '@/data/mockData';
import { Clock, ChefHat, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, type PaginatedResponse } from '@/lib/api';
import { MAX_LIST_LIMIT, fetchAllPaginatedItems } from '@/lib/paginatedFetch';
import { usePosRealtimeScopes } from '@/hooks/use-pos-realtime';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<(Order & { dbId?: string })[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);

  const tableMap = useMemo(() => new Map<number, TableInfo>(tables.map(table => [table.id, table])), [tables]);

  const getLatestRequestItems = (order: Order) => {
    const items = (order.items || []) as Array<Order['items'][number] & { requestId?: string; requestAt?: string | Date }>;
    if (!items.length) return [];
    const latest = [...items]
      .filter(i => i.requestId)
      .sort((a, b) => {
        const da = new Date(String(a.requestAt || 0)).getTime();
        const db = new Date(String(b.requestAt || 0)).getTime();
        return db - da;
      })[0];
    if (!latest?.requestId) return items;
    return items.filter(i => i.requestId === latest.requestId);
  };

  const fetchTables = () =>
    api<PaginatedResponse<{ number: number; name: string; seats: number; floorKey: string; status: TableInfo['status']; currentOrder?: string }>>(
      `/tables?page=1&limit=${MAX_LIST_LIMIT}`
    ).then(r => {
      setTables(r.items.map(table => ({
        id: table.number,
        name: table.name,
        seats: table.seats,
        floorId: table.floorKey,
        status: table.status,
        currentOrder: table.currentOrder,
      })));
    });

  const fetchOrders = async () => {
    const items = await fetchAllPaginatedItems<Order & { dbId: string }>(
      (page, limit) => `/orders?status=all&page=${page}&limit=${limit}`,
      200
    );
    setOrders(items.filter(o => o.status !== 'completed' && o.status !== 'served'));
  };

  useEffect(() => {
    fetchTables().catch(() => toast.error('Failed to load table labels'));
    fetchOrders().catch(() => toast.error('Failed to load kitchen queue'));
  }, []);

  const refreshKitchen = useCallback(() => {
    fetchTables().catch(() => toast.error('Failed to load table labels'));
    fetchOrders().catch(() => toast.error('Failed to load kitchen queue'));
  }, []);

  usePosRealtimeScopes(['orders', 'tables'], refreshKitchen);

  const updateStatus = (id: string, status: Order['status']) => {
    const row = orders.find(o => o.id === id);
    if (!row?.dbId) return;
    api(`/orders/${row.dbId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      .then(() => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        toast.success(`Order ${id} → ${status}`);
      })
      .catch(() => toast.error('Failed to update order status'));
  };

  const cancelOrder = (id: string) => {
    const row = orders.find(o => o.id === id);
    if (!row?.dbId) return;
    if (!confirm(`Cancel order ${id}? Waiter/cashier will need to inform the customer.`)) return;
    api(`/orders/${row.dbId}/cancel`, { method: 'POST' })
      .then(() => {
        setOrders(prev => prev.filter(o => o.id !== id));
        toast.success(`Order ${id} cancelled`);
      })
      .catch(() => toast.error('Failed to cancel order'));
  };

  const getElapsed = () => {
    return Math.floor(Math.random() * 15) + 2;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Kitchen Display</h1>
        <p className="text-sm text-muted-foreground">Real-time order queue for kitchen staff.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <div key={order.id} className={`pos-card border-l-4 ${
            order.status === 'pending' ? 'border-l-warning' :
            order.status === 'preparing' ? 'border-l-primary' :
            'border-l-success'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-foreground text-lg">{order.id}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-xs text-muted-foreground capitalize">{order.type}</p>
                  {order.table && (
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                      {tableMap.get(order.table)?.name || `Table ${order.table}`}
                    </span>
                  )}
                </div>
                {order.orderTaker && <p className="text-[10px] text-muted-foreground mt-1">Order taker: {order.orderTaker}</p>}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{getElapsed()} min</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {getLatestRequestItems(order).map((item, i) => (
                <div key={i} className="p-2 rounded-lg bg-muted/50">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-foreground">{item.quantity}× {item.menuItem.name}</span>
                  </div>
                  {item.notes && <p className="text-xs text-primary mt-1">⚠ {item.notes}</p>}
                </div>
              ))}
            </div>

            {order.notes && <p className="text-xs text-primary italic mb-3">📝 {order.notes}</p>}

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <button onClick={() => updateStatus(order.id, 'preparing')} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-secondary transition-colors">
                  <ChefHat className="w-3.5 h-3.5" /> Start Cooking
                </button>
              )}
              {order.status === 'preparing' && (
                <button onClick={() => updateStatus(order.id, 'ready')} className="flex-1 bg-success text-cream py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
                  <CheckCircle className="w-3.5 h-3.5" /> Mark Ready
                </button>
              )}
              {order.status === 'ready' && (
                <span className="flex-1 text-center py-2.5 text-xs font-medium text-success">✓ Ready for pickup</span>
              )}
              {order.status !== 'ready' && order.status !== 'served' && (
                <button onClick={() => cancelOrder(order.id)} className="bg-destructive/10 text-destructive px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-destructive/15 transition-colors flex items-center justify-center gap-1.5">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
