import { Search, ChevronDown, Plus, Lightbulb } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import { usePOSStore } from '@/stores/pos/posStore';
import { useDebounce } from '@/hooks/common/use-debounce';
import {
  preprocessItems,
  searchItems,
  highlightFromPositions,
  getSearchSuggestions
} from '@/utils/searchEngine';

export function POSMenuArea() {
  const store = usePOSStore();
  const {
    menuItems,
    openFolder, setOpenFolder,
    pakistaniSub, setPakistaniSub,
    folderItemSearch, setFolderItemSearch,
    addToCart,
    resetCustomizeForm
  } = store;

  const debouncedSearch = useDebounce(folderItemSearch, 300);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Preprocess items once (performance)
  const processedItems = useMemo(() => {
    // Load popularity from localStorage or API
    const popularityMap = new Map();
    // You can populate this from order history
    return preprocessItems(menuItems, popularityMap);
  }, [menuItems]);

  // Get current category items
  const getCategoryItems = () => {
    if (!openFolder || openFolder === 'All') return processedItems;
    if (openFolder === 'Pakistani') {
      if (!pakistaniSub) return [];
      return processedItems.filter(p => p.original.category === pakistaniSub);
    }
    return processedItems.filter(p => p.original.category === openFolder);
  };

  const categoryItems = getCategoryItems();

  // Search within category
  const searchResults = useMemo(() => {
    const results = searchItems(
      categoryItems,
      debouncedSearch,
      openFolder === 'All' ? undefined : openFolder
    );
    return results;
  }, [categoryItems, debouncedSearch, openFolder]);

  // Generate suggestions when no results
  useEffect(() => {
    if (debouncedSearch && searchResults.length === 0) {
      const suggestions = getSearchSuggestions(processedItems, debouncedSearch);
      setSuggestions(suggestions);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch, searchResults.length, processedItems]);

  // Categories for filter
  const categories = useMemo(() => {
    const unique = Array.from(new Set(menuItems.map(i => i.category))).sort();
    return ['All', ...unique];
  }, [menuItems]);

  useEffect(() => {
    setFolderItemSearch('');
  }, [openFolder, pakistaniSub, setFolderItemSearch]);

  const handleFastAdd = (item: any) => {
    if (item.available !== false) {
      resetCustomizeForm();
      addToCart(item);
    }
  };

  const currentSearchTerm = debouncedSearch.trim();

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
            placeholder="Search menu... (typos supported)"
            className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="relative w-full sm:w-44">
          <select
            value={openFolder || 'All'}
            onChange={(e) => {
              setOpenFolder(e.target.value);
              setPakistaniSub(null);
            }}
            className="w-full bg-background border border-border rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer capitalize"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No items match "{currentSearchTerm}"
            </p>

            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1 justify-center">
                  <Lightbulb className="w-3 h-3" />
                  Did you mean:
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setFolderItemSearch(suggestion)}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary hover:text-white transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {currentSearchTerm && (
              <div className="mb-3 text-xs text-muted-foreground">
                Found {searchResults.length} result(s)
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {searchResults.map(result => (
                <button
                  key={result.item.id}
                  onClick={() => handleFastAdd(result.item)}
                  className="flex flex-col text-left bg-card rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors group"
                >
                  {result.item.image ? (
                    <div className="aspect-[3/2] overflow-hidden bg-muted/30">
                      <img src={result.item.image} alt={result.item.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-[3/2] flex items-center justify-center bg-muted/30 p-2">
                      <span className="text-base font-medium text-muted-foreground text-center">
                        {result.item.name}
                      </span>
                    </div>
                  )}

                  <div className="p-2">
                    <h3 className="text-base font-medium text-foreground line-clamp-2">
                      {currentSearchTerm
                        ? highlightFromPositions(result.item.name, result.positions)
                        : result.item.name
                      }
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        Rs. {Math.round(result.item.price).toLocaleString()}
                      </span>
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