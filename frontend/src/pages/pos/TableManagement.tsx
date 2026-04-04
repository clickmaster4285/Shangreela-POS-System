import { useMemo, useState, useEffect } from 'react';
import { type FloorInfo, type TableInfo } from '@/data/mockData';
import { Users, Plus, Pencil, Trash2, Layers, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, MANAGER_ROLES } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { api, type PaginatedResponse } from '@/lib/api';

function newFloorId(name: string, existing: FloorInfo[]): string {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'floor';
  let id = base;
  let n = 0;
  while (existing.some(f => f.id === id)) {
    n += 1;
    id = `${base}-${n}`;
  }
  return id;
}

function nextTableId(tables: TableInfo[]): number {
  return tables.length === 0 ? 1 : Math.max(...tables.map(t => t.id)) + 1;
}

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user ? MANAGER_ROLES.includes(user.role) : false;

  const [floorsState, setFloorsState] = useState<FloorInfo[]>([]);
  const [tablesState, setTablesState] = useState<TableInfo[]>([]);
  const [floorId, setFloorId] = useState<string>('all');

  const load = () =>
    Promise.all([api<PaginatedResponse<{ id: string; key: string; name: string }>>('/floors?page=1&limit=200'), api<PaginatedResponse<{ id: string; number: number; name: string; seats: number; floorKey: string; status: TableInfo['status']; currentOrder?: string }>>('/tables?page=1&limit=500')]).then(([f, t]) => {
      if (f.items.length) setFloorsState(f.items.map(x => ({ id: x.key, name: x.name })));
      if (t.items.length) setTablesState(t.items.map(x => ({ id: x.number, name: x.name, seats: x.seats, floorId: x.floorKey, status: x.status, currentOrder: x.currentOrder })));
    });

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const [floorModal, setFloorModal] = useState(false);
  const [floorEditing, setFloorEditing] = useState<FloorInfo | null>(null);
  const [floorName, setFloorName] = useState('');

  const [tableModal, setTableModal] = useState(false);
  const [tableEditing, setTableEditing] = useState<TableInfo | null>(null);
  const [tableForm, setTableForm] = useState({
    name: '',
    floorId: '',
    seats: '4',
    status: 'available' as TableInfo['status'],
  });

  const openAddFloor = () => {
    setFloorEditing(null);
    setFloorName('');
    setFloorModal(true);
  };
  const openEditFloor = (f: FloorInfo) => {
    setFloorEditing(f);
    setFloorName(f.name);
    setFloorModal(true);
  };
  const saveFloor = () => {
    const n = floorName.trim();
    if (!n) {
      toast.error('Enter a floor name');
      return;
    }
    if (floorEditing) {
      api(`/floors/${floorEditing.id}`, { method: 'PUT', body: JSON.stringify({ key: floorEditing.id, name: n }) }).then(load);
      toast.success('Floor updated');
    } else {
      const id = newFloorId(n, floorsState);
      api('/floors', { method: 'POST', body: JSON.stringify({ key: id, name: n }) }).then(load);
      toast.success('Floor added');
    }
    setFloorModal(false);
  };
  const deleteFloor = (f: FloorInfo) => {
    if (tablesState.some(t => t.floorId === f.id)) {
      toast.error('Remove or reassign tables on this floor first.');
      return;
    }
    if (!window.confirm(`Remove floor “${f.name}”?`)) return;
    api<PaginatedResponse<{ id: string; key: string; name: string }>>('/floors?page=1&limit=200').then(async r => {
      const row = r.items.find(x => x.key === f.id);
      if (row) await api(`/floors/${row.id}`, { method: 'DELETE' });
      load();
    });
    if (floorId === f.id) setFloorId('all');
    toast.success('Floor removed');
  };

  const openAddTable = () => {
    if (floorsState.length === 0) {
      toast.error('Add a floor first');
      return;
    }
    setTableEditing(null);
    setTableForm({
      name: '',
      floorId: floorsState[0].id,
      seats: '4',
      status: 'available',
    });
    setTableModal(true);
  };
  const openEditTable = (t: TableInfo) => {
    setTableEditing(t);
    setTableForm({
      name: t.name,
      floorId: t.floorId,
      seats: String(t.seats),
      status: t.status,
    });
    setTableModal(true);
  };
  const saveTable = () => {
    const name = tableForm.name.trim();
    const seats = parseInt(tableForm.seats, 10);
    if (!name || !tableForm.floorId || isNaN(seats) || seats < 1) {
      toast.error('Enter name, floor, and valid seats');
      return;
    }
    if (!floorsState.some(f => f.id === tableForm.floorId)) {
      toast.error('Select a valid floor');
      return;
    }
    if (tableEditing) {
      api<PaginatedResponse<{ id: string; number: number }>>('/tables?page=1&limit=500').then(async rows => {
        const row = rows.items.find(x => x.number === tableEditing.id);
        if (row) await api(`/tables/${row.id}`, { method: 'PUT', body: JSON.stringify({ number: tableEditing.id, name, floorKey: tableForm.floorId, seats, status: tableForm.status }) });
        load();
      });
      toast.success('Table updated');
    } else {
      const id = nextTableId(tablesState);
      api('/tables', { method: 'POST', body: JSON.stringify({ number: id, name, floorKey: tableForm.floorId, seats, status: tableForm.status }) }).then(load);
      toast.success('Table added');
    }
    setTableModal(false);
  };
  const deleteTable = (t: TableInfo) => {
    if (!window.confirm(`Remove ${t.name}?`)) return;
    api<PaginatedResponse<{ id: string; number: number }>>('/tables?page=1&limit=500').then(async rows => {
      const row = rows.items.find(x => x.number === t.id);
      if (row) await api(`/tables/${row.id}`, { method: 'DELETE' });
      load();
    });
    toast.success('Table removed');
  };

  const filteredTables = useMemo(() => {
    if (floorId === 'all') return tablesState;
    return tablesState.filter(t => t.floorId === floorId);
  }, [tablesState, floorId]);

  const floorNameOf = (id: string) => floorsState.find(fl => fl.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Table Management</h1>
          <p className="text-sm text-muted-foreground">Browse tables by floor and open the POS. Superadmin and managers can add or edit floors and tables.</p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={openAddFloor}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-secondary transition-colors"
            >
              <Layers className="w-4 h-4" /> Add floor
            </button>
            <button
              type="button"
              onClick={openAddTable}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border bg-card hover:bg-muted transition-colors"
            >
              <LayoutGrid className="w-4 h-4" /> Add table
            </button>
          </div>
        )}
      </div>

      {canManage && floorsState.length > 0 && (
        <div className="pos-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Floors
          </h3>
          <ul className="space-y-2">
            {floorsState.map(f => (
              <li key={f.id} className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border/50 last:border-0">
                <span className="font-medium text-foreground">{f.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[40%]">{f.id}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditFloor(f)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Rename floor"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFloor(f)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title="Delete floor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFloorId('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${floorId === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          All floors
        </button>
        {floorsState.map(f => (
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
        {(['available', 'occupied', 'reserved'] as const).map(s => (
          <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground capitalize">
            <span className={`w-2.5 h-2.5 rounded-full ${statusDot[s]}`} /> {s} ({filteredTables.filter(t => t.status === s).length})
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredTables.map(table => (
          <div key={table.id} className="relative">
            {canManage && (
              <div className="absolute top-2 right-2 z-10 flex gap-0.5">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    openEditTable(table);
                  }}
                  className="p-1.5 rounded-lg bg-background/90 border border-border shadow-sm hover:bg-muted"
                  title="Edit table"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    deleteTable(table);
                  }}
                  className="p-1.5 rounded-lg bg-background/90 border border-border shadow-sm hover:bg-destructive/10 text-destructive"
                  title="Remove table"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/pos/terminal')}
              className={`w-full pos-card border-2 text-center py-6 hover:scale-[1.02] transition-all ${statusStyles[table.status]}`}
            >
              <p className="font-serif text-lg font-bold text-foreground mb-1">{table.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{floorNameOf(table.floorId)}</p>
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
          </div>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No tables in this view. {canManage ? 'Add a table or pick another floor.' : ''}</p>
      )}

      {/* Floor modal */}
      {floorModal && (
        <div className="fixed inset-0 bg-foreground/30 flex items-center justify-center z-50 p-4" onClick={() => setFloorModal(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-foreground">{floorEditing ? 'Rename floor' : 'Add floor'}</h3>
            <div>
              <label className="text-xs text-muted-foreground">Floor name</label>
              <input
                value={floorName}
                onChange={e => setFloorName(e.target.value)}
                placeholder="e.g. Rooftop"
                className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFloorModal(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted">
                Cancel
              </button>
              <button type="button" onClick={saveFloor} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-secondary">
                {floorEditing ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table modal */}
      {tableModal && (
        <div className="fixed inset-0 bg-foreground/30 flex items-center justify-center z-50 p-4" onClick={() => setTableModal(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-foreground">{tableEditing ? 'Edit table' : 'Add table'}</h3>
            <div>
              <label className="text-xs text-muted-foreground">Table name</label>
              <input
                value={tableForm.name}
                onChange={e => setTableForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Table 12"
                className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Floor</label>
              <select
                value={tableForm.floorId}
                onChange={e => setTableForm(p => ({ ...p, floorId: e.target.value }))}
                className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
              >
                {floorsState.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Seats</label>
                <input
                  type="number"
                  min={1}
                  value={tableForm.seats}
                  onChange={e => setTableForm(p => ({ ...p, seats: e.target.value }))}
                  className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={tableForm.status}
                  onChange={e => setTableForm(p => ({ ...p, status: e.target.value as TableInfo['status'] }))}
                  className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setTableModal(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted">
                Cancel
              </button>
              <button type="button" onClick={saveTable} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-secondary">
                {tableEditing ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
