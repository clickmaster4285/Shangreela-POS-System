import { useState, useEffect } from 'react';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';
import { useOrderStore } from '@/stores/pos/orderStore';
import { api } from '@/lib/api/api';
import { toast } from 'sonner';
import { TableInfo } from '@/data/pos/mockData';

interface SwitchTableDialogProps {
  tables: TableInfo[];
  onSuccess: () => void;
}

export function SwitchTableDialog({ tables, onSuccess }: SwitchTableDialogProps) {
  const { switchingTableOrder, setSwitchingTableOrder } = useOrderStore();
  const [tableId, setTableId] = useState<string>('');

  useEffect(() => {
    if (switchingTableOrder) {
      setTableId('');
    }
  }, [switchingTableOrder]);

  const handleConfirm = async () => {
    if (!switchingTableOrder || !tableId) return;
    try {
      await api(`/orders/${switchingTableOrder.dbId}/table`, {
        method: 'PATCH',
        body: JSON.stringify({ table: Number(tableId) }),
      });
      toast.success('Table switched');
      setSwitchingTableOrder(null);
      onSuccess();
    } catch {
      toast.error('Failed to switch table');
    }
  };

  return (
    <AlertDialog open={!!switchingTableOrder} onOpenChange={(open) => !open && setSwitchingTableOrder(null)}>
      <AlertDialogContent className="rounded-3xl border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Switch Table</AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
            Moving order #{switchingTableOrder?.id} to a different table.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4 space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Target Table</label>
          <select
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="">Select an available table...</option>
            {tables
              .filter(t => t.status === 'available')
              .map(table => (
                <option key={table.id} value={table.id}>
                  {table.name} ({table.seats} Seats)
                </option>
              ))
            }
          </select>
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel className="rounded-xl border-border font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!tableId}
            className="rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] hover:bg-secondary"
          >
            Confirm Move
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

