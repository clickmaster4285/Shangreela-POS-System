import { useCallback, useEffect, useMemo, useState } from 'react';
import { type MenuItem } from '@/data/pos/mockData';
import { Plus, Search } from 'lucide-react';
import { BASE_UNITS } from '@/pages/inventory/modals/AddItemModal';
import { toast } from 'sonner';
import { api, type PaginatedResponse } from '@/lib/api/api';
import { usePosRealtimeScopes } from '@/hooks/pos/use-pos-realtime';
import { MenuItemFormModal } from './components/MenuItemFormModal';
import { AddCategoryModal } from './components/AddCategoryModal';
import { MenuItemsTable } from './components/MenuItemsTable';

type MenuCategoriesResponse = { categories: string[] };
type Recipe = {
  id: string;
  name: string;
  ingredients: Array<{
    inventoryItem: {
      _id: string;
      name: string;
      unit: string;
    };
    baseQuantity: number;
    unit: string;
  }>;
};
type RecipesResponse = PaginatedResponse<Recipe>;
const DEFAULT_SPECIAL_CATEGORIES = ['Deals', 'Platters'] as const;
type BundleEntry = { id: string; name: string; quantity: number };
type IngredientOverride = { inventoryItem: string; baseQuantity: number; unit: string };
type MenuRecipeRef = string | { _id?: string; id?: string; name?: string } | null;

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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventoryItems, setInventoryItems] = useState<Array<{ _id: string; name: string; unit: string }>>([]);

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

  const fetchRecipes = useCallback(async () => {
    try {
      const response = await api<RecipesResponse>('/recipes?limit=100');
      setRecipes(response.items);
    } catch (error) {
      console.error('Failed to load recipes', error);
    }
  }, []);

  const fetchInventoryItems = useCallback(async () => {
    try {
      const response = await api<{ items: Array<{ id: string; name: string; unit: string }>; pagination: any }>('/inventory/items?limit=500');
      setInventoryItems(response.items.map((i: any) => ({ _id: i.id, name: i.name, unit: i.unit })));
    } catch (error) {
      console.error('Failed to load inventory items', error);
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
    fetchRecipes();
    fetchInventoryItems();
  }, [fetchCategories, fetchRecipes, fetchInventoryItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const refreshMenuAdmin = useCallback(() => {
    void fetchCategories();
    void fetchItems();
  }, [fetchCategories, fetchItems]);

  usePosRealtimeScopes(['menu'], refreshMenuAdmin);

  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: 'BBQ', description: '', kitchenRequired: true, image: '' });
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [scale, setScale] = useState('1');
  const [ingredientOverrides, setIngredientOverrides] = useState<IngredientOverride[]>([]);
  const [showOverrides, setShowOverrides] = useState(false);
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeIngredients, setNewRecipeIngredients] = useState<Array<{ inventoryItem: string; baseQuantity: string; unit: string }>>([]);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [overrideIngredientSearch, setOverrideIngredientSearch] = useState('');
  const [bundleItemId, setBundleItemId] = useState('');
  const [bundleQty, setBundleQty] = useState('1');
  const [bundleItems, setBundleItems] = useState<BundleEntry[]>([]);
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
  const selectedRecipe = useMemo(
    () => recipes.find(r => r.id === selectedRecipeId) || null,
    [recipes, selectedRecipeId]
  );

  const normalizeRecipeId = (recipe: MenuRecipeRef) => {
    if (!recipe) return null;
    if (typeof recipe === 'string') return recipe;
    return recipe.id || recipe._id || null;
  };

  const mergedRecipeIngredients = useMemo(() => {
    if (!selectedRecipe) return [];
    const baseMap = new Map(
      selectedRecipe.ingredients.map((ing) => [
        ing.inventoryItem._id,
        {
          inventoryItem: ing.inventoryItem._id,
          name: ing.inventoryItem.name,
          unit: ing.unit,
          quantity: ing.baseQuantity * (parseFloat(scale) || 1),
          isBase: true,
          isRemoved: false,
        },
      ])
    );
    ingredientOverrides.forEach((override) => {
      const existing = baseMap.get(override.inventoryItem);
      if (existing) {
        baseMap.set(override.inventoryItem, {
          ...existing,
          quantity: override.baseQuantity,
          unit: override.unit || existing.unit,
          isRemoved: Number(override.baseQuantity) === 0,
        });
        return;
      }
      const inventoryItem = inventoryItems.find((item) => item._id === override.inventoryItem);
      baseMap.set(override.inventoryItem, {
        inventoryItem: override.inventoryItem,
        name: inventoryItem?.name || 'Unknown',
        unit: override.unit || inventoryItem?.unit || '',
        quantity: Number(override.baseQuantity) || 0,
        isBase: false,
        isRemoved: Number(override.baseQuantity) === 0,
      });
    });
    return Array.from(baseMap.values());
  }, [ingredientOverrides, inventoryItems, scale, selectedRecipe]);

  const overrideSearchResults = useMemo(() => {
    const query = overrideIngredientSearch.trim().toLowerCase();
    if (!query || !selectedRecipe) return [];
    const usedIds = new Set(mergedRecipeIngredients.map((ing) => ing.inventoryItem));
    return inventoryItems
      .filter((item) => !usedIds.has(item._id))
      .filter((item) => item.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [inventoryItems, mergedRecipeIngredients, overrideIngredientSearch, selectedRecipe]);

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
    setSelectedRecipeId(null);
    setScale('1');
    setIngredientOverrides([]);
    setShowOverrides(false);
    setShowCreateRecipe(false);
    setNewRecipeName('');
    setNewRecipeIngredients([]);
    setIngredientSearch('');
    setOverrideIngredientSearch('');
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
    setSelectedRecipeId(normalizeRecipeId((item as { recipe?: MenuRecipeRef } & MenuItem).recipe));
    setScale(String((item as { scale?: number } & MenuItem).scale || 1));
    setIngredientOverrides((((item as { ingredientOverrides?: IngredientOverride[] } & MenuItem).ingredientOverrides) || []).map(override => ({
      inventoryItem: String(override.inventoryItem),
      baseQuantity: Number(override.baseQuantity),
      unit: override.unit,
    })));
    setShowOverrides(false);
    setShowCreateRecipe(false);
    setNewRecipeName('');
    setNewRecipeIngredients([]);
    setOverrideIngredientSearch('');
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
    return () => { cleanupImagePreview(); };
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
    formData.append('recipe', selectedRecipeId || '');
    formData.append('scale', scale);
    formData.append('ingredientOverrides', JSON.stringify(ingredientOverrides));
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
    const description = bundleItems.map(entry => `${entry.name} ${entry.quantity}`).join(', ');
    setForm(prev => ({ ...prev, description }));
  }, [isBundleCategory, bundleItems]);

  useEffect(() => {
    if (!isBundleCategory) {
      setBundleItems([]);
      setBundleItemId('');
      setBundleQty('1');
    }
  }, [isBundleCategory]);

  const saveRecipe = () => {
    if (!newRecipeName.trim()) { toast.error('Enter recipe name'); return; }
    if (newRecipeIngredients.length === 0 || newRecipeIngredients.some(i => !i.inventoryItem || !i.baseQuantity)) {
      toast.error('Add all ingredients');
      return;
    }
    const payload = {
      name: newRecipeName.trim(),
      ingredients: newRecipeIngredients.map(i => ({
        inventoryItem: i.inventoryItem,
        baseQuantity: parseFloat(i.baseQuantity),
        unit: i.unit,
      })),
    };
    api('/recipes', { method: 'POST', body: JSON.stringify(payload) })
      .then((res) => {
        const newRecipe = {
          id: (res as { id: string }).id,
          ...payload,
          ingredients: newRecipeIngredients.map((i) => ({
            inventoryItem: {
              _id: i.inventoryItem,
              name: inventoryItems.find(x => x._id === i.inventoryItem)?.name || '',
              unit: i.unit,
            },
            baseQuantity: parseFloat(i.baseQuantity),
            unit: i.unit,
          })),
        };
        setRecipes(prev => [newRecipe, ...prev]);
        setSelectedRecipeId(newRecipe.id);
        setShowCreateRecipe(false);
        setNewRecipeName('');
        setNewRecipeIngredients([]);
        setIngredientSearch('');
        toast.success('Recipe created');
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to create recipe'));
  };

  const addBundleItem = () => {
    const selected = bundleSourceItems.find(i => i.id === bundleItemId);
    const qty = Number(bundleQty);
    if (!selected) { toast.error('Select an item first'); return; }
    if (!Number.isInteger(qty) || qty <= 0) { toast.error('Enter a valid quantity'); return; }
    setBundleItems(prev => {
      const existing = prev.find(x => x.id === selected.id);
      if (existing) return prev.map(x => (x.id === selected.id ? { ...x, quantity: x.quantity + qty } : x));
      return [...prev, { id: selected.id, name: selected.name, quantity: qty }];
    });
    setBundleQty('1');
  };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) { toast.error('Enter a category name'); return; }
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) { toast.error('Category already exists'); return; }
    api('/menu/categories', { method: 'POST', body: JSON.stringify({ name: trimmed }) }).then(() => {
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
      {/* Header + Search / Filter bar */}
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
              onChange={e => { setPage(1); setSearchInput(e.target.value); }}
              placeholder="Search menu (item name, description, or category)…"
              className={`${inputClass} pl-10 w-full`}
              aria-label="Search menu"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap sm:shrink-0">
            <span className="hidden sm:inline">Show</span>
            <select
              value={categoryFilter}
              onChange={e => { setPage(1); setCategoryFilter(e.target.value); }}
              className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm min-w-[10rem] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="All">All categories</option>
              {allCategories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Create / Edit Item Modal */}
      <MenuItemFormModal
        showForm={showForm}
        setShowForm={setShowForm}
        editing={editing}
        form={form}
        setForm={setForm}
        allCategories={allCategories}
        isBundleCategory={isBundleCategory}
        bundleItems={bundleItems}
        setBundleItems={setBundleItems}
        bundleItemId={bundleItemId}
        setBundleItemId={setBundleItemId}
        bundleQty={bundleQty}
        setBundleQty={setBundleQty}
        bundleSourceItems={bundleSourceItems}
        addBundleItem={addBundleItem}
        selectedRecipeId={selectedRecipeId}
        setSelectedRecipeId={setSelectedRecipeId}
        scale={scale}
        setScale={setScale}
        ingredientOverrides={ingredientOverrides}
        setIngredientOverrides={setIngredientOverrides}
        showOverrides={showOverrides}
        setShowOverrides={setShowOverrides}
        showCreateRecipe={showCreateRecipe}
        setShowCreateRecipe={setShowCreateRecipe}
        newRecipeName={newRecipeName}
        setNewRecipeName={setNewRecipeName}
        newRecipeIngredients={newRecipeIngredients}
        setNewRecipeIngredients={setNewRecipeIngredients}
        recipeSearch={recipeSearch}
        setRecipeSearch={setRecipeSearch}
        ingredientSearch={ingredientSearch}
        setIngredientSearch={setIngredientSearch}
        overrideIngredientSearch={overrideIngredientSearch}
        setOverrideIngredientSearch={setOverrideIngredientSearch}
        recipes={recipes}
        selectedRecipe={selectedRecipe}
        mergedRecipeIngredients={mergedRecipeIngredients}
        overrideSearchResults={overrideSearchResults}
        inventoryItems={inventoryItems}
        imagePreviewUrl={imagePreviewUrl}
        handleImageChange={handleImageChange}
        cleanupImagePreview={cleanupImagePreview}
        setImageFile={setImageFile}
        setImagePreviewUrl={setImagePreviewUrl}
        save={save}
        saveRecipe={saveRecipe}
        inputClass={inputClass}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        showCategoryForm={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        addCategory={addCategory}
        inputClass={inputClass}
      />

      {/* Menu Items Table + Pagination */}
      <MenuItemsTable
        items={items}
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
        meta={meta}
        openEdit={openEdit}
        deleteItem={deleteItem}
        toggleAvailability={toggleAvailability}
      />
    </div>
  );
}
