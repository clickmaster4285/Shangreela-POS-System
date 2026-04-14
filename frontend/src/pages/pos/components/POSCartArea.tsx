import { Trash2, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { type CartItem, type MenuItem, type TableInfo, COMMON_ADDONS } from '@/data/mockData';

interface POSCartAreaProps {
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  handleOrderTypeChange: (type: 'dine-in' | 'takeaway' | 'delivery') => void;
  selectedTable: TableInfo | null;
  floors: { id: string; name: string }[];
  setSelectedTableId: (id: number | null) => void;
  tablesQuery: any;
  setShowTablePicker: (v: boolean) => void;
  deliveryCustomerName: string;
  setDeliveryCustomerName: (v: string) => void;
  deliveryPhone: string;
  setDeliveryPhone: (v: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (v: string) => void;
  cart: CartItem[];
  removeItem: (id: string, notes: string, extraN: string, extraP: number) => void;
  updateQty: (id: string, delta: number, notes: string, extraN: string, extraP: number, absoluteQty?: number) => void;
  setCustomizingItem: (item: MenuItem | null) => void;
  setEditingCartItemIndex: (index: number | null) => void;
  setExtraName: (v: string) => void;
  setExtraPrice: (v: number | string) => void;
  setItemNotes: (v: string) => void;
  subtotal: number;
  taxableAmount: number;
  serviceCharge: number;
  totalTaxAmount: number;
  grandTotal: number;
  gstEnabled: boolean;
  setGstEnabled: (v: boolean) => void;
  taxRates: { gstRate: number; serviceChargeRate: number };
  loadActiveTableOrder: () => void;
  currentOrderForEdit: { dbId: string; id: string } | null;
  setCurrentOrderForEdit: (v: { dbId: string; id: string } | null) => void;
  onPlaceOrder: () => void;
  gstAmount: number;
  setIsCustomAddon: (v: boolean) => void;
}

export function POSCartArea({
  orderType,
  handleOrderTypeChange,
  selectedTable,
  floors,
  setSelectedTableId,
  tablesQuery,
  setShowTablePicker,
  deliveryCustomerName,
  setDeliveryCustomerName,
  deliveryPhone,
  setDeliveryPhone,
  deliveryAddress,
  setDeliveryAddress,
  cart,
  removeItem,
  updateQty,
  setCustomizingItem,
  setEditingCartItemIndex,
  setExtraName,
  setExtraPrice,
  setItemNotes,
  subtotal,
  taxableAmount,
  serviceCharge,
  totalTaxAmount,
  grandTotal,
  gstEnabled,
  setGstEnabled,
  taxRates,
  loadActiveTableOrder,
  currentOrderForEdit,
  setCurrentOrderForEdit,
  onPlaceOrder,
  gstAmount,
  setIsCustomAddon,
}: POSCartAreaProps) {
  return (
    <div className="w-full lg:w-[min(100%,28rem)] xl:w-[30rem] lg:shrink-0 flex flex-col pos-card p-0 overflow-hidden relative">
      {/* Order type */}
      <div className="p-3 border-b border-border flex gap-1">
        {(['dine-in', 'takeaway', 'delivery'] as const).map(t => (
          <button
            key={t}
            onClick={() => handleOrderTypeChange(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
              orderType === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dine-in table selection */}
      {orderType === 'dine-in' && (
        <div className="px-3 pb-3 border-b border-border flex items-center justify-between gap-2 pt-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Table</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {selectedTable
                ? `${selectedTable.name} · ${
                    floors.find(f => f.id === selectedTable.floorId)?.name ?? 'Floor'
                  } (${selectedTable.seats} seats)`
                : 'No table selected'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedTable && (
              <button
                type="button"
                onClick={() => setSelectedTableId(null)}
                className="text-[11px] text-muted-foreground hover:text-destructive underline-offset-2 hover:underline"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                tablesQuery.refetch();
                setShowTablePicker(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-[11px] font-medium text-foreground hover:border-primary/60 hover:bg-primary/5 transition-colors"
            >
              {selectedTable ? 'Change table' : 'Select table'}
            </button>
          </div>
        </div>
      )}

      {orderType === 'delivery' && (
        <div className="px-3 pb-3 border-b border-border space-y-3 pt-3">
          <p className="text-xs font-semibold text-foreground">Delivery details</p>
          <input
            type="text"
            value={deliveryCustomerName}
            onChange={e => setDeliveryCustomerName(e.target.value)}
            placeholder="Customer name"
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
          />
          <input
            type="tel"
            value={deliveryPhone}
            onChange={e => setDeliveryPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
          />
          <textarea
            rows={3}
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            placeholder="Delivery address"
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none"
          />
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Cart is empty</p>
          </div>
        ) : cart.map((c, index) => (
          <div
            key={`${c.menuItem.id}-${c.notes}-${c.extraName}-${c.extraPrice}-${index}`}
            className="rounded-2xl border border-border bg-muted/60 px-3 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{c.menuItem.name}</p>
                {c.extraName && (
                  <p className="text-[11px] text-primary font-bold mt-0.5">
                    + {c.extraName} (Rs. {Number(c.extraPrice).toLocaleString()})
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-0.5">Rs. {c.menuItem.price.toLocaleString()}</p>
                {c.notes && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 italic">
                    &ldquo;{c.notes}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setCustomizingItem(c.menuItem);
                    setEditingCartItemIndex(index);
                    setExtraName(c.extraName || '');
                    setExtraPrice(c.extraPrice || '');
                    setItemNotes(c.notes || '');
                    setIsCustomAddon(!!c.extraName && !COMMON_ADDONS.includes(c.extraName));
                  }}
                  className="text-primary hover:text-primary/80 p-1 rounded-full hover:bg-primary/10 transition-colors"
                  title="Add extras/notes"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeItem(c.menuItem.id, c.notes, c.extraName, c.extraPrice || 0)}
                  className="text-muted-foreground hover:text-destructive/90 p-1 rounded-full hover:bg-destructive/10 transition-colors"
                  aria-label="Remove item"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/60">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => updateQty(c.menuItem.id, -1, c.notes, c.extraName, c.extraPrice || 0)}
                  className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                >
                  {c.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                </button>
                <input
                  type="number"
                  value={c.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      updateQty(c.menuItem.id, 0, c.notes, c.extraName, c.extraPrice || 0, val);
                    } else if (e.target.value === '') {
                      // Allow empty input while typing, but maybe fall back to 0 or handle it
                      updateQty(c.menuItem.id, 0, c.notes, c.extraName, c.extraPrice || 0, 0);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-10 h-8 rounded-lg bg-background border border-border text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Item quantity"
                />
                <button
                  onClick={() => updateQty(c.menuItem.id, 1, c.notes, c.extraName, c.extraPrice || 0)}
                  className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <span className="text-sm font-semibold text-foreground">
                Rs. {((Number(c.menuItem.price) + Number(c.extraPrice || 0)) * c.quantity).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Taxable value</span><span>Rs. {taxableAmount.toLocaleString()}</span>
        </div>
        {orderType === 'dine-in' && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Service charge ({Math.round(taxRates.serviceChargeRate * 100)}%)</span><span>Rs. {serviceCharge.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>GST ({gstEnabled ? Math.round(taxRates.gstRate * 100) : 0}%)</span><span>Rs. {gstAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
          <span>Total taxes</span><span>Rs. {totalTaxAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border/60">
          <span>Total</span><span>Rs. {grandTotal.toLocaleString()}</span>
        </div>

        {/* GST Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="gst-checkbox"
            checked={gstEnabled}
            onChange={(e) => setGstEnabled(e.target.checked)}
            className="w-4 h-4 text-primary border-border rounded focus:ring-primary/30"
          />
          <label htmlFor="gst-checkbox" className="text-xs text-muted-foreground cursor-pointer">
            Include GST ({Math.round(taxRates.gstRate * 100)}%)
          </label>
        </div>

        <div className="pt-2">
          {selectedTable?.currentOrder && orderType === 'dine-in' && !currentOrderForEdit && (
            <button
              onClick={loadActiveTableOrder}
              className="w-full mb-2 py-2.5 rounded-xl border border-primary text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
            >
              Edit active order on {selectedTable.name}
            </button>
          )}
          {currentOrderForEdit && (
            <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-sm text-primary">
              <div className="flex items-center justify-between gap-3">
                <span>Editing order {currentOrderForEdit.id}. Save to update it.</span>
                <button
                  type="button"
                  onClick={() => setCurrentOrderForEdit(null)}
                  className="text-xs underline"
                >
                  Stop editing
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onPlaceOrder}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-secondary transition-colors"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}
