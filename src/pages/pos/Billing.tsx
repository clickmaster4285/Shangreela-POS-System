import { useState } from 'react';
import { sampleOrders } from '@/data/mockData';
import { CreditCard, Banknote, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { printReceipt } from '@/utils/printReceipt';
import { computePakistanTaxTotals, PKR_FURTHER_TAX_RATE, PKR_GST_RATE } from '@/utils/pakistanTax';
import { useAuth } from '@/contexts/AuthContext';

export default function Billing() {
  const { hasAction } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(sampleOrders[0]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  const subtotal = selectedOrder.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
  const discountAmt = subtotal * (discount / 100);
  const { gstAmount, furtherTaxAmount, totalTaxAmount, grandTotal, taxableAmount } = computePakistanTaxTotals(
    subtotal,
    discountAmt
  );

  const fmt = (v: number) => `Rs. ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">Process payments and generate receipts.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order selector & details */}
        <div className="space-y-4">
          <div className="pos-card">
            <h3 className="font-semibold text-sm text-foreground mb-3">Select Order</h3>
            <div className="space-y-2">
              {sampleOrders.map(o => (
                <button key={o.id} onClick={() => setSelectedOrder(o)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${selectedOrder.id === o.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50 hover:bg-muted'}`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-sm text-foreground">{o.id}</span>
                    <span className="text-sm text-foreground">Rs. {o.total.toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{o.type}{o.table ? ` • Table ${o.table}` : ''}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pos-card">
            <h3 className="font-semibold text-sm text-foreground mb-3">Order Items</h3>
            <div className="space-y-2">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.quantity}× {item.menuItem.name}</span>
                  <span className="font-medium">Rs. {(item.menuItem.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Receipt */}
        <div className="pos-card">
          <div className="text-center mb-4 pb-4 border-b border-border border-dashed">
            <h2 className="font-serif text-xl font-bold text-foreground">Shiraz Restaurant</h2>
            <p className="text-xs text-muted-foreground">123 Royal Avenue, Islamabad</p>
            <p className="text-xs text-muted-foreground">Tel: +92 51 1234567</p>
          </div>

          <div className="space-y-1 text-sm mb-4">
            <div className="flex justify-between text-muted-foreground"><span>Order</span><span>{selectedOrder.id}</span></div>
            <div className="flex justify-between text-muted-foreground capitalize"><span>Type</span><span>{selectedOrder.type}</span></div>
            {selectedOrder.table && <div className="flex justify-between text-muted-foreground"><span>Table</span><span>{selectedOrder.table}</span></div>}
          </div>

          <div className="border-t border-b border-border border-dashed py-3 space-y-1.5 mb-3">
            {selectedOrder.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.quantity}× {item.menuItem.name}</span>
                <span>Rs. {(item.menuItem.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-sm mb-4">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-success"><span>Discount ({discount}%)</span><span>-{fmt(discountAmt)}</span></div>}
            <div className="flex justify-between text-muted-foreground"><span>Taxable value</span><span>{fmt(taxableAmount)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>GST ({Math.round(PKR_GST_RATE * 100)}%)</span><span>{fmt(gstAmount)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Further tax ({Math.round(PKR_FURTHER_TAX_RATE * 100)}%)</span><span>{fmt(furtherTaxAmount)}</span></div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>Total taxes</span><span>{fmt(totalTaxAmount)}</span></div>
            <div className="flex justify-between font-serif text-xl font-bold text-foreground pt-2 border-t border-border"><span>Total</span><span>{fmt(grandTotal)}</span></div>
          </div>

          {/* Discount */}
          {hasAction('apply_discount') && (
          <div className="mb-4">
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

          {/* Payment */}
          <div className="mb-4">
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

          <div className="flex gap-2">
            <button onClick={() => {
              printReceipt({
                orderId: selectedOrder.id, orderType: selectedOrder.type, table: selectedOrder.table,
                items: selectedOrder.items, subtotal, discount: discountAmt, discountPercent: discount,
                paymentMethod, customerName: selectedOrder.customerName,
              });
              toast.success('Receipt sent to printer!');
            }} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-muted/80 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => {
              printReceipt({
                orderId: selectedOrder.id, orderType: selectedOrder.type, table: selectedOrder.table,
                items: selectedOrder.items, subtotal, discount: discountAmt, discountPercent: discount,
                paymentMethod, customerName: selectedOrder.customerName,
              });
              toast.success('Payment processed!');
            }} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-secondary transition-colors">
              Complete Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
