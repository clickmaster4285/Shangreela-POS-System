import { useEffect, useMemo, useState } from 'react';
import type { Order, TableInfo } from '@/data/mockData';
import { CreditCard, Banknote, Printer, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { printReceipt } from '@/utils/printReceipt';
import { billBreakdownForOrder, computePakistanTaxTotals } from '@/utils/pakistanTax';
import { useAuth } from '@/contexts/AuthContext';
import { api, type PaginatedResponse } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { formatOrderDateTime, groupOrdersByCalendarDay } from '@/utils/formatOrderDateTime';

export default function Billing() {
  const { hasAction } = useAuth();
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<(Order & { dbId?: string })[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { dbId?: string }) | null>(null);
  const [discountMode, setDiscountMode] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'easypesa'>('cash');
  const [gstEnabled, setGstEnabled] = useState(true);
  const [taxRates, setTaxRates] = useState({ gstRate: 0.16, serviceChargeRate: 0.05 });
  const [paidAmount, setPaidAmount] = useState<number | string>('');

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

  const loadTables = () =>
    api<PaginatedResponse<{ number: number; name: string; seats: number; floorKey: string; status: TableInfo['status']; currentOrder?: string }>>('/tables?page=1&limit=500').then(r => {
      setTables(r.items.map(table => ({
        id: table.number,
        name: table.name,
        seats: table.seats,
        floorId: table.floorKey,
        status: table.status,
        currentOrder: table.currentOrder,
      })));
    });

  const tableMap = useMemo(() => {
    return new Map<number, TableInfo>(tables.map(table => [table.id, table]));
  }, [tables]);

  useEffect(() => {
    loadOrders().catch(() => toast.error('Failed to load active bills'));
  }, []);

  useEffect(() => {
    loadTables().catch(() => toast.error('Failed to load tables'));
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

  useEffect(() => {
    if (!selectedOrder) return;
    setGstEnabled(selectedOrder.gstEnabled !== false);
  }, [selectedOrder?.id, selectedOrder?.gstEnabled]);

  useEffect(() => {
    if (!selectedOrder) return;
    const saved = Number(selectedOrder.discount ?? 0);
    if (saved > 0) {
      setDiscountMode('amount');
      setDiscountValue(saved);
    } else {
      setDiscountMode('percent');
      setDiscountValue(0);
    }
  }, [selectedOrder?.id]);

  useEffect(() => {
    setPaidAmount('');
  }, [selectedOrder?.id]);

  const orderItemsKey = useMemo(
    () => (selectedOrder?.items ?? []).map(i => `${i.menuItem?.id ?? i.menuItem.name}:${i.quantity}`).join('|'),
    [selectedOrder?.items],
  );

  const billsByDay = useMemo(() => groupOrdersByCalendarDay(orders), [orders]);

  useEffect(() => {
    if (!selectedOrder?.dbId || selectedOrder.status === 'completed') return;
    const sub = selectedOrder.items.reduce((s, i: any) => s + (Number(i.menuItem.price) + Number(i.extraPrice || 0)) * i.quantity, 0);
    const disc =
      discountMode === 'percent' ? sub * (discountValue / 100) : Math.min(Math.max(discountValue, 0), sub);
    const { gstAmount, totalTaxAmount, grandTotal, serviceCharge } = computePakistanTaxTotals(
      sub,
      disc,
      gstEnabled,
      taxRates,
      { applyServiceCharge: selectedOrder.type === 'dine-in' },
    );
    const t = window.setTimeout(() => {
      api(`/orders/${selectedOrder.dbId}/billing-totals`, {
        method: 'PATCH',
        body: JSON.stringify({
          gstEnabled,
          total: grandTotal,
          subtotal: sub,
          discount: disc,
          tax: totalTaxAmount,
          gstAmount,
          serviceCharge,
        }),
      })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
          queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] });
        })
        .catch(() => {});
    }, 450);
    return () => window.clearTimeout(t);
  }, [
    selectedOrder?.dbId,
    selectedOrder?.status,
    selectedOrder?.type,
    orderItemsKey,
    discountMode,
    discountValue,
    gstEnabled,
    taxRates.gstRate,
    taxRates.serviceChargeRate,
  ]);

  if (!selectedOrder) {
    return (
      <div className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col">
        <div className="space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Billing</h1>
            <p className="text-sm text-muted-foreground">No active table order to bill right now.</p>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = selectedOrder.items.reduce((s, i: any) => s + (Number(i.menuItem.price) + Number(i.extraPrice || 0)) * i.quantity, 0);
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

  const grandTotalForBillCard = (o: Order & { dbId?: string }) => {
    if (o.status === 'completed' && Number.isFinite(Number(o.total))) return Number(o.total);
    if (o.id === selectedOrder.id) return grandTotal;
    return billBreakdownForOrder(o, taxRates).grandTotal;
  };

  const getBillStatusLabel = (status?: string) => (status === 'completed' ? 'Paid' : 'Pending');
  const pendingCount = orders.filter(o => o.status !== 'completed').length;
  const paidCount = orders.filter(o => o.status === 'completed').length;
  const getStatusBadgeClass = (status?: string) =>
    status === 'completed' ? 'bg-success/15 text-success border-success/30' : 'bg-warning/15 text-warning border-warning/30';
  const paymentLabel = paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'card' ? 'Card' : 'EasyPaisa';

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-4 overflow-hidden lg:h-[calc(100vh-7rem)]">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
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

      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Order selector & details */}
        <div className="pos-card flex min-h-0 flex-col overflow-hidden p-3.5 shadow-sm">
          <h3 className="mb-3 shrink-0 px-1 font-semibold text-sm text-foreground">Bills by day</h3>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-thin">
            {billsByDay.map(group => (
              <div key={group.dayKey} className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 border-b border-border/60 pb-1">
                  {group.dayLabel}
                </p>
                {group.orders.map(o => (
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
                        <p className="text-xs text-foreground font-bold uppercase tracking-[0.2em]">Bill</p>
                        <p className="text-base font-bold text-foreground">Rs. {grandTotalForBillCard(o).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{formatOrderDateTime(o.createdAt)}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground capitalize">{o.type}</span>
                      {o.table && (
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                          {tableMap.get(o.table)?.name || `Table ${o.table}`}
                        </span>
                      )}
                    </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${getStatusBadgeClass(o.status)}`}>
                        {getBillStatusLabel(o.status)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Receipt */}
        <div className="pos-card flex min-h-0 flex-col overflow-hidden p-5 shadow-sm">
          <div className="mb-5 shrink-0 border-b border-border border-dashed pb-4 text-center">
            <h2 className="font-serif text-xl font-bold text-foreground">Shangreela Heights</h2>
            <p className="text-xs text-muted-foreground">ling Mor Kahuta, Rawalpindi</p>
            <p className="text-xs text-muted-foreground">Tel: +92 513314120 / +92 337-5454786</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between"><span className="font-bold text-foreground">Order</span><span className="text-foreground font-semibold">{selectedOrder.id}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Placed</span><span className="text-right text-foreground">{formatOrderDateTime(selectedOrder.createdAt)}</span></div>
            <div className="flex justify-between text-muted-foreground capitalize"><span>Type</span><span>{selectedOrder.type}</span></div>
            {selectedOrder.table && <div className="flex justify-between"><span className="font-bold text-foreground">Table</span><span className="bg-primary/20 text-primary px-2.5 py-1 rounded-full font-bold inline-block">{tableMap.get(selectedOrder.table)?.name || selectedOrder.table}</span></div>}
            {selectedOrder.orderTaker && <div className="flex justify-between text-muted-foreground"><span>Order taker</span><span>{selectedOrder.orderTaker}</span></div>}
            <div className="flex justify-between text-muted-foreground items-center">
              <span>Status</span>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${getStatusBadgeClass(selectedOrder.status)}`}>
                {getBillStatusLabel(selectedOrder.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-foreground text-base">Total Bill</span>
              <span className="text-foreground font-bold text-base">{fmt(grandTotal)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/35 p-3 space-y-2 mb-4">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground">ORDER ITEMS</h3>
            {selectedOrder.items.map((item: any, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-border/40 last:border-0">
                <div className="flex-1">
                  <p className="text-foreground">{item.quantity}× {item.menuItem.name}</p>
                  {item.extraName && (
                    <p className="text-[11px] text-primary font-bold">
                      + {item.extraName} (Rs. {Number(item.extraPrice || 0).toLocaleString()})
                    </p>
                  )}
                </div>
                <span className="font-medium text-foreground">Rs. {((Number(item.menuItem.price) + Number(item.extraPrice || 0)) * item.quantity).toLocaleString()}</span>
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
                onChange={(e) => {
                  const val = e.target.checked;
                  setGstEnabled(val);
                  localStorage.setItem('pos_gst_enabled', val.toString());
                }}
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

          {/* Amount Received & Change Due (Cash Calculator) */}
          {paymentMethod === 'cash' && (
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-primary mb-1 block">Amount Received (Rs.)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 5000"
                    className="w-full bg-background border border-primary/30 rounded-xl px-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Change Due (Return)</label>
                  <div className={`w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm font-bold flex items-center ${Number(paidAmount) >= grandTotal ? 'text-success' : 'text-muted-foreground'}`}>
                    {Number(paidAmount) >= grandTotal ? fmt(Number(paidAmount) - grandTotal) : 'Rs. 0'}
                  </div>
                </div>
              </div>
              {Number(paidAmount) > 0 && Number(paidAmount) < grandTotal && (
                <p className="text-[11px] text-destructive mt-2 font-medium">
                  Note: Received amount is less than total bill.
                </p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                {[500, 1000, 2000, 5000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPaidAmount(amt)}
                    className="px-3 py-1.5 rounded-lg bg-background border border-primary/20 text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    + {amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPaidAmount(Math.ceil(grandTotal / 500) * 500)}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  Round Up
                </button>
              </div>
            </div>
          )}

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
              const tableInfo = selectedOrder.table ? tableMap.get(selectedOrder.table) : null;
              const tableDisplay = tableInfo ? `${tableInfo.name} (${selectedOrder.table})` : selectedOrder.table;
              printReceipt({
                orderId: selectedOrder.id, orderType: selectedOrder.type, table: selectedOrder.table,
                tableName: tableInfo?.name,
                items: selectedOrder.items, subtotal,
                discount: discountMode === 'amount' ? discountValue : 0,
                discountPercent: discountMode === 'percent' ? discountValue : 0,
                gstEnabled,
                gstRate: taxRates.gstRate,
                serviceChargeRate: taxRates.serviceChargeRate,
                paymentMethod: paymentLabel, customerName: selectedOrder.customerName,
                orderCreatedAt: selectedOrder.createdAt,
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
              const tableInfo = selectedOrder.table ? tableMap.get(selectedOrder.table) : null;
              const tableDisplay = tableInfo ? `${tableInfo.name} (${selectedOrder.table})` : selectedOrder.table;
              printReceipt({
                orderId: selectedOrder.id, orderType: selectedOrder.type, table: selectedOrder.table,
                tableName: tableInfo?.name,
                items: selectedOrder.items, subtotal,
                discount: discountMode === 'amount' ? discountValue : 0,
                discountPercent: discountMode === 'percent' ? discountValue : 0,
                gstEnabled,
                gstRate: taxRates.gstRate,
                serviceChargeRate: taxRates.serviceChargeRate,
                paymentMethod: paymentLabel, customerName: selectedOrder.customerName,
                orderCreatedAt: selectedOrder.createdAt,
              });
              if (selectedOrder.dbId) {
                api(`/orders/${selectedOrder.dbId}/payment`, {
                  method: 'POST',
                  body: JSON.stringify({
                    paymentMethod,
                    gstEnabled,
                    total: grandTotal,
                    subtotal,
                    discount: discountAmt,
                    tax: totalTaxAmount,
                    gstAmount,
                    serviceCharge,
                  }),
                })
                  .then(() => {
                    toast.success('Payment completed and receipt printed');
                    loadOrders();
                    queryClient.invalidateQueries({ queryKey: ['pos-tables'] });
                    queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
                    queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
                    queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] });
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
    </div>
  );
}
