import { AlertCircle } from 'lucide-react';
import { usePOSStore } from '@/stores/pos/posStore';

export function DiscardOrderDialog() {
  const store = usePOSStore();
  const {
    showDiscardPopup, setShowDiscardPopup,
    pendingOrderType, setOrderType, setPendingOrderType,
    pendingNavigation, setPendingNavigation,
    setCart, setSelectedTableId, setSelectedTable
  } = store;

  if (!showDiscardPopup) return null;

  const handleDiscard = () => {
    setCart([]);
    if (pendingOrderType) {
      setOrderType(pendingOrderType);
      if (pendingOrderType !== 'dine-in') setSelectedTableId(null);
      setPendingOrderType(null);
    }
    if (pendingNavigation) {
      // In a real app, we might need a history.push here, 
      // but the layout handleNavigation will trigger after state change
      window.location.href = pendingNavigation;
      setPendingNavigation(null);
    }
    setShowDiscardPopup(false);
  };

  const handleCancel = () => {
    setShowDiscardPopup(false);
    setPendingOrderType(null);
    setPendingNavigation(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 anim-in fade-in duration-200">
      <div className="w-full max-w-sm bg-card rounded-xl border border-border shadow-2xl p-6 space-y-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-black text-foreground uppercase tracking-tight">Discard Current Order?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have items in your cart. Changing order type or leaving the terminal will clear your current selection.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleDiscard}
            className="w-full py-3 bg-destructive text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-destructive/90 transition-colors"
          >
            Yes, Discard Items
          </button>
          <button
            onClick={handleCancel}
            className="w-full py-3 bg-muted text-muted-foreground text-xs font-black uppercase tracking-widest rounded-lg hover:bg-muted/80 transition-colors"
          >
            No, Keep Order
          </button>
        </div>
      </div>
    </div>
  );
}
