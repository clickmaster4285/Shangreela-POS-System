import { useCallback, useEffect, useState } from 'react';
import { type MenuItem } from '@/data/mockData';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, type PaginatedResponse } from '@/lib/api';

type MenuCategoriesResponse = { categories: string[] };

export default function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [meta, setMeta] = useState({ hasNext: false, hasPrev: false });

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const response = await api<MenuCategoriesResponse>('/menu/categories');
      setCategories(response.categories);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load menu categories');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const categoryQuery = categoryFilter !== 'All' ? `&category=${encodeURIComponent(categoryFilter)}` : '';
      const response = await api<PaginatedResponse<MenuItem>>(`/menu?page=${page}&limit=${pageSize}${categoryQuery}`);
      setItems(response.items);
      setMeta({ hasNext: response.pagination.hasNext, hasPrev: response.pagination.hasPrev });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load menu');
    }
  }, [page, pageSize, categoryFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: 'BBQ', description: '', kitchenRequired: true });

  const openNew = () => { setForm({ name: '', price: '', category: 'BBQ', description: '', kitchenRequired: true }); setEditing(null); setShowForm(true); };
  const openEdit = (item: MenuItem) => { setForm({ name: item.name, price: item.price.toString(), category: item.category, description: item.description, kitchenRequired: item.kitchenRequired !== false }); setEditing(item); setShowForm(true); };

  const save = () => {
    if (!form.name || !form.price) return;
    if (editing) {
      api(`/menu/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: form.name, price: parseFloat(form.price), category: form.category, description: form.description, kitchenRequired: form.kitchenRequired }),
      }).then(() => {
        toast.success('Item updated');
        fetchItems();
      });
    } else {
      api('/menu', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          category: form.category,
          description: form.description,
          image: '',
          available: true,
          perishable: false,
          kitchenRequired: form.kitchenRequired,
        }),
      }).then(() => {
        toast.success('Item added');
        fetchItems();
      });
    }
    setShowForm(false);
  };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      toast.error('Enter a category name');
      return;
    }
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Category already exists');
      return;
    }
    
    api('/menu/categories', {
      method: 'POST',
      body: JSON.stringify({ name: trimmed }),
    }).then(() => {
      toast.success('Category added');
      fetchCategories();
      setNewCategory('');
      setShowCategoryForm(false);
      setCategoryFilter(trimmed);
    }).catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add category');
    });
  };

  const toggleAvailability = (id: string) => {
    const row = items.find(i => i.id === id);
    if (!row) return;
    api(`/menu/${id}`, { method: 'PUT', body: JSON.stringify({ available: !row.available }) }).then(fetchItems);
  };
  const deleteItem = (id: string) => {
    api(`/menu/${id}`, { method: 'DELETE' }).then(() => {
      toast.success('Item deleted');
      fetchItems();
    });
  };

  const inputClass = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Menu Management</h1>
          <p className="text-sm text-muted-foreground">Filter menu items by category, add new categories, or manage items in each category.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-sm text-muted-foreground flex items-center gap-2">
            Category
            <select
              value={categoryFilter}
              onChange={e => {
                setPage(1);
                setCategoryFilter(e.target.value);
              }}
              className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option key="All" value="All">All</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setShowCategoryForm(true)}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-secondary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
          <button onClick={openNew} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-secondary transition-colors">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
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
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.kitchenRequired}
                onChange={e => setForm({...form, kitchenRequired: e.target.checked})}
                className="accent-primary"
              />
              Send to kitchen
            </label>
            <textarea className={`${inputClass} resize-none h-20`} placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <button onClick={save} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-secondary transition-colors">
              {editing ? 'Update' : 'Add'} Item
            </button>
          </div>
        </div>
      )}

      {showCategoryForm && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4" style={{ boxShadow: 'var(--shadow-elevated)' }}>
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold">New Category</h3>
              <button onClick={() => setShowCategoryForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <input
              className={inputClass}
              placeholder="Category name"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addCategory}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-secondary transition-colors"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pos-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="sticky left-0 z-10 bg-card py-3 px-2 font-medium">#</th>
              <th className="py-3 px-2 font-medium">Item</th>
              <th className="py-3 px-2 font-medium">Category</th>
              <th className="py-3 px-2 font-medium">Kitchen</th>
              <th className="py-3 px-2 font-medium">Price (PKR)</th>
              <th className="py-3 px-2 font-medium">Status</th>
              <th className="py-3 px-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-border/50 last:border-0">
                <td className="sticky left-0 z-0 bg-card py-3 px-2 text-muted-foreground">{(page - 1) * pageSize + index + 1}</td>
                <td className="py-3 px-2">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                  </div>
                </td>
                <td className="py-3 px-2 text-muted-foreground">{item.category}</td>
                <td className="py-3 px-2 text-sm font-medium text-foreground">{item.kitchenRequired !== false ? 'Yes' : 'No'}</td>
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
<div className="flex justify-between items-center w-full">
  
  {/* LEFT SIDE */}
  <label className="text-sm text-muted-foreground flex items-center gap-2">
    Show
    <select
      value={pageSize}
      onChange={e => {
        setPage(1);
        setPageSize(Number(e.target.value));
      }}
      className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
    >
      {[20, 50, 100].map(size => (
        <option key={size} value={size}>{size}</option>
      ))}
    </select>
    records
  </label>

  {/* RIGHT SIDE */}
  <div className="flex gap-2">
    <button
      disabled={!meta.hasPrev}
      onClick={() => setPage(p => Math.max(1, p - 1))}
      className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50"
    >
      Previous
    </button>

    <button
      disabled={!meta.hasNext}
      onClick={() => setPage(p => p + 1)}
      className="px-3 py-2 rounded-xl border border-border text-xs disabled:opacity-50"
    >
      Next
    </button>
  </div>

</div>
    </div>
  );
}
