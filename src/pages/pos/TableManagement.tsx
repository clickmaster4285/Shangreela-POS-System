import { useMemo, useState } from 'react';
import { floors, tables as initialTables, type TableInfo } from '@/data/mockData';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusStyles: Record<string, string> = {
  available: 'border-success/40 bg-success/5',
  occupied: 'border-primary/40 bg-primary/5',
  reserved: 'border-warning/40 bg-warning/5',
};

const statusDot: Record<string, string> = {
  available: 'bg-success',
  occupied: 'bg-primary',
  reserved: 'bg-warning',
};

export default function TableManagement() {
  const [tablesData] = useState<TableInfo[]>(initialTables);
  const [floorId, setFloorId] = useState<string>('all');
  const navigate = useNavigate();

  const filteredTables = useMemo(() => {
    if (floorId === 'all') return tablesData;
    return tablesData.filter(t => t.floorId === floorId);
  }, [tablesData, floorId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Table Management</h1>
        <p className="text-sm text-muted-foreground">Browse tables by floor, then open the POS for a table.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFloorId('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${floorId === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          All floors
        </button>
        {floors.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFloorId(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${floorId === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {['available', 'occupied', 'reserved'].map(s => (
          <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground capitalize">
            <span className={`w-2.5 h-2.5 rounded-full ${statusDot[s]}`} /> {s} ({filteredTables.filter(t => t.status === s).length})
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredTables.map(table => (
          <button
            key={table.id}
            onClick={() => navigate('/pos/terminal')}
            className={`pos-card border-2 text-center py-6 hover:scale-[1.02] transition-all ${statusStyles[table.status]}`}
          >
            <p className="font-serif text-lg font-bold text-foreground mb-1">{table.name}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              {floors.find(fl => fl.id === table.floorId)?.name ?? table.floorId}
            </p>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs">{table.seats} seats</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium capitalize px-2.5 py-1 rounded-full ${
                table.status === 'available'
                  ? 'bg-success/10 text-success'
                  : table.status === 'occupied'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-warning/10 text-warning'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot[table.status]}`} />
              {table.status}
            </span>
            {table.currentOrder && <p className="text-xs text-muted-foreground mt-2">{table.currentOrder}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
