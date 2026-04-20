import { Search, ChevronDown, Plus, PencilLine } from 'lucide-react';
import { useMemo, useEffect, useCallback } from 'react';
import {
  PAKISTANI_SUBFOLDERS,
  categoryLabelToDataCategory,
  type PakistaniSubfolder
} from '@/components/pos/Form';
import { usePOSStore } from '@/stores/pos/posStore';
import { useDebounce } from '@/hooks/common/use-debounce';
import Fuse from 'fuse.js';

export function POSMenuArea() {
  const store = usePOSStore();
  const {
    menuItems,
    openFolder, setOpenFolder,
    pakistaniSub, setPakistaniSub,
    categorySearch, setCategorySearch,
    folderItemSearch, setFolderItemSearch,
    pakistaniSubSearch, setPakistaniSubSearch,
    addToCart,
    setCustomizingItem,
    resetCustomizeForm
  } = store;

  // Debounced search values
  const debouncedCategorySearch = useDebounce(categorySearch, 300);
  const debouncedFolderItemSearch = useDebounce(folderItemSearch, 300);
  const debouncedPakistaniSubSearch = useDebounce(pakistaniSubSearch, 300);

  // Derived Category Labels
  const categoryLabels = useMemo(() => {
    const uniqueCategories = Array.from(new Set(menuItems.map(i => i.category))).sort((a, b) => a.localeCompare(b));
    const hasPakistani = uniqueCategories.includes('Karahi') || uniqueCategories.includes('Handi');
    const remaining = uniqueCategories.filter(c => c !== 'Karahi' && c !== 'Handi');
    return hasPakistani ? ['All', 'Pakistani', ...remaining] : ['All', ...remaining];
  }, [menuItems]);

  const filteredCategoryLabels = useMemo(() => {
    const q = debouncedCategorySearch.trim();
    if (!q) return categoryLabels;
    const fuse = new Fuse(categoryLabels, { threshold: 0.3 });
    return fuse.search(q).map(r => r.item);
  }, [categoryLabels, debouncedCategorySearch]);

  const filteredPakistaniSubfolders = useMemo((): PakistaniSubfolder[] => {
    const q = debouncedPakistaniSubSearch.trim();
    if (!q) return [...PAKISTANI_SUBFOLDERS];
    const fuse = new Fuse(PAKISTANI_SUBFOLDERS as string[], { threshold: 0.3 });
    return fuse.search(q).map(r => r.item as PakistaniSubfolder);
  }, [debouncedPakistaniSubSearch]);

  const activeCategory = openFolder || 'All';

  const folderItems = useMemo(() => {
    if (!openFolder) return [];
    if (openFolder === 'All') return menuItems;
    if (openFolder === 'Pakistani') {
      if (!pakistaniSub) return [];
      return menuItems.filter(i => i.category === pakistaniSub);
    }
    return menuItems.filter(i => i.category === categoryLabelToDataCategory(openFolder));
  }, [openFolder, pakistaniSub, menuItems]);

  const displayFolderItems = useMemo(() => {
    const q = debouncedFolderItemSearch.trim();
    if (!q) return folderItems;
    const fuse = new Fuse(folderItems, {
      keys: ['name', 'description', 'category'],
      threshold: 0.3,
    });
    return fuse.search(q).map(r => r.item);
  }, [folderItems, debouncedFolderItemSearch]);

  // Sync searches
  useEffect(() => { setFolderItemSearch(''); }, [openFolder, pakistaniSub, setFolderItemSearch]);
  useEffect(() => { setPakistaniSubSearch(''); }, [openFolder, setPakistaniSubSearch]);

  const openTopFolder = useCallback((label: string) => {
    setOpenFolder(label);
    setPakistaniSub(null);
  }, [setOpenFolder, setPakistaniSub]);

  const handleFastAdd = (item: any) => {
    if (item.available !== false) {
      resetCustomizeForm(); // Close any open modals
      addToCart(item);
    }
  };

  const handleExplicitCustomize = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (item.available !== false) {
      setCustomizingItem(item);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 pos-card p-0 overflow-hidden">

      {/* Search Header */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={folderItemSearch}
            onChange={e => setFolderItemSearch(e.target.value)}
            placeholder={`Search in ${activeCategory}...`}
            className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Category Filter Dropdown */}
        <div className="relative w-full sm:w-48 shrink-0">
          <select
            value={activeCategory}
            onChange={(e) => {
              openTopFolder(e.target.value);
              setFolderItemSearch('');
            }}
            className="w-full bg-muted/50 border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer capitalize"
          >
            {filteredCategoryLabels.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {displayFolderItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center h-full text-muted-foreground">
            <Search className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {displayFolderItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleFastAdd(item)}
                className={`flex flex-col text-left bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-200 group relative ${item.available === false ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                disabled={item.available === false}
              >
                {/* Customize Trigger - Small Icon Top Right */}
                {item.available !== false && (
                   <div 
                    onClick={(e) => handleExplicitCustomize(e, item)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/80 dark:bg-black/80 rounded-lg flex items-center justify-center border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white"
                   >
                     <PencilLine className="w-3.5 h-3.5" />
                   </div>
                )}

                {item.image ? (
                  <div className="relative aspect-square overflow-hidden bg-muted/50">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="aspect-square flex items-center justify-center bg-muted/30 p-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase text-center line-clamp-2">{item.name}</span>
                  </div>
                )}
                
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-tight flex-1">{item.name}</h3>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-primary">Rs. {Math.round(item.price).toLocaleString()}</span>
                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
