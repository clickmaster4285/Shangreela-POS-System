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
import { TablePicker } from '@/components/pos/TablePicker';

interface SwitchTableDialogProps {
  tables: TableInfo[];
  floors: { id: string; name: string }[];
  onSuccess: () => void;
}

export function SwitchTableDialog({ tables, floors, onSuccess }: SwitchTableDialogProps) {
  const { switchingTableOrder, setSwitchingTableOrder } = useOrderStore();
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<string>('');

  useEffect(() => {
    if (switchingTableOrder) {
      setSelectedTableId(null);
      if (floors.length > 0) {
        // Try to find the floor of the current table, otherwise default to first floor
        // Check both ID (number) and name (string)
        const currentTable = tables.find(t => t.id === Number(switchingTableOrder.table) || t.name === switchingTableOrder.table);
        setActiveFloorId(currentTable?.floorId || floors[0].id);
      }
    }
  }, [switchingTableOrder, floors, tables]);

  const handleConfirm = async () => {
    if (!switchingTableOrder || !selectedTableId) return;
    
    const targetTable = tables.find(t => t.id === selectedTableId);
    if (!targetTable) return;

    try {
      await api(`/orders/${switchingTableOrder.dbId}/table`, {
        method: 'PATCH',
        body: JSON.stringify({ table: targetTable.name }),
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
      <AlertDialogContent className="rounded-3xl border-border/50 max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Switch Table</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
              Moving order #{switchingTableOrder?.id} from {switchingTableOrder?.table} to a different table.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        
        <div className="flex-1 overflow-hidden min-h-[400px]">
          <TablePicker
            floors={floors}
            tables={tables}
            selectedTableId={selectedTableId}
            onTableSelect={setSelectedTableId}
            activeFloorId={activeFloorId}
            setActiveFloorId={setActiveFloorId}
            showOccupied={false} // Only show available tables for switching
          />
        </div>

        <AlertDialogFooter className="p-6 bg-muted/30 border-t border-border gap-3 shrink-0">
          <AlertDialogCancel className="rounded-xl border-border font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!selectedTableId}
            className="rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] hover:bg-secondary"
          >
            Confirm Move
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

