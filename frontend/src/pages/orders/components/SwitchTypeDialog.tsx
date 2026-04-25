import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { useOrderStore } from '@/stores/pos/orderStore';
import { api } from '@/lib/api/api';
import { toast } from 'sonner';
import { TableInfo } from '@/data/pos/mockData';
import { TablePicker } from '@/components/pos/TablePicker';
import { ShoppingBag, Truck, MapPin } from 'lucide-react';

interface SwitchTypeDialogProps {
  tables: TableInfo[];
  floors: { id: string; name: string }[];
  onSuccess: () => void;
}

export function SwitchTypeDialog({ tables, floors, onSuccess }: SwitchTypeDialogProps) {
  const { switchingTypeOrder, setSwitchingTypeOrder } = useOrderStore();
  const [selectedType, setSelectedType] = useState<'dine-in' | 'takeaway' | 'delivery' | ''>('');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<string>('');

  useEffect(() => {
    if (switchingTypeOrder) {
      setSelectedType(switchingTypeOrder.type);
      
      if (switchingTypeOrder.type === 'dine-in') {
        const currentTable = tables.find(t => 
          t.name === switchingTypeOrder.table || t.id === Number(switchingTypeOrder.table)
        );
        setSelectedTableId(currentTable ? currentTable.id : null);
        if (currentTable) {
          setActiveFloorId(currentTable.floorId);
        } else if (floors.length > 0) {
          setActiveFloorId(floors[0].id);
        }
      } else {
        setSelectedTableId(null);
        if (floors.length > 0) {
          setActiveFloorId(floors[0].id);
        }
      }
    }
  }, [switchingTypeOrder, floors, tables]);

  const handleConfirm = async () => {
    if (!switchingTypeOrder || !selectedType) return;
    
    const payload: any = { type: selectedType };
    if (selectedType === 'dine-in') {
      if (!selectedTableId) {
        toast.error('Please select a table for dine-in');
        return;
      }
      const table = tables.find(t => t.id === selectedTableId);
      payload.table = table?.name;
      
      // If it was already dine-in and the table name is the same, check if anything actually changed
      if (switchingTypeOrder.type === 'dine-in' && payload.table === switchingTypeOrder.table) {
        toast.info('No changes made');
        setSwitchingTypeOrder(null);
        return;
      }
    }

    try {
      await api(`/orders/${switchingTypeOrder.dbId}/switch-type`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      toast.success(`Order updated successfully`);
      setSwitchingTypeOrder(null);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order');
    }
  };

  return (
    <Dialog open={!!switchingTypeOrder} onOpenChange={(open) => !open && setSwitchingTypeOrder(null)}>
      <DialogContent className="rounded-3xl border-border/50 max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden bg-card shadow-2xl">
        <div className="p-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Switch Type / Table</DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground">
              Change the service type or table for order #{switchingTypeOrder?.id}.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedType('dine-in')}
              className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${selectedType === 'dine-in' ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border/50 text-muted-foreground hover:border-primary/30'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedType === 'dine-in' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Dine-in</span>
            </button>
            
            <button
              onClick={() => setSelectedType('takeaway')}
              className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${selectedType === 'takeaway' ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border/50 text-muted-foreground hover:border-primary/30'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedType === 'takeaway' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Takeaway</span>
            </button>

            <button
              onClick={() => setSelectedType('delivery')}
              className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${selectedType === 'delivery' ? 'bg-primary/5 border-primary text-primary' : 'bg-card border-border/50 text-muted-foreground hover:border-primary/30'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedType === 'delivery' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Delivery</span>
            </button>
          </div>

          {selectedType === 'dine-in' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between pl-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  {switchingTypeOrder?.type === 'dine-in' ? 'Switch to New Table' : 'Select Table'}
                </h3>
                {selectedTableId && (
                  <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    Selected: {tables.find(t => t.id === selectedTableId)?.name}
                  </span>
                )}
              </div>
              <div className="rounded-2xl border border-border/50 overflow-hidden h-[340px] bg-muted/10 shadow-inner">
                <TablePicker
                  floors={floors}
                  tables={tables.map(t => ({
                    ...t,
                    // If it's the current table of this order, show it as available so it can be selected/stay selected
                    status: (t.name === switchingTypeOrder?.table || t.id === Number(switchingTypeOrder?.table)) 
                      ? 'available' 
                      : t.status
                  }))}
                  selectedTableId={selectedTableId}
                  onTableSelect={setSelectedTableId}
                  activeFloorId={activeFloorId}
                  setActiveFloorId={setActiveFloorId}
                  showOccupied={false}
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {selectedType !== 'dine-in' && selectedType !== '' && switchingTypeOrder?.type === 'dine-in' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xs font-bold text-amber-700 leading-tight">
                  Table {switchingTypeOrder.table} will be freed and service charges will be removed from this order.
                </p>
              </div>
            )}

            {selectedType === 'dine-in' && switchingTypeOrder?.type !== 'dine-in' && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs font-bold text-blue-700 leading-tight">
                  Service charges will be applied automatically for dine-in service.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/30 border-t border-border gap-3 shrink-0 sm:flex-row flex-col">
          <button 
            onClick={() => setSwitchingTypeOrder(null)} 
            className="flex-1 px-6 py-3.5 rounded-xl border border-border bg-card text-foreground font-bold uppercase tracking-widest text-[10px] hover:bg-muted transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedType || (selectedType === 'dine-in' && !selectedTableId)}
            className="flex-[2] px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] hover:bg-secondary transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            Confirm Changes
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
