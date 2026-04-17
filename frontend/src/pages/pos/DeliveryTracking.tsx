import { useState } from 'react';
import { Truck, MapPin, Clock, CheckCircle2, Package, Phone } from 'lucide-react';
import { formatOrderDateTime } from '@/utils/formatOrderDateTime';

type DeliveryStatus = 'pending' | 'out_for_delivery' | 'delivered';

interface DeliveryOrder {
  id: string;
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  items: string[];
  total: number;
  status: DeliveryStatus;
  assignedRider: string;
  estimatedTime: string;
  orderStatus?: string;
  createdAt?: string;
}

import { api, type PaginatedResponse } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type DeliveryListResponse = PaginatedResponse<DeliveryOrder> & {
  statusCounts?: Record<string, number>;
};

const statusConfig: Record<DeliveryStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-primary/10 text-primary border-primary/20', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
};

const formatCookingStatus = (status: string | undefined) =>
  status
    ? status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (match) => match.toUpperCase())
    : 'Unknown';

export default function DeliveryTracking() {
  const [filter, setFilter] = useState<'all' | DeliveryStatus>('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const deliveriesQuery = useQuery({
    queryKey: ['deliveries', page, filter],
    queryFn: () => {
      const statusParam = filter !== 'all' ? `&status=${encodeURIComponent(filter)}` : '';
      return api<DeliveryListResponse>(`/deliveries?page=${page}&limit=50${statusParam}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DeliveryStatus }) =>
      api(`/deliveries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });

  const deliveries = deliveriesQuery.data?.items ?? [];

  const statusCounts = deliveriesQuery.data?.statusCounts;

  const updateStatus = (id: string, status: DeliveryStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const counts = statusCounts
    ? {
        pending: statusCounts.pending ?? 0,
        out_for_delivery: statusCounts.out_for_delivery ?? 0,
        delivered: statusCounts.delivered ?? 0,
      }
    : {
        pending: deliveries.filter(d => d.status === 'pending').length,
        out_for_delivery: deliveries.filter(d => d.status === 'out_for_delivery').length,
        delivered: deliveries.filter(d => d.status === 'delivered').length,
      };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Delivery Tracking</h1>
        <p className="text-sm text-muted-foreground">Track and manage all delivery orders.</p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {([
          { key: 'pending' as const, label: 'Pending', icon: Clock, count: counts.pending, color: 'text-warning' },
          { key: 'out_for_delivery' as const, label: 'Out for Delivery', icon: Truck, count: counts.out_for_delivery, color: 'text-primary' },
          { key: 'delivered' as const, label: 'Delivered', icon: CheckCircle2, count: counts.delivered, color: 'text-success' },
        ]).map(s => (
          <div key={s.key} className="pos-card flex items-center gap-4 cursor-pointer hover:border-primary/30" onClick={() => { setFilter(s.key); setPage(1); }}>
            <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-serif text-2xl font-bold text-foreground">{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'out_for_delivery', 'delivered'] as const).map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}
          >
            {s === 'out_for_delivery' ? 'Out for Delivery' : s} {s !== 'all' && `(${counts[s]})`}
          </button>
        ))}
      </div>

      {/* Delivery cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveries.map(delivery => {
          const config = statusConfig[delivery.status];
          const StatusIcon = config.icon;
          return (
            <div key={delivery.id} className="pos-card space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-foreground">{delivery.orderId}</p>
                  <p className="text-xs text-muted-foreground">Order ID</p>
                  {delivery.createdAt && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{formatOrderDateTime(delivery.createdAt)}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Kitchen status: <span className="text-foreground font-medium">{formatCookingStatus(delivery.orderStatus)}</span>
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${config.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Package className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground">{delivery.customerName}</div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-sm text-muted-foreground">{delivery.phone}</div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-sm text-muted-foreground">{delivery.address}</div>
                </div>
                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-sm text-muted-foreground">Rider: {delivery.assignedRider}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Items: {(delivery.items ?? []).join(', ')}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <div>
                  <p className="font-serif text-lg font-bold text-foreground">
                    Rs. {Number(delivery.total ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">ETA: {delivery.estimatedTime}</p>
                </div>
                <div className="flex gap-1">
                  {delivery.status === 'pending' && (
                    <button onClick={() => updateStatus(delivery.id, 'out_for_delivery')}
                      className="bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-secondary transition-colors">
                      Dispatch
                    </button>
                  )}
                  {delivery.status === 'out_for_delivery' && (
                    <button onClick={() => updateStatus(delivery.id, 'delivered')}
                      className="bg-success/90 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-success transition-colors">
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <button
          disabled={!deliveriesQuery.data?.pagination?.hasPrev}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50"
        >
          Previous
        </button>
        <button
          disabled={!deliveriesQuery.data?.pagination?.hasNext}
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
