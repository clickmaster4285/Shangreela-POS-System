import { Search } from 'lucide-react';
import { TableInfo } from '@/data/pos/mockData';

interface TablePickerProps {
  floors: { id: string; name: string }[];
  tables: TableInfo[];
  selectedTableId: number | null;
  onTableSelect: (tableId: number) => void;
  activeFloorId: string;
  setActiveFloorId: (floorId: string) => void;
  showOccupied?: boolean;
}

export function TablePicker({
  floors,
  tables,
  selectedTableId,
  onTableSelect,
  activeFloorId,
  setActiveFloorId,
  showOccupied = true
}: TablePickerProps) {
  const currentTables = tables.filter(t => t.floorId === activeFloorId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Floor Selection */}
      <div className="p-2 border-b border-border flex items-center gap-1 bg-muted/30 overflow-x-auto scrollbar-none shrink-0">
        {floors.map(floor => (
          <button
            key={floor.id}
            onClick={() => setActiveFloorId(floor.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeFloorId === floor.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {floor.name}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {currentTables.map(table => (
            <button
              key={table.id}
              disabled={!showOccupied && table.status === 'occupied'}
              onClick={() => onTableSelect(table.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all group ${
                selectedTableId === table.id
                  ? 'border-primary bg-primary/5'
                  : table.status === 'occupied'
                  ? 'border-secondary/20 bg-secondary/5 opacity-60 cursor-not-allowed'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className={`text-base font-black mb-1 ${
                selectedTableId === table.id ? 'text-primary' : 'text-foreground'
              }`}>
                {table.name}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                {table.seats} Seats
              </span>
              
              {table.status === 'occupied' && (
                <div className="mt-2 px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-[8px] font-black uppercase tracking-wider">
                  Occupied
                </div>
              )}
            </button>
          ))}
        </div>
        
        {currentTables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <Search className="w-12 h-12 mb-3 stroke-[1.5]" />
            <p className="text-sm font-bold">No tables found on this floor</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-muted/30 border-t border-border flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
         <div className="flex gap-4">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-border" /> Available</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-secondary/40" /> Occupied</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Selected</div>
         </div>
      </div>
    </div>
  );
}
