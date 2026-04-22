import { Search, ChevronDown, Plus, PencilLine } from 'lucide-react';
import { useMemo, useEffect } from 'react';
import {
  PAKISTANI_SUBFOLDERS,
  categoryLabelToDataCategory,
  type PakistaniSubfolder
} from '@/components/pos/Form';
import { usePOSStore } from '@/stores/pos/posStore';
import { useDebounce } from '@/hooks/common/use-debounce';

// Check if text contains all search characters in order (ignoring spaces)
const matchesInOrder = (text: string, search: string): boolean => {
  if (!search) return true;

  const textLower = text.toLowerCase();
  const searchLower = search.toLowerCase().replace(/\s/g, ''); // Remove spaces from search
  let searchIndex = 0;

  for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIndex]) {
      searchIndex++;
    }
  }
  return searchIndex === searchLower.length;
};

// Check if text contains all search words (word boundary matching)
const matchesAllWords = (text: string, search: string): boolean => {
  if (!search) return true;

  const textLower = text.toLowerCase();
  const searchWords = search.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  // Each search word must be found in the text (as substring)
  return searchWords.every(word => textLower.includes(word));
};

// Enhanced matching: tries both approaches
const matchesSearch = (text: string, search: string): boolean => {
  if (!search) return true;

  // First try: all words must exist (for "karahi half" -> both "karahi" and "half" must be in name)
  if (matchesAllWords(text, search)) return true;

  // Second try: characters in order (for typos like "karhi" instead of "karahi")
  if (matchesInOrder(text, search)) return true;

  return false;
};

// Highlight matching characters (from the search query)
const highlightMatches = (text: string, search: string): React.ReactNode => {
  if (!search) return text;

  const textLower = text.toLowerCase();
  const searchLower = search.toLowerCase().replace(/\s/g, '');
  const positions: number[] = [];
  let searchIndex = 0;

  for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIndex]) {
      positions.push(i);
      searchIndex++;
    }
  }

  if (positions.length === 0) return text;

  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const pos of positions) {
    if (pos > lastIndex) {
      result.push(text.substring(lastIndex, pos));
    }
    result.push(
      <mark key={pos} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
        {text[pos]}
      </mark>
    );
    lastIndex = pos + 1;
  }

  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
};

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

  const debouncedCategorySearch = useDebounce(categorySearch, 300);
  const debouncedFolderItemSearch = useDebounce(folderItemSearch, 300);
  const debouncedPakistaniSubSearch = useDebounce(pakistaniSubSearch, 300);

  // Categories
  const categoryLabels = useMemo(() => {
    const uniqueCategories = Array.from(new Set(menuItems.map(i => i.category))).sort();
    const hasPakistani = uniqueCategories.includes('Karahi') || uniqueCategories.includes('Handi');
    const remaining = uniqueCategories.filter(c => c !== 'Karahi' && c !== 'Handi');
    return hasPakistani ? ['All', 'Pakistani', ...remaining] : ['All', ...remaining];
  }, [menuItems]);

  const filteredCategoryLabels = useMemo(() => {
    const q = debouncedCategorySearch.trim();
    if (!q) return categoryLabels;
    return categoryLabels.filter(cat => cat.toLowerCase().includes(q.toLowerCase()));
  }, [categoryLabels, debouncedCategorySearch]);

  const filteredPakistaniSubfolders = useMemo((): PakistaniSubfolder[] => {
    const q = debouncedPakistaniSubSearch.trim();
    if (!q) return [...PAKISTANI_SUBFOLDERS];
    return PAKISTANI_SUBFOLDERS.filter(sub =>
      sub.toLowerCase().includes(q.toLowerCase())
    );
  }, [debouncedPakistaniSubSearch]);

  const activeCategory = openFolder || 'All';

  // Get folder items
  const folderItems = useMemo(() => {
    if (!openFolder) return [];
    if (openFolder === 'All') return menuItems;
    if (openFolder === 'Pakistani') {
      if (!pakistaniSub) return [];
      return menuItems.filter(i => i.category === pakistaniSub);
    }
    return menuItems.filter(i => i.category === categoryLabelToDataCategory(openFolder));
  }, [openFolder, pakistaniSub, menuItems]);

  // Filter items based on search
  const displayItems = useMemo(() => {
    const q = debouncedFolderItemSearch.trim();
    if (!q) return folderItems;

    return folderItems.filter(item => matchesSearch(item.name, q));
  }, [folderItems, debouncedFolderItemSearch]);

  const currentSearchTerm = debouncedFolderItemSearch.trim();

  useEffect(() => { setFolderItemSearch(''); }, [openFolder, pakistaniSub, setFolderItemSearch]);
  useEffect(() => { setPakistaniSubSearch(''); }, [openFolder, setPakistaniSubSearch]);

  const openTopFolder = (label: string) => {
    setOpenFolder(label);
    setPakistaniSub(null);
  };

  const handleFastAdd = (item: any) => {
    if (item.available !== false) {
      resetCustomizeForm();
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
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={folderItemSearch}
            onChange={e => setFolderItemSearch(e.target.value)}
            placeholder="Search by name (e.g., 'karahi half' finds 'Chicken Karahi Half')..."
            className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="relative w-full sm:w-44">
          <select
            value={activeCategory}
            onChange={(e) => openTopFolder(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer capitalize"
          >
            {filteredCategoryLabels.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No items match "{currentSearchTerm}"
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Try: "karahi half" or "half karahi" or "chicken karahi"
            </p>
          </div>
        ) : (
          <>
            {currentSearchTerm && (
              <div className="mb-3 text-xs text-muted-foreground">
                Found {displayItems.length} item(s) matching "{currentSearchTerm}"
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleFastAdd(item)}
                  className={`flex flex-col text-left bg-card rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors group relative ${item.available === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={item.available === false}
                >
                  {item.available !== false && (
                    <div ></div>
                  )}

                  {item.image ? (
                    <div className="aspect-square overflow-hidden bg-muted/30">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-muted/30 p-3">
                      <span className="text-base font-medium text-muted-foreground text-center line-clamp-2">
                        {currentSearchTerm ? highlightMatches(item.name, currentSearchTerm) : item.name}
                      </span>
                    </div>
                  )}

                  <div className="p-2">
                    <h3 className="text-base font-medium text-foreground line-clamp-2 leading-tight">
                      {currentSearchTerm ? highlightMatches(item.name, currentSearchTerm) : item.name}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">Rs. {Math.round(item.price).toLocaleString()}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}