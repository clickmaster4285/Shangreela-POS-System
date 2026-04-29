import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, type PaginatedResponse } from '@/lib/api/api';
import { BASE_UNITS } from '@/pages/inventory/modals/AddItemModal';

type Recipe = {
  id: string;
  name: string;
  description?: string;
  ingredients: Array<{
    inventoryItem: { _id: string; name: string; unit: string };
    baseQuantity: number;
    unit: string;
  }>;
};

type InventoryItem = { _id: string; name: string; unit: string };

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Edit state
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIngredients, setEditIngredients] = useState<
    Array<{ inventoryItem: string; baseQuantity: string; unit: string }>
  >([]);
  const [ingredientSearch, setIngredientSearch] = useState('');

  const inputClass =
    'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api<PaginatedResponse<Recipe>>('/recipes?limit=200');
      setRecipes(res.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInventoryItems = useCallback(async () => {
    try {
      const res = await api<{ items: Array<{ id: string; name: string; unit: string }>; pagination: any }>(
        '/inventory/items?limit=500'
      );
      setInventoryItems(res.items.map((i: any) => ({ _id: i.id, name: i.name, unit: i.unit })));
    } catch (err) {
      console.error('Failed to load inventory items', err);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
    fetchInventoryItems();
  }, [fetchRecipes, fetchInventoryItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(r => r.name.toLowerCase().includes(q));
  }, [recipes, search]);

  const openEdit = (recipe: Recipe) => {
    setEditing(recipe);
    setEditName(recipe.name);
    setEditDescription(recipe.description || '');
    setEditIngredients(
      recipe.ingredients.map(ing => ({
        inventoryItem: ing.inventoryItem._id,
        baseQuantity: String(ing.baseQuantity),
        unit: ing.unit,
      }))
    );
    setIngredientSearch('');
  };

  const closeEdit = () => {
    setEditing(null);
    setIngredientSearch('');
  };

  const saveEdit = () => {
    if (!editing) return;
    if (!editName.trim()) { toast.error('Enter recipe name'); return; }
    if (editIngredients.length === 0 || editIngredients.some(i => !i.inventoryItem || !i.baseQuantity)) {
      toast.error('All ingredients must have a quantity');
      return;
    }
    const payload = {
      name: editName.trim(),
      description: editDescription,
      ingredients: editIngredients.map(i => ({
        inventoryItem: i.inventoryItem,
        baseQuantity: parseFloat(i.baseQuantity),
        unit: i.unit,
      })),
    };
    api(`/recipes/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      .then(() => {
        toast.success('Recipe updated');
        closeEdit();
        fetchRecipes();
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Failed to update recipe'));
  };

  const ingredientSearchResults = useMemo(() => {
    const q = ingredientSearch.trim().toLowerCase();
    if (!q) return [];
    const usedIds = new Set(editIngredients.map(i => i.inventoryItem));
    return inventoryItems
      .filter(item => !usedIds.has(item._id) && item.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [ingredientSearch, inventoryItems, editIngredients]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Recipes</h1>
          <p className="text-sm text-muted-foreground">View and edit all saved recipes and their ingredients.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes…"
          className={`${inputClass} pl-10`}
        />
      </div>

      {/* Table */}
      <div className="pos-card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-3 px-3 font-medium">#</th>
                <th className="py-3 px-3 font-medium">Recipe Name</th>
                <th className="py-3 px-3 font-medium">Ingredients</th>
                <th className="py-3 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground text-sm">
                    No recipes found.
                  </td>
                </tr>
              ) : (
                filtered.map((recipe, idx) => (
                  <tr key={recipe.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-3 text-muted-foreground">{idx + 1}</td>
                    <td className="py-3 px-3 font-medium text-foreground">{recipe.name}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {recipe.ingredients.slice(0, 4).map((ing, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {ing.inventoryItem.name}
                          </span>
                        ))}
                        {recipe.ingredients.length > 4 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            +{recipe.ingredients.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => openEdit(recipe)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-card rounded-2xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: 'var(--shadow-elevated)' }}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold">Edit Recipe</h3>
              <button onClick={closeEdit}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            {/* Name */}
            <input
              className={inputClass}
              placeholder="Recipe name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />

            {/* Ingredients list */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Ingredients</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {editIngredients.map((ing, i) => {
                  const item = inventoryItems.find(x => x._id === ing.inventoryItem);
                  return (
                    <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2">
                      <span className="flex-1 text-sm font-medium truncate">{item?.name || ing.inventoryItem}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="Qty"
                        value={ing.baseQuantity}
                        onChange={e => {
                          const updated = [...editIngredients];
                          updated[i] = { ...updated[i], baseQuantity: e.target.value };
                          setEditIngredients(updated);
                        }}
                        className={`${inputClass} w-20 text-sm`}
                      />
                      <select
                        value={ing.unit}
                        onChange={e => {
                          const updated = [...editIngredients];
                          updated[i] = { ...updated[i], unit: e.target.value };
                          setEditIngredients(updated);
                        }}
                        className={`${inputClass} w-24 text-xs`}
                      >
                        {BASE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => setEditIngredients(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-destructive hover:text-destructive/80 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {editIngredients.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No ingredients. Search below to add.
                  </p>
                )}
              </div>
            </div>

            {/* Add ingredient search */}
            <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Add ingredient</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search inventory items…"
                  value={ingredientSearch}
                  onChange={e => setIngredientSearch(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
              {ingredientSearch.trim() !== '' && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-background">
                  {ingredientSearchResults.map(item => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => {
                        setEditIngredients(prev => [
                          ...prev,
                          { inventoryItem: item._id, baseQuantity: '1', unit: item.unit },
                        ]);
                        setIngredientSearch('');
                      }}
                      className="flex w-full items-center justify-between border-b border-border/50 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/40"
                    >
                      <span>{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.unit}</span>
                    </button>
                  ))}
                  {ingredientSearchResults.length === 0 && (
                    <p className="px-3 py-3 text-xs text-muted-foreground">No items found.</p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveEdit}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={closeEdit}
                className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
