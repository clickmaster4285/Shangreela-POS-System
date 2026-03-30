import { useState } from 'react';
import { menuItems as initialItems, menuCategories, type MenuItem } from '@/data/mockData';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: 'BBQ', description: '' });

  const openNew = () => { setForm({ name: '', price: '', category: 'BBQ', description: '' }); setEditing(null); setShowForm(true); };
  const openEdit = (item: MenuItem) => { setForm({ name: item.name, price: item.price.toString(), category: item.category, description: item.description }); setEditing(item); setShowForm(true); };

  const save = () => {
    if (!form.name || !form.price) return;
    if (editing) {
      setItems(prev =>
        prev.map(i =>
          i.id === editing.id
            ? { ...i, name: form.name, price: parseFloat(form.price), category: form.category, description: form.description }
            : i
        )
      );
      toast.success('Item updated');
    } else {
      setItems(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          name: form.name,
          price: parseFloat(form.price),
          category: form.category,
          description: form.description,
          image: '',
          available: true,
          perishable: false,
        },
      ]);
      toast.success('Item added');
    }
    setShowForm(false);
  };

  const toggleAvailability = (id: string) => { setItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i)); };
  const deleteItem = (id: string) => { setItems(prev => prev.filter(i => i.id !== id)); toast.success('Item deleted'); };

  const inputClass = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Menu Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit, or remove menu items.</p>
        </div>
        <button onClick={openNew} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-secondary transition-colors">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4" style={{ boxShadow: 'var(--shadow-elevated)' }}>
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold">{editing ? 'Edit Item' : 'New Item'}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <input className={inputClass} placeholder="Item name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs.</span>
              <input className={`${inputClass} pl-12`} placeholder="Price" type="number" step="1" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            </div>
            <select className={inputClass} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {menuCategories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
            <textarea className={`${inputClass} resize-none h-20`} placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <button onClick={save} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-secondary transition-colors">
              {editing ? 'Update' : 'Add'} Item
            </button>
          </div>
        </div>
      )}

      <div className="pos-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-3 px-2 font-medium">Item</th>
              <th className="py-3 px-2 font-medium">Category</th>
              <th className="py-3 px-2 font-medium">Price (PKR)</th>
              <th className="py-3 px-2 font-medium">Status</th>
              <th className="py-3 px-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-border/50 last:border-0">
                <td className="py-3 px-2">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                  </div>
                </td>
                <td className="py-3 px-2 text-muted-foreground">{item.category}</td>
                <td className="py-3 px-2 font-semibold text-foreground">Rs. {item.price.toLocaleString()}</td>
                <td className="py-3 px-2">
                  <button onClick={() => toggleAvailability(item.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.available ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}
                  >
                    {item.available ? 'Available' : 'Unavailable'}
                  </button>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteItem(item.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
