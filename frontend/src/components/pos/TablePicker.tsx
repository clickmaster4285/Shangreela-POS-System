import { Search, X } from 'lucide-react';
import { useState, useMemo } from 'react';
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

const normalizeTableSearch = (query: string) => {
  const q = query.trim().toUpperCase();
  const match = q.match(/^([MRBE])(\d+)$/);
  if (match) {
    const prefixMap: Record<string, string> = {
      'M': 'MH',
      'R': 'RT',
      'B': 'BT',
      'E': 'ET'
    };
    return `${prefixMap[match[1]]}-${match[2]}`;
  }
  return query.trim();
};

export function TablePicker({
  floors,
  tables,
  selectedTableId,
  onTableSelect,
  activeFloorId,
  setActiveFloorId,
  showOccupied = true
}: TablePickerProps) {
  const [search, setSearch] = useState('');

  const filteredTables = useMemo(() => {
    let result = tables;
    
    // Filter by floor if not searching or if specific floor selected
    if (activeFloorId !== 'all') {
      result = result.filter(t => t.floorId === activeFloorId);
    }

    if (search.trim()) {
      const searchInput = search.trim();
      const normalized = normalizeTableSearch(searchInput);
      const isNormalized = normalized !== searchInput;
      
      if (isNormalized) {
        // Exact match for mapped tables
        result = result.filter(t => t.name.toUpperCase() === normalized.toUpperCase());
      } else {
        // Loose match for others
        result = result.filter(t => 
          t.name.toLowerCase().includes(searchInput.toLowerCase()) ||
          String(t.id).includes(searchInput)
        );
      }
    }

    return result;
  }, [tables, activeFloorId, search]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search and Floor Selection */}
      <div className="p-3 border-b border-border space-y-2 bg-muted/30 shrink-0">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search table (e.g. M1, R2)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:font-normal"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveFloorId('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeFloorId === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All Floors
          </button>
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
      </div>

      {/* Tables Grid */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredTables.map(table => (
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
        
        {filteredTables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <Search className="w-12 h-12 mb-3 stroke-[1.5]" />
            <p className="text-sm font-bold">
              {search ? `No tables matching "${search}"` : 'No tables found on this floor'}
            </p>
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
