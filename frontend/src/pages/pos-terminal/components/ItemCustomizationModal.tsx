import { X, Plus } from 'lucide-react';
import { COMMON_ADDONS } from '@/data/pos/posConstants';
import { usePOSStore } from '@/stores/pos/posStore';

export function ItemCustomizationModal() {
  const store = usePOSStore();
  const {
    customizingItem, setCustomizingItem,
    editingCartItemIndex, setEditingCartItemIndex,
    extraName, setExtraName,
    extraPrice, setExtraPrice,
    itemNotes, setItemNotes,
    isCustomAddon, setIsCustomAddon,
    addToCart, updateCartItem
  } = store;

  if (!customizingItem) return null;

  const handleClose = () => {
    setCustomizingItem(null);
    setEditingCartItemIndex(-1);
    setExtraName('');
    setExtraPrice('');
    setItemNotes('');
    setIsCustomAddon(false);
  };

  const handleApply = () => {
    const finalPrice = extraPrice ? Number(extraPrice) : 0;
    const finalExtraName = isCustomAddon ? (extraName.trim() || 'Custom Addon') : extraName;

    if (editingCartItemIndex >= 0) {
      updateCartItem(editingCartItemIndex, {
        notes: itemNotes.trim(),
        extraName: finalExtraName || undefined,
        extraPrice: finalPrice || 0
      });
    } else {
      addToCart(customizingItem, itemNotes.trim(), finalExtraName || undefined, finalPrice || 0);
    }
    handleClose();
  };

  const allAddons = [...COMMON_ADDONS, ...(isCustomAddon ? [] : [])];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-bold truncate">Customize: {customizingItem.name}</h2>
          <button onClick={handleClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Special Instructions / Notes</label>
            <textarea
              value={itemNotes}
              onChange={e => setItemNotes(e.target.value)}
              placeholder="e.g., No spicy, extra ketchup..."
              rows={2}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </div>

          {/* Addon Selection and Price */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Addon / Variety</label>
            <div className="flex gap-2">
              <select
                value={isCustomAddon ? 'custom' : extraName}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'custom') {
                    setIsCustomAddon(true);
                    setExtraName('');
                    setExtraPrice('');
                  } else {
                    setIsCustomAddon(false);
                    setExtraName(value);
                    setExtraPrice('');
                  }
                }}
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">No Addon</option>
                {COMMON_ADDONS.map(addon => (
                  <option key={addon} value={addon}>{addon}</option>
                ))}
                <option value="custom">+ Custom Addon</option>
              </select>
              <input
                type="number"
                value={extraPrice}
                onChange={e => setExtraPrice(e.target.value)}
                placeholder="Price (Rs.)"
                className="w-24 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Custom Addon Name */}
          {isCustomAddon && (
            <div className="space-y-1.5 anim-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-medium text-muted-foreground">Custom Addon Name</label>
              <input
                type="text"
                value={extraName}
                onChange={e => setExtraName(e.target.value)}
                placeholder="e.g., Extra Cheese"
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            {editingCartItemIndex >= 0 ? 'Update Item' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
