import { X } from 'lucide-react';
import { usePOSStore } from '@/stores/pos/posStore';
import { TablePicker } from '@/components/pos/TablePicker';

export function TablePickerModal() {
  const store = usePOSStore();
  const {
    showTablePicker, setShowTablePicker,
    floors, activeFloorId, setActiveFloorId,
    tables, selectedTableId, setSelectedTableId, setOrderType
  } = store;

  if (!showTablePicker) return null;

  const handleTableSelect = (tableId: number) => {
    setSelectedTableId(tableId);
    setOrderType('dine-in');
    setShowTablePicker(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-4xl bg-card rounded-xl border border-border shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Select Dine-in Table</h2>
          <button onClick={() => setShowTablePicker(false)} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <TablePicker
          floors={floors}
          tables={tables}
          selectedTableId={selectedTableId}
          onTableSelect={handleTableSelect}
          activeFloorId={activeFloorId}
          setActiveFloorId={setActiveFloorId}
        />

        <div className="p-4 bg-muted/30 border-t border-border flex justify-end shrink-0">
           <button 
             onClick={() => setShowTablePicker(false)}
             className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-[10px] font-black uppercase tracking-widest"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
}
