import React, { useState, useEffect, useMemo } from 'react';
import { Printer, Wallet, Banknote, CreditCard, Tag } from 'lucide-react';
import { toast } from 'sonner';
import type { Order, TableInfo } from '@/data/pos/mockData';
import { api } from '@/lib/api/api';
import { printReceipt } from '@/utils/pos/printReceipt';
import { computePakistanTaxTotals } from '@/utils/pos/pakistanTax';

interface BillPaymentPanelProps {
  order: (Order & { dbId?: string; printed?: boolean }) | null;
  tableMap: Map<number, TableInfo>;
  taxRates: { gstRate: number; serviceChargeRate: number };
  currentUser: any;
  hasAction: (action: string) => boolean;
  onPaymentComplete: () => Promise<void>;
  markOrderAsPrinted: (id: string) => void;
  isOrderPrinted: (id: string) => boolean;
  runLocked: (key: string, fn: () => Promise<void>) => Promise<void>;
  isLocked: (key: string) => boolean;
  getStatusBadgeClass: (o: Order & { printed?: boolean }) => string;
  getBillStatusLabel: (o: Order & { printed?: boolean }) => string;
  formatOrderDateTime: (date: string) => string;
}

export const BillPaymentPanel: React.FC<BillPaymentPanelProps> = ({
  order,
  tableMap,
  taxRates,
  currentUser,
  hasAction,
  onPaymentComplete,
  markOrderAsPrinted,
  isOrderPrinted,
  runLocked,
  isLocked,
  getStatusBadgeClass,
  getBillStatusLabel,
  formatOrderDateTime,
}) => {
  const [discountMode, setDiscountMode] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'easypesa'>('cash');
  const [gstEnabled, setGstEnabled] = useState(true);
  const [paidAmount, setPaidAmount] = useState<number | string>('');

  // Reset/Update state when order changes
  useEffect(() => {
    if (!order) return;
    setGstEnabled(order.gstEnabled !== false);
    const savedDiscount = Number(order.discount ?? 0);
    if (savedDiscount > 0) {
      setDiscountMode('amount');
      setDiscountValue(savedDiscount);
    } else {
      setDiscountMode('percent');
      setDiscountValue(0);
    }
    setPaidAmount('');
  }, [order?.id, order?.gstEnabled, order?.discount]);

  const subtotal = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce((s, i: any) => s + (Number(i.menuItem.price) + Number(i.extraPrice || 0)) * i.quantity, 0);
  }, [order]);

  const discountAmt = useMemo(() => {
    if (discountMode === 'percent') {
      return subtotal * (discountValue / 100);
    }
    return Math.min(Math.max(discountValue, 0), subtotal);
  }, [subtotal, discountMode, discountValue]);

  const taxTotals = useMemo(() => {
    return computePakistanTaxTotals(
      subtotal,
      discountAmt,
      gstEnabled,
      taxRates,
      { applyServiceCharge: order?.type === 'dine-in' }
    );
  }, [subtotal, discountAmt, gstEnabled, taxRates, order?.type]);

  const { gstAmount, totalTaxAmount, grandTotal, taxableAmount, serviceCharge } = taxTotals;

  // Sync billing totals with backend (debounced)
  useEffect(() => {
    if (!order?.dbId || order.status === 'completed') return;
    
    const t = window.setTimeout(() => {
      api(`/orders/${order.dbId}/billing-totals`, {
        method: 'PATCH',
        body: JSON.stringify({
          gstEnabled,
          total: grandTotal,
          subtotal,
          discount: discountAmt,
          tax: totalTaxAmount,
          gstAmount,
          serviceCharge,
        }),
      }).catch(() => {});
    }, 450);

    return () => window.clearTimeout(t);
  }, [
    order?.dbId,
    order?.status,
    subtotal,
    discountAmt,
    gstEnabled,
    taxRates,
    grandTotal
  ]);

  const fmt = (v: number) => `Rs. ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const buildReceiptData = (
    targetOrder: Order & { dbId?: string; printed?: boolean },
    paidStamp: boolean,
    overridePaymentMethod?: string
  ) => {
    const isCurrentOrder = targetOrder.id === order?.id;
    const orderSubtotal = targetOrder.items.reduce((s, i: any) => s + (Number(i.menuItem.price) + Number(i.extraPrice || 0)) * i.quantity, 0);
    
    // For the current order we use the UI's discount/gst state
    const orderDiscount = isCurrentOrder ? discountAmt : Number(targetOrder.discount || 0);
    const orderGst = isCurrentOrder ? gstEnabled : targetOrder.gstEnabled !== false;
    
    const breakdown = computePakistanTaxTotals(
      orderSubtotal,
      orderDiscount,
      orderGst,
      taxRates,
      { applyServiceCharge: targetOrder.type === 'dine-in' }
    );

    const orderGrandTotal = targetOrder.status === 'completed' && Number.isFinite(Number(targetOrder.total))
      ? Number(targetOrder.total)
      : breakdown.grandTotal;

    const paymentLabel = paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'card' ? 'Card' : 'EasyPaisa';
    const tableInfo = targetOrder.table ? tableMap.get(targetOrder.table) : null;

    return {
      orderId: targetOrder.id,
      orderType: targetOrder.type,
      table: targetOrder.table,
      tableName: tableInfo?.name,
      items: targetOrder.items,
      subtotal: orderSubtotal,
      discount: orderDiscount,
      discountPercent: 0,
      gstEnabled: orderGst,
      gstRate: taxRates.gstRate,
      serviceChargeRate: taxRates.serviceChargeRate,
      paymentMethod: targetOrder.status === 'completed'
        ? String(overridePaymentMethod || (targetOrder as any).paymentMethod || paymentLabel)
        : paymentLabel,
      grandTotal: orderGrandTotal,
      paidStamp,
      user: currentUser?.name || 'Cashier',
      timestamp: new Date().toISOString(),
      gstAmount: breakdown.gstAmount,
      serviceCharge: breakdown.serviceCharge,
      fbrInvoiceNumber: '',
      customerName: targetOrder.customerName,
      orderCreatedAt: targetOrder.createdAt,
      amountPaid: targetOrder.status === 'completed'
        ? orderGrandTotal
        : paymentMethod === 'cash'
          ? (Number(paidAmount) >= orderGrandTotal ? Number(paidAmount) : orderGrandTotal)
          : undefined,
      changeDue: targetOrder.status === 'completed'
        ? 0
        : paymentMethod === 'cash'
          ? (Number(paidAmount) >= orderGrandTotal ? Number(paidAmount) - orderGrandTotal : 0)
          : undefined,
      isPaid: paidStamp || targetOrder.status === 'completed',
      cashierName: (targetOrder as any).cashierName || currentUser?.name || currentUser?.email,
    };
  };

  const handlePrint = () => {
    if (!order) return;
    const data = buildReceiptData(order, false);
    printReceipt(data);
    markOrderAsPrinted(order.id);
    toast.success('Receipt sent to printer!');
  };

  const handleCompletePayment = () => {
    if (!order) return;
    void runLocked('complete-payment', async () => {
      if (order.status === 'completed') {
        const data = buildReceiptData(order, true, (order as any).paymentMethod);
        printReceipt(data);
        markOrderAsPrinted(order.id);
        toast.success('Paid bill reprinted');
        return;
      }
      
      if (order.dbId) {
        await api(`/orders/${order.dbId}/payment`, {
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
        });
        
        const data = buildReceiptData({ ...order, status: 'completed' }, true, paymentMethod);
        printReceipt(data);
        markOrderAsPrinted(order.id);
        toast.success('Payment completed and receipt printed');
        await onPaymentComplete();
      } else {
        toast.success('Payment processed!');
      }
    }).catch(err => toast.error(err instanceof Error ? err.message : 'Payment failed'));
  };

  if (!order) {
    return (
      <div className="pos-card flex flex-col items-center justify-center p-8 border-dashed">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Wallet className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-serif font-bold text-foreground">No Bill Selected</h3>
        <p className="text-sm text-muted-foreground max-w-[260px] text-center mt-1 leading-relaxed">
          Click on a bill from the orders list on the left to view detailed information and process payment here.
        </p>
      </div>
    );
  }

  return (
    <div className="pos-card flex min-h-0 flex-col overflow-hidden p-5 shadow-sm relative print:overflow-visible">
      {/* Paid Watermark - Print only */}
      {order.status === 'completed' && (
        <div className="hidden print:flex print:absolute print:inset-0 print:items-center print:justify-center print:pointer-events-none print:z-10 print:overflow-visible">
          <div className="transform -rotate-45">
            <p className="font-black tracking-wider" style={{ fontSize: '180px', lineHeight: '1', color: '#ef4444', opacity: 0.3, textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>PAID</p>
          </div>
        </div>
      )}

      <div className="mb-5 shrink-0 border-b border-border pb-4 flex justify-between items-start">
        <div>
          <h2 className="font-black text-xl text-foreground">{order.id}</h2>
          <p className="text-xs text-muted-foreground mb-2 mt-0.5 font-medium">{formatOrderDateTime(order.createdAt)} • <span className="capitalize">{order.type}</span></p>
          <span className={`inline-block text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(order)}`}>
            {getBillStatusLabel(order)}
          </span>
        </div>
        <div className="text-right flex flex-col items-end gap-1.5">
          {order.table && (
            <div className="flex gap-1.5 items-center">
              <span className="text-[10px] font-black text-muted-foreground uppercase">{tableMap.get(order.table)?.floorId || "Floor"}</span>
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-md font-black text-sm">{tableMap.get(order.table)?.name || order.table}</span>
            </div>
          )}
          {order.orderTaker && (
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Taken by <span className="text-foreground">{order.orderTaker}</span></p>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin">

        <div className="rounded-xl border border-border/70 bg-muted/35 p-3 space-y-2 mb-4">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground">ORDER ITEMS</h3>
          {order.items.map((item: any, i) => (
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
          {order.type === 'dine-in' && (
            <div className="flex justify-between text-muted-foreground"><span>Service charge ({Math.round(taxRates.serviceChargeRate * 100)}%)</span><span>{fmt(serviceCharge)}</span></div>
          )}
          <div className="flex justify-between text-muted-foreground"><span>GST ({gstEnabled ? Math.round(taxRates.gstRate * 100) : 0}%)</span><span>{fmt(gstAmount)}</span></div>
          <div className="flex justify-between text-xs text-muted-foreground"><span>Total taxes</span><span>{fmt(totalTaxAmount)}</span></div>
          <div className="flex justify-between text-xl font-bold text-foreground pt-3 border-t border-border">
            <span>Total</span><span>{fmt(grandTotal)}</span>
          </div>
        </div>

        {/* Discount / Tax toggles - only for pending bills */}
        {order.status !== 'completed' && (
          <div className="space-y-4">
            {hasAction('apply_discount') && (
              <div className="rounded-xl border border-border/70 p-3 bg-muted/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <div className="text-xs font-semibold text-muted-foreground">Discount</div>
                  <div className="inline-flex rounded-full bg-card p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountMode('percent');
                        setDiscountValue(0);
                      }}
                      className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all ${discountMode === 'percent' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Percent
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountMode('amount');
                        setDiscountValue(0);
                      }}
                      className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all ${discountMode === 'amount' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Amount
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                    className="w-full sm:w-32 bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {discountMode === 'percent' && (
                    <div className="flex gap-2 flex-wrap">
                      {[0, 5, 10, 15, 20].map(d => (
                        <button key={d} type="button" onClick={() => setDiscountValue(d)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${discountValue === d ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card border border-border text-muted-foreground hover:border-primary/30'}`}>
                          {d}%
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border/70 p-3 bg-muted/20">
              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
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
                Include GST Summary ({Math.round(taxRates.gstRate * 100)}%)
              </label>
            </div>

            <div className="rounded-xl border border-border/70 p-3 bg-muted/20">
              <label className="text-xs font-semibold text-muted-foreground mb-3 block">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <Banknote className="w-4 h-4" /> Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('easypesa')}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition-all ${
                    paymentMethod === 'easypesa'
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <Wallet className="w-4 h-4" /> e-Wallet
                </button>
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-primary mb-1.5 block tracking-wider">Amount Received</label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full bg-background border border-primary/30 rounded-xl px-3 py-3 text-lg font-black focus:ring-4 focus:ring-primary/15 outline-none transition-all placeholder:text-muted-foreground/30"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block tracking-wider">Change Due</label>
                    <div className={`w-full bg-card border border-border rounded-xl px-3 py-3 text-lg font-black flex items-center transition-all ${Number(paidAmount) >= grandTotal ? 'text-success shadow-sm' : 'text-muted-foreground/40'}`}>
                      {Number(paidAmount) >= grandTotal ? fmt(Number(paidAmount) - grandTotal) : 'Rs. 0'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-4 flex-wrap">
                  {[500, 1000, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPaidAmount((Number(paidAmount) || 0) + amt)}
                      className="px-3 py-1.5 rounded-lg bg-card border border-border text-[11px] font-black text-foreground hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95"
                    >
                      + {amt.toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPaidAmount(Math.ceil(grandTotal / 500) * 500)}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-black text-primary hover:bg-primary hover:text-white transition-all shadow-sm ml-auto"
                  >
                    Round Up
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2 shrink-0 border-t border-border pt-5">
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="flex-1 py-3.5 rounded-2xl bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-muted/80 transition-all active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" /> Print Bill
          </button>
          <button 
            onClick={handleCompletePayment}
            disabled={isLocked('complete-payment')}
            className="flex-[2] py-3.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {order.status === 'completed' ? 'Reprint Paid' : 'Complete Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

