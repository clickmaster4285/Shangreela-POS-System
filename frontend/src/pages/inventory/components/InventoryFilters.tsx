import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

interface InventoryFiltersProps {
  search: string;
  setSearch: (s: string) => void;
  searchPlaceholder?: string;
  category?: string;
  setCategory?: (c: string) => void;
  categories?: string[];
  location?: string;
  setLocation?: (l: string) => void;
  locations?: string[];
  showCategory?: boolean;
  showLocation?: boolean;
  debounceMs?: number;
}

export function InventoryFilters({
  search,
  setSearch,
  searchPlaceholder = 'Search...',
  category = 'All',
  setCategory,
  categories = [],
  location,
  setLocation,
  locations = [],
  showCategory = true,
  showLocation = false,
  debounceMs = 0,
}: InventoryFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);

    if (!debounceMs) {
      setSearch(value);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setSearch(value);
    }, debounceMs);
  };

  return (
    <div className="flex flex-1 gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-sm outline-none shadow-sm"
        />
      </div>
      {showCategory && categories.length > 0 && (
        <select
          value={category}
          onChange={(e) => setCategory?.(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}
      {showLocation && locations.length > 0 && (
        <select
          value={location || 'All'}
          onChange={(e) => setLocation?.(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none shadow-sm"
        >
          <option value="All">All Locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
