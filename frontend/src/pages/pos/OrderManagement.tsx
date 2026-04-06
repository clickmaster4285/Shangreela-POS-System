import { useEffect, useState } from 'react';
import type { Order } from '@/data/mockData';
import { toast } from 'sonner';
import { ShoppingCart, X } from 'lucide-react';
import { api, type PaginatedResponse } from '@/lib/api';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  preparing: 'bg-primary/10 text-primary border-primary/20',
  ready: 'bg-success/10 text-success border-success/20',
  served: 'bg-secondary/10 text-secondary border-secondary/20',
  completed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ hasNext: false, hasPrev: false });

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        status: statusFilter,
        type: typeFilter,
      });
      const response = await api<PaginatedResponse<Order & { dbId: string }>>(`/orders?${params.toString()}`);
      setOrders(response.items);
      setMeta({ hasNext: response.pagination.hasNext, hasPrev: response.pagination.hasPrev });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load orders');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, typeFilter]);

  const updateStatus = (id: string, status: Order['status']) => {
    const order = orders.find(o => o.id === id) as (Order & { dbId?: string }) | undefined;
    if (!order?.dbId) return;
    api(`/orders/${order.dbId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      .then(() => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        toast.success(`Order ${id} → ${status}`);
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Update failed'));
  };

  const cancelOrder = (id: string) => {
    const order = orders.find(o => o.id === id) as (Order & { dbId?: string }) | undefined;
    if (!order?.dbId) return;
    if (order.status === 'completed') {
      toast.error('Cannot cancel a paid order');
      return;
    }
    if (order.status === 'served') {
      toast.error('Cannot cancel a served order');
      return;
    }
    if (!confirm(`Cancel order ${id}? This action cannot be undone.`)) return;
    api(`/orders/${order.dbId}/cancel`, { method: 'POST' })
      .then(() => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
        toast.success(`Order ${id} cancelled`);
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Cancel failed'));
  };

  const nextStatus = (s: Order['status']): Order['status'] | null => {
    const flow: Record<string, Order['status']> = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'served',
    };
    return flow[s] || null;
  };

  const dineInCount = orders.filter(o => o.type === 'dine-in').length;
  const deliveryCount = orders.filter(o => o.type === 'delivery').length;
  const takeawayCount = orders.filter(o => o.type === 'takeaway').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Order Management</h1>
        <p className="text-sm text-muted-foreground">Track and manage all orders.</p>
      </div>

      {/* Order type summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Dine-in', count: dineInCount, color: 'text-primary' },
          { label: 'Delivery', count: deliveryCount, color: 'text-warning' },
          { label: 'Takeaway', count: takeawayCount, color: 'text-success' },
        ].map(t => (
          <div key={t.label} className="pos-card flex items-center gap-4 cursor-pointer hover:border-primary/30" onClick={() => setTypeFilter(t.label.toLowerCase())}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className={`w-5 h-5 ${t.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.label}</p>
              <p className="font-serif text-xl font-bold text-foreground">{t.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground self-center mr-1">Status:</span>
          {['all', 'pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
              {s} {s !== 'all' && `(${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground self-center mr-1">Type:</span>
          {['all', 'dine-in', 'delivery', 'takeaway'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <div key={order.id} className="pos-card space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-foreground">{order.id}</p>
                <p className="text-xs text-muted-foreground capitalize">{order.type}{order.table ? ` • Table ${order.table}` : ''}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${statusColors[order.status]}`}>
                {order.status}
              </span>
            </div>

            <div className="space-y-1.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-foreground">{item.quantity}× {item.menuItem.name}</span>
                  <span className="text-muted-foreground">Rs. {(item.menuItem.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground">Order taker: {order.orderTaker || 'Unknown'}</div>

            {order.notes && <p className="text-xs text-primary italic">📝 {order.notes}</p>}

            <div className="flex justify-between items-center pt-2 border-t border-border gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Total bill</p>
                <p className="font-serif text-lg font-bold text-foreground">Rs. {order.total.toLocaleString()}</p>
              </div>
              <div className="flex gap-1">
                {nextStatus(order.status) && (
                  <button
                    onClick={() => updateStatus(order.id, nextStatus(order.status)!)}
                    className="bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-medium hover:bg-secondary transition-colors capitalize"
                  >
                    → {nextStatus(order.status)}
                  </button>
                )}
                {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'served' && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="bg-destructive/10 text-destructive px-3 py-2 rounded-xl text-xs font-medium hover:bg-destructive/15 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button disabled={!meta.hasPrev} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50">
          Previous
        </button>
        <button disabled={!meta.hasNext} onClick={() => setPage(p => p + 1)} className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  );
}
