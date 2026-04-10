import { useEffect, useState } from 'react';
import type { Order } from '@/data/mockData';
import { CreditCard, Banknote, Printer, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { printReceipt } from '@/utils/printReceipt';
import { computePakistanTaxTotals } from '@/utils/pakistanTax';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export default function Billing() {
  const { hasAction } = useAuth();
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<(Order & { dbId?: string })[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { dbId?: string }) | null>(null);
  const [discountMode, setDiscountMode] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'easypesa'>('cash');
  const [gstEnabled, setGstEnabled] = useState(true);
  const [taxRates, setTaxRates] = useState({ gstRate: 0.16, serviceChargeRate: 0.05 });

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

  useEffect(() => {
    api<{ salesTaxRate: number; serviceChargeRate: number }>('/settings/tax')
      .then((r) => {
        const gstRate = Number(r.salesTaxRate ?? 16) / 100;
        const serviceChargeRate = Number(r.serviceChargeRate ?? 5) / 100;
        setTaxRates({
          gstRate: Number.isFinite(gstRate) ? gstRate : 0.16,
          serviceChargeRate: Number.isFinite(serviceChargeRate) ? serviceChargeRate : 0.05,
        });
      })
      .catch(() => {
        // keep defaults
      });
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
  const discountAmt = discountMode === 'percent'
    ? subtotal * (discountValue / 100)
    : Math.min(Math.max(discountValue, 0), subtotal);
  const { gstAmount, furtherTaxAmount, totalTaxAmount, grandTotal, taxableAmount, serviceCharge } = computePakistanTaxTotals(
    subtotal,
    discountAmt,
    gstEnabled,
    taxRates,
    { applyServiceCharge: selectedOrder.type === 'dine-in' }
  );

  const fmt = (v: number) => `Rs. ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const getBillStatusLabel = (status?: string) => (status === 'completed' ? 'Paid' : 'Pending');
  const pendingCount = orders.filter(o => o.status !== 'completed').length;
  const paidCount = orders.filter(o => o.status === 'completed').length;
  const getStatusBadgeClass = (status?: string) =>
    status === 'completed' ? 'bg-success/15 text-success border-success/30' : 'bg-warning/15 text-warning border-warning/30';
  const paymentLabel = paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'card' ? 'Card' : 'EasyPaisa';

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
                  <div className="flex justify-between gap-4">
                    <span className="font-medium text-sm text-foreground">{o.id}</span>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Bill</p>
                      <p className="text-sm font-semibold text-foreground">Rs. {o.total.toLocaleString()}</p>
                    </div>
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
            <h2 className="font-serif text-xl font-bold text-foreground">Shangreela Heights</h2>
            <p className="text-xs text-muted-foreground">ling Mor Kahuta, Rawalpindi</p>
            <p className="text-xs text-muted-foreground">Tel: +92 513314120 / +92 337-5454786</p>
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
            <div className="flex justify-between text-muted-foreground">
              <span>Total bill</span>
              <span>{fmt(grandTotal)}</span>
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
            {discountAmt > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount{discountMode === 'percent' ? ` (${discountValue}%)` : ''}</span>
                <span>-{fmt(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground"><span>Taxable value</span><span>{fmt(taxableAmount)}</span></div>
            {selectedOrder.type === 'dine-in' && (
              <div className="flex justify-between text-muted-foreground"><span>Service charge ({Math.round(taxRates.serviceChargeRate * 100)}%)</span><span>{fmt(serviceCharge)}</span></div>
            )}
            <div className="flex justify-between text-muted-foreground"><span>GST ({gstEnabled ? Math.round(taxRates.gstRate * 100) : 0}%)</span><span>{fmt(gstAmount)}</span></div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>Total taxes</span><span>{fmt(totalTaxAmount)}</span></div>
            <div className="flex justify-between font-serif text-xl font-bold text-foreground pt-2 border-t border-border">
              <span>Total</span><span>{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Discount */}
          {hasAction('apply_discount') && (
          <div className="mb-4 rounded-xl border border-border/70 p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="text-xs font-semibold text-muted-foreground">Discount</div>
              <div className="inline-flex rounded-full bg-muted/50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountMode('percent');
                    setDiscountValue(0);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${discountMode === 'percent' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Percent
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountMode('amount');
                    setDiscountValue(0);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${discountMode === 'amount' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Amount
                </button>
              </div>
            </div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {discountMode === 'percent' ? 'Discount %' : 'Discount amount'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                className="w-full sm:w-32 bg-background border border-border rounded-xl px-3 py-2 text-sm"
              />
              {discountMode === 'percent' && (
                <div className="flex gap-2 flex-wrap">
                  {[0, 5, 10, 15, 20].map(d => (
                    <button key={d} type="button" onClick={() => setDiscountValue(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${discountValue === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {d}%
                    </button>
                  ))}
                </div>
              )}
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
              Include GST ({Math.round(taxRates.gstRate * 100)}%)
            </label>
          </div>

          {/* Payment */}
          <div className="mb-4 rounded-xl border border-border/70 p-3">
            <label className="text-xs text-muted-foreground mb-1 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  paymentMethod === 'cash'
                    ? 'bg-primary text-primary-foreground border-primary/40'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                <Banknote className="w-4 h-4" /> Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  paymentMethod === 'card'
                    ? 'bg-primary text-primary-foreground border-primary/40'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('easypesa')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  paymentMethod === 'easypesa'
                    ? 'bg-primary text-primary-foreground border-primary/40'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                <Wallet className="w-4 h-4" /> EasyPaisa
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
                items: selectedOrder.items, subtotal,
                discount: discountMode === 'amount' ? discountValue : 0,
                discountPercent: discountMode === 'percent' ? discountValue : 0,
                gstEnabled,
                gstRate: taxRates.gstRate,
                serviceChargeRate: taxRates.serviceChargeRate,
                paymentMethod: paymentLabel, customerName: selectedOrder.customerName,
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
                items: selectedOrder.items, subtotal,
                discount: discountMode === 'amount' ? discountValue : 0,
                discountPercent: discountMode === 'percent' ? discountValue : 0,
                gstEnabled,
                gstRate: taxRates.gstRate,
                serviceChargeRate: taxRates.serviceChargeRate,
                paymentMethod: paymentLabel, customerName: selectedOrder.customerName,
              });
              if (selectedOrder.dbId) {
                api(`/orders/${selectedOrder.dbId}/payment`, { method: 'POST', body: JSON.stringify({ paymentMethod, gstEnabled }) })
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
