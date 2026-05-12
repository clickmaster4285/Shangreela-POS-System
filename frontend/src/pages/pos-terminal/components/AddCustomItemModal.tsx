import { X } from 'lucide-react';
import { useState } from 'react';
import { usePOSStore } from '@/stores/pos/posStore';

export function AddCustomItemModal() {
  const store = usePOSStore();
  const { showAddCustomModal, setShowAddCustomModal, addToCart } = store;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  if (!showAddCustomModal) return null;

  const handleClose = () => {
    setShowAddCustomModal(false);
    setName('');
    setPrice('');
    setNotes('');
  };

  const handleAdd = () => {
    if (!name.trim() || !price) return;

    addToCart({
      id: Math.random(), // Temporary ID for custom item
      name: name.trim(),
      price: Number(price),
      category: 'Custom',
      available: true
    }, notes.trim());

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-2xl overflow-hidden anim-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Add Custom Item</h2>
          <button onClick={handleClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Item Name</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Special Request"
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Price (Rs.)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0"
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notes / Details</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any specific details for the kitchen..."
              rows={2}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </div>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!name.trim() || !price}
            className="px-6 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}
