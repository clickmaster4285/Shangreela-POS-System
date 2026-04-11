import { useCallback, useEffect, useMemo, useState } from 'react';
import { type MenuItem } from '@/data/mockData';
import { Plus, Pencil, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, type PaginatedResponse } from '@/lib/api';

type MenuCategoriesResponse = { categories: string[] };
const DEFAULT_SPECIAL_CATEGORIES = ['Deals', 'Platters'] as const;
type BundleEntry = { id: string; name: string; quantity: number };

const parseBundleItemsFromDescription = (description: string, sourceItems: MenuItem[]): BundleEntry[] => {
  if (!description?.trim()) return [];
  const parts = description.split(',').map(p => p.trim()).filter(Boolean);
  return parts.map((part, idx) => {
    const match = part.match(/^(.*)\s+(\d+)$/);
    const parsedName = match ? match[1].trim() : part;
    const quantity = match ? Number(match[2]) : 1;
    const source = sourceItems.find(i => i.name.toLowerCase() === parsedName.toLowerCase());
    return {
      id: source?.id || `parsed:${idx}:${parsedName}`,
      name: source?.name || parsedName,
      quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
    };
  });
};

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
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryPickerSearch, setCategoryPickerSearch] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

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
      const searchQuery = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const response = await api<PaginatedResponse<MenuItem>>(`/menu?page=${page}&limit=${pageSize}${categoryQuery}${searchQuery}`);
      setItems(response.items);
      setMeta({ hasNext: response.pagination.hasNext, hasPrev: response.pagination.hasPrev });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load menu');
    }
  }, [page, pageSize, categoryFilter, debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: 'BBQ', description: '', kitchenRequired: true, image: '' });
  const [bundleItemId, setBundleItemId] = useState('');
  const [bundleQty, setBundleQty] = useState('1');
  const [bundleItems, setBundleItems] = useState<BundleEntry[]>([]);
  const [bundlePickerSearch, setBundlePickerSearch] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const cleanupImagePreview = () => {
    if (imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
  };

  const allCategories = Array.from(new Set([...categories, ...DEFAULT_SPECIAL_CATEGORIES]));
  const isBundleCategory = form.category === 'Deals' || form.category === 'Platters';
  const bundleSourceItems = useMemo(
    () => items.filter(i => i.category !== 'Deals' && i.category !== 'Platters' && i.id !== editing?.id),
    [items, editing?.id]
  );

  const openNew = (preferredCategory?: string) => {
    cleanupImagePreview();
    setImageFile(null);
    setImagePreviewUrl('');
    const fallbackCategory = allCategories[0] || 'Deals';
    const category = preferredCategory || fallbackCategory;
    setForm({ name: '', price: '', category, description: '', kitchenRequired: true, image: '' });
    setBundleItems([]);
    setBundleItemId('');
    setBundleQty('1');
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    cleanupImagePreview();
    setImageFile(null);
    setImagePreviewUrl('');
    setForm({ name: item.name, price: item.price.toString(), category: item.category, description: item.description, kitchenRequired: item.kitchenRequired !== false, image: item.image || '' });
    if (item.category === 'Deals' || item.category === 'Platters') {
      const sourceItems = items.filter(i => i.id !== item.id && i.category !== 'Deals' && i.category !== 'Platters');
      setBundleItems(parseBundleItemsFromDescription(item.description || '', sourceItems));
    } else {
      setBundleItems([]);
    }
    setBundleItemId('');
    setBundleQty('1');
    setEditing(item);
    setShowForm(true);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    cleanupImagePreview();
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreviewUrl(url);
    setForm(prev => ({ ...prev, image: url }));
  };

  useEffect(() => {
    return () => {
      cleanupImagePreview();
    };
  }, [imagePreviewUrl]);

  const save = () => {
    if (!form.name || !form.price) return;
    if (isBundleCategory && bundleItems.length === 0) {
      toast.error('Add at least one item for this deal/platter');
      return;
    }
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('price', form.price);
    formData.append('category', form.category);
    formData.append('description', form.description);
    formData.append('kitchenRequired', String(form.kitchenRequired));
    formData.append('image', form.image || '');
    if (imageFile) {
      formData.set('image', imageFile);
    }

    const request = editing
      ? api(`/menu/${editing.id}`, { method: 'PUT', body: formData })
      : api('/menu', { method: 'POST', body: formData });

    request.then(() => {
      toast.success(editing ? 'Item updated' : 'Item added');
      fetchItems();
    }).catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save item');
    });

    setShowForm(false);
  };

  useEffect(() => {
    if (!isBundleCategory) return;
    const description = bundleItems
      .map(entry => `${entry.name} ${entry.quantity}`)
      .join(', ');
    setForm(prev => ({ ...prev, description }));
  }, [isBundleCategory, bundleItems]);

  useEffect(() => {
    if (!isBundleCategory) {
      setBundleItems([]);
      setBundleItemId('');
      setBundleQty('1');
    }
  }, [isBundleCategory]);

  const addBundleItem = () => {
    const selected = bundleSourceItems.find(i => i.id === bundleItemId);
    const qty = Number(bundleQty);
    if (!selected) {
      toast.error('Select an item first');
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    setBundleItems(prev => {
      const existing = prev.find(x => x.id === selected.id);
      if (existing) {
        return prev.map(x => (x.id === selected.id ? { ...x, quantity: x.quantity + qty } : x));
      }
      return [...prev, { id: selected.id, name: selected.name, quantity: qty }];
    });
    setBundleQty('1');
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Menu Management</h1>
            <p className="text-sm text-muted-foreground">One search for names, descriptions, and categories. Use the list to show one category only.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCategoryForm(true)}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-secondary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
            <button onClick={() => openNew('Deals')} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-secondary/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Deal/Platter
            </button>
            <button onClick={() => openNew()} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-secondary transition-colors">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={e => {
                setPage(1);
                setSearchInput(e.target.value);
              }}
              placeholder="Search menu (item name, description, or category)…"
              className={`${inputClass} pl-10 w-full`}
              aria-label="Search menu"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap sm:shrink-0">
            <span className="hidden sm:inline">Show</span>
            <select
              value={categoryFilter}
              onChange={e => {
                setPage(1);
                setCategoryFilter(e.target.value);
              }}
              className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm min-w-[10rem] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="All">All categories</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
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
              {allCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {isBundleCategory && (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <p className="text-sm font-medium text-foreground">Select items and quantity</p>
                <div className="grid grid-cols-[1fr_92px_auto] gap-2">
                  <select
                    className={inputClass}
                    value={bundleItemId}
                    onChange={e => setBundleItemId(e.target.value)}
                  >
                    <option value="">Select item</option>
                    {bundleSourceItems.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    step="1"
                    value={bundleQty}
                    onChange={e => setBundleQty(e.target.value)}
                    placeholder="Qty"
                  />
                  <button
                    type="button"
                    onClick={addBundleItem}
                    className="px-3 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {bundleItems.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {bundleItems.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between rounded-lg bg-muted/60 px-2 py-1.5 text-xs">
                        <span className="truncate pr-2">{entry.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold">x{entry.quantity}</span>
                          <button
                            type="button"
                            className="text-destructive hover:underline"
                            onClick={() => setBundleItems(prev => prev.filter(x => x.id !== entry.id))}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.kitchenRequired}
                onChange={e => setForm({...form, kitchenRequired: e.target.checked})}
                className="accent-primary"
              />
              Send to kitchen
            </label>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Item image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={inputClass}
              />
              {form.image ? (
                <div className="relative">
                  <img src={form.image} alt="Item preview" className="h-36 w-full rounded-xl object-cover border border-border" />
                  <button
                    type="button"
                    onClick={() => {
                      cleanupImagePreview();
                      setImageFile(null);
                      setImagePreviewUrl('');
                      setForm(prev => ({ ...prev, image: '' }));
                    }}
                    className="absolute right-2 top-2 rounded-full bg-foreground/80 p-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
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
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                    </div>
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
