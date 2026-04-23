import { useEffect, useState } from 'react';
import { Trash2, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { usePOSStore } from '@/stores/pos/posStore';
import { COMMON_ADDONS } from '@/data/pos/posConstants';
import { TableInfo } from '@/data/pos/mockData';
import { motion } from "framer-motion"

interface POSCartAreaProps {
  subtotal: number;
  taxableAmount: number;
  serviceCharge: number;
  totalTaxAmount: number;
  grandTotal: number;
  gstAmount: number;
  onPlaceOrder: () => void;
  placeOrderDisabled: boolean;
  tablesQuery: any;
  selectedTable: TableInfo | null;
}

export function POSCartArea({
  subtotal,
  taxableAmount,
  serviceCharge,
  totalTaxAmount,
  grandTotal,
  gstAmount,
  onPlaceOrder,
  placeOrderDisabled,
  tablesQuery,
  selectedTable
}: POSCartAreaProps) {
  const store = usePOSStore();
  const {
    cart, updateQty, removeItem,
    orderType, setOrderType,
    setSelectedTableId, setShowTablePicker,
    deliveryCustomerName, setDeliveryCustomerName,
    deliveryPhone, setDeliveryPhone,
    deliveryAddress, setDeliveryAddress,
    gstEnabled, setGstEnabled,
    taxRates, currentOrderForEdit, setCurrentOrderForEdit,
    setCustomizingItem, setEditingCartItemIndex,
    setExtraName, setExtraPrice, setItemNotes, setIsCustomAddon,
    setShowDiscardPopup, setPendingOrderType
  } = store;

  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});

  const getCartItemKey = (item: any, index: number) =>
    `${item.menuItem.id}-${index}-${item.notes || ''}-${item.extraName || ''}-${item.extraPrice || 0}`;

  useEffect(() => {
    setQtyInputs((prev) => {
      const next = { ...prev };
      cart.forEach((item, index) => {
        const key = getCartItemKey(item, index);
        const quantity = String(item.quantity);
        if (next[key] !== quantity) {
          next[key] = quantity;
        }
      });
      return next;
    });
  }, [cart]);

  const handleQtyChange = (key: string, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    setQtyInputs((prev) => ({ ...prev, [key]: value }));
  };

  const commitQty = (item: any, key: string) => {
    const raw = qtyInputs[key] ?? String(item.quantity);
    const qty = Number(raw);

    if (!raw || Number.isNaN(qty) || qty < 1) {
      setQtyInputs((prev) => ({ ...prev, [key]: String(item.quantity) }));
      return;
    }

    if (qty !== item.quantity) {
      updateQty(item.menuItem.id, 0, item.notes, item.extraName, item.extraPrice || 0, qty);
    }
  };

  const handleOrderTypeClick = (type: 'dine-in' | 'takeaway' | 'delivery') => {
    if (type === orderType) return;

    setOrderType(type);
    if (type !== 'dine-in') {
      setSelectedTableId(null);
    }
  };

  return (
    <div className="w-full lg:w-[28rem] lg:shrink-0 flex flex-col pos-card p-0 overflow-hidden relative">
      {/* Order type */}
      <div className="p-2 border-b border-border flex gap-1">
        {(['dine-in', 'takeaway', 'delivery'] as const).map(t => (
          <button
            key={t}
            onClick={() => handleOrderTypeClick(t)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold capitalize transition-all ${orderType === t
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted font-medium'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dine-in table selection */}
      {orderType === 'dine-in' && (
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 bg-muted/30">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Selected Table</p>
            <p className="text-sm font-bold text-foreground truncate">
              {selectedTable
                ? `${selectedTable.name} (${selectedTable.seats} Seats)`
                : 'No Table Selected'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              tablesQuery.refetch();
              setShowTablePicker(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors border border-primary/20"
          >
            {selectedTable ? 'Change' : 'Select'}
          </button>
        </div>
      )}

      {orderType === 'delivery' && (
        <div className="px-4 py-4 border-b border-border space-y-2 bg-muted/30">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={deliveryCustomerName}
              onChange={e => setDeliveryCustomerName(e.target.value)}
              placeholder="Customer Name"
              className="bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
            />
            <input
              type="tel"
              value={deliveryPhone}
              onChange={e => setDeliveryPhone(e.target.value)}
              placeholder="Phone Number"
              className="bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <textarea
            rows={2}
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            placeholder="Delivery Address..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
          />
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
            <ShoppingBag className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">Cart is empty</p>
          </div>
        ) : cart.map((c, index) => (
          <div
            key={`${c.menuItem.id}-${index}`}
            className="p-3 bg-card hover:bg-muted/30 transition-colors group"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight">{c.menuItem.name}</p>
                {c.extraName && (
                  <p className="text-[10px] text-primary font-bold mt-0.5">
                    + {c.extraName} (Rs. {Number(c.extraPrice).toLocaleString()})
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    Rs. {((Number(c.menuItem.price) + Number(c.extraPrice || 0)) * c.quantity).toLocaleString()}
                  </span>
                  {c.notes && (
                    <span className="text-[10px] text-muted-foreground font-medium truncate italic max-w-[100px]">
                      {c.notes}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setCustomizingItem(c.menuItem);
                      setEditingCartItemIndex(index);
                      setExtraName(c.extraName || '');
                      setExtraPrice(c.extraPrice || '');
                      setItemNotes(c.notes || '');
                      setIsCustomAddon(!!c.extraName && !(COMMON_ADDONS as readonly string[]).includes(c.extraName));
                    }}
                    className="p-1 rounded bg-primary/5 text-primary hover:bg-primary hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(c.menuItem.id, c.notes, c.extraName, c.extraPrice || 0)}
                    className="p-1 rounded bg-destructive/5 text-destructive hover:bg-destructive hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-muted rounded-lg p-0.5">
                  <button
                    onClick={() => updateQty(c.menuItem.id, -1, c.notes, c.extraName, c.extraPrice || 0)}
                    className="w-6 h-6 rounded bg-card text-muted-foreground hover:bg-destructive hover:text-white flex items-center justify-center transition-colors"
                  >
                    {c.quantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  </button>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={qtyInputs[getCartItemKey(c, index)] ?? String(c.quantity)}
                    onChange={(e) => handleQtyChange(getCartItemKey(c, index), e.target.value)}
                    onBlur={() => commitQty(c, getCartItemKey(c, index))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-16 text-center text-sm font-bold bg-card border border-border rounded-md px-1 py-1 outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => updateQty(c.menuItem.id, 1, c.notes, c.extraName, c.extraPrice || 0)}
                    className="w-6 h-6 rounded bg-card text-muted-foreground hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-border p-4 space-y-2 bg-muted/10">
        <div className="space-y-1 text-xs font-semibold text-muted-foreground">
          <div className="flex justify-between">
            <span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span>
          </div>
          {orderType === 'dine-in' && (
            <div className="flex justify-between">
              <span>Service Charge ({Math.round(taxRates.serviceChargeRate * 100)}%)</span><span>Rs. {serviceCharge.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax Amount</span><span>Rs. {totalTaxAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-border/50">
          <span className="text-sm font-bold">Total Amount</span>
          <span className="text-lg font-bold text-primary">Rs. {grandTotal.toLocaleString()}</span>
        </div>

        {/* GST Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setGstEnabled(!gstEnabled)}
            className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${gstEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          >
            <motion.div
              initial={false}
              animate={{ x: gstEnabled ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
            />
          </button>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            Include GST ({Math.round(taxRates.gstRate * 100)}%)
          </span>
        </div>

        <button
          onClick={onPlaceOrder}
          disabled={placeOrderDisabled || cart.length === 0}
          className="w-full mt-2 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {placeOrderDisabled ? 'Loading...' : (currentOrderForEdit ? 'Update Order' : 'Place Order')}
        </button>
      </div>
    </div>
  );
}
