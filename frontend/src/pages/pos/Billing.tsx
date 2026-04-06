import { useEffect, useState } from 'react';
import type { Order } from '@/data/mockData';
import { CreditCard, Banknote, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { printReceipt } from '@/utils/printReceipt';
import { computePakistanTaxTotals, PKR_GST_RATE } from '@/utils/pakistanTax';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export default function Billing() {
  const { hasAction } = useAuth();
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<(Order & { dbId?: string })[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { dbId?: string }) | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [gstEnabled, setGstEnabled] = useState(true);

  const loadOrders = () =>
    api<{ items: (Order & { dbId: string })[] }>('/orders?status=all&limit=200&page=1').then(r => {
      const filteredOrders = r.items.filter(o => o.status !== 'cancelled');
      setOrders(filteredOrders);
      setSelectedOrder(prev => {
        if (prev) {
          const same = filteredOrders.find(a => a.id === prev.id);
          if (same) return same;
        }
        return filteredOrders[0] ?? null;
      });
    });

  useEffect(() => {
    loadOrders().catch(() => toast.error('Failed to load active bills'));
  }, []);

  if (!selectedOrder) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">No active table order to bill right now.</p>
        </div>
      </div>
    );
  }

  const subtotal = selectedOrder.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
  const discountAmt = subtotal * (discount / 100);
  const { gstAmount, furtherTaxAmount, totalTaxAmount, grandTotal, taxableAmount } = computePakistanTaxTotals(
    subtotal,
    discountAmt,
    gstEnabled
  );

  const fmt = (v: number) => `Rs. ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const getBillStatusLabel = (status?: string) => (status === 'completed' ? 'Paid' : 'Pending');
  const pendingCount = orders.filter(o => o.status !== 'completed').length;
  const paidCount = orders.filter(o => o.status === 'completed').length;
  const getStatusBadgeClass = (status?: string) =>
    status === 'completed' ? 'bg-success/15 text-success border-success/30' : 'bg-warning/15 text-warning border-warning/30';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">Professional billing desk with live bill status and payment control.</p>
        </div>
        <button
          type="button"
          onClick={() => loadOrders().then(() => toast.success('Bills refreshed')).catch(() => toast.error('Failed to refresh bills'))}
          className="px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs font-medium hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          Refresh Bills
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="pos-card">
          <p className="text-xs text-muted-foreground">Total Bills</p>
          <p className="text-2xl font-bold text-foreground mt-1">{orders.length}</p>
        </div>
        <div className="pos-card">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-warning mt-1">{pendingCount}</p>
        </div>
        <div className="pos-card">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-success mt-1">{paidCount}</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
        {/* Order selector & details */}
        <div className="pos-card p-3.5 shadow-sm">
          <h3 className="font-semibold text-sm text-foreground mb-3 px-1">Order Panel</h3>
          <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1 scrollbar-thin">
              {orders.map(o => (
                <button key={o.id} onClick={() => setSelectedOrder(o)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedOrder.id === o.id
                      ? 'bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/15'
                      : 'bg-muted/30 border-border hover:bg-muted/60 hover:border-primary/30'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-sm text-foreground">{o.id}</span>
                    <span className="text-sm font-semibold text-foreground">Rs. {o.total.toLocaleString()}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground capitalize">{o.type}{o.table ? ` • Table ${o.table}` : ''}</span>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${getStatusBadgeClass(o.status)}`}>
                      {getBillStatusLabel(o.status)}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Receipt */}
        <div className="pos-card p-5 shadow-sm">
          <div className="text-center mb-5 pb-4 border-b border-border border-dashed">
            <h2 className="font-serif text-xl font-bold text-foreground">Shiraz Restaurant</h2>
            <p className="text-xs text-muted-foreground">123 Royal Avenue, Islamabad</p>
            <p className="text-xs text-muted-foreground">Tel: +92 51 1234567</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-sm mb-4">
            <div className="flex justify-between text-muted-foreground"><span>Order</span><span>{selectedOrder.id}</span></div>
            <div className="flex justify-between text-muted-foreground capitalize"><span>Type</span><span>{selectedOrder.type}</span></div>
            {selectedOrder.table && <div className="flex justify-between text-muted-foreground"><span>Table</span><span>{selectedOrder.table}</span></div>}
            {selectedOrder.orderTaker && <div className="flex justify-between text-muted-foreground"><span>Order taker</span><span>{selectedOrder.orderTaker}</span></div>}
            <div className="flex justify-between text-muted-foreground items-center">
              <span>Status</span>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${getStatusBadgeClass(selectedOrder.status)}`}>
                {getBillStatusLabel(selectedOrder.status)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/35 p-3 space-y-2 mb-4">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground">ORDER ITEMS</h3>
            {selectedOrder.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.quantity}× {item.menuItem.name}</span>
                <span className="font-medium">Rs. {(item.menuItem.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/70 p-3 space-y-2 text-sm mb-4 bg-card/60">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-success"><span>Discount ({discount}%)</span><span>-{fmt(discountAmt)}</span></div>}
            <div className="flex justify-between text-muted-foreground"><span>Taxable value</span><span>{fmt(taxableAmount)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>GST ({gstEnabled ? Math.round(PKR_GST_RATE * 100) : 0}%)</span><span>{fmt(gstAmount)}</span></div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>Total taxes</span><span>{fmt(totalTaxAmount)}</span></div>
            <div className="flex justify-between font-serif text-xl font-bold text-foreground pt-2 border-t border-border">
              <span>Total</span><span>{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Discount */}
          {hasAction('apply_discount') && (
          <div className="mb-4 rounded-xl border border-border/70 p-3">
            <label className="text-xs text-muted-foreground mb-1 block">Discount %</label>
            <div className="flex gap-2">
              {[0, 5, 10, 15, 20].map(d => (
                <button key={d} onClick={() => setDiscount(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${discount === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {d}%
                </button>
              ))}
            </div>
          </div>
          )}

          {/* GST Toggle */}
          <div className="mb-4 rounded-xl border border-border/70 p-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={gstEnabled}
                onChange={(e) => setGstEnabled(e.target.checked)}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary/30"
              />
              Include GST ({Math.round(PKR_GST_RATE * 100)}%)
            </label>
          </div>

          {/* Payment */}
          <div className="mb-4 rounded-xl border border-border/70 p-3">
            <label className="text-xs text-muted-foreground mb-1 block">Payment Method</label>
            <div className="flex gap-2">
              <button onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${paymentMethod === 'cash' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                <Banknote className="w-4 h-4" /> Cash
              </button>
              <button onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${paymentMethod === 'card' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                <CreditCard className="w-4 h-4" /> Card
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-2">
            <button
              onClick={() => {
                if (!selectedOrder.dbId) {
                  toast.error('Order cannot be deleted');
                  return;
                }
                api(`/orders/${selectedOrder.dbId}`, { method: 'DELETE' })
                  .then(() => {
                    toast.success('Order deleted');
                    loadOrders();
                  })
                  .catch(() => toast.error('Failed to delete order'));
              }}
              className="py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-destructive/15 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
            <button onClick={() => {
              printReceipt({
                orderId: selectedOrder.id, orderType: selectedOrder.type, table: selectedOrder.table,
                items: selectedOrder.items, subtotal, discount: discountAmt, discountPercent: discount,
                paymentMethod, customerName: selectedOrder.customerName,
              });
              toast.success('Receipt sent to printer!');
            }} className="py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-muted/80 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => {
              if (selectedOrder.status === 'completed') {
                toast.info('This bill is already paid');
                return;
              }
              printReceipt({
                orderId: selectedOrder.id, orderType: selectedOrder.type, table: selectedOrder.table,
                items: selectedOrder.items, subtotal, discount: discountAmt, discountPercent: discount,
                paymentMethod, customerName: selectedOrder.customerName,
              });
              if (selectedOrder.dbId) {
                api(`/orders/${selectedOrder.dbId}/payment`, { method: 'POST', body: JSON.stringify({ paymentMethod }) })
                  .then(() => {
                    toast.success('Payment completed and receipt printed');
                    loadOrders();
                    queryClient.invalidateQueries({ queryKey: ['pos-tables'] });
                  })
                  .catch(() => toast.error('Payment failed'));
              } else {
                toast.success('Payment processed!');
              }
            }} className="py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed" disabled={selectedOrder.status === 'completed'}>
              Complete Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
