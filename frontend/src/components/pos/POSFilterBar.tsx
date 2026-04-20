import { Search, Map, User, Filter, X } from "lucide-react";
import { POSDateRangeFilter } from "./POSDateRangeFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  key: string;
  name: string;
}

interface POSFilterBarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;

  // Floor Filter
  floors?: FilterOption[];
  selectedFloor: string;
  onFloorChange: (floor: string) => void;

  // Cashier Filter
  cashiers?: FilterOption[];
  selectedCashier: string;
  onCashierChange: (cashier: string) => void;

  // Date Range
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;

  // Extra Slots (for specific page filters like status)
  extraFilters?: React.ReactNode;
  
  // My Bills toggle
  showMyBillsOnly?: boolean;
  onMyBillsToggle?: (enabled: boolean) => void;

  hideSearch?: boolean;

  // Layout
  className?: string;
}

export function POSFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  floors = [],
  selectedFloor,
  onFloorChange,
  cashiers = [],
  selectedCashier,
  onCashierChange,
  startDate,
  endDate,
  onDateRangeChange,
  extraFilters,
  showMyBillsOnly,
  onMyBillsToggle,
  hideSearch = false,
  className,
}: POSFilterBarProps) {
  const filtersContent = (
    <>
      {/* Floor Filter */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Floor</label>
        <Select value={selectedFloor} onValueChange={onFloorChange}>
          <SelectTrigger className="w-[140px] h-9 bg-background border-border rounded-xl text-xs font-semibold focus:ring-primary/20">
            <div className="flex items-center gap-2">
              <Map className="w-3.5 h-3.5 text-primary" />
              <SelectValue placeholder="All Floors" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border shadow-xl">
            <SelectItem value="all" className="text-xs font-medium">All Floors</SelectItem>
            {floors.map((f) => (
              <SelectItem key={f.key} value={f.key} className="text-xs font-medium">
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cashier Filter */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Cashier</label>
        <Select value={selectedCashier} onValueChange={onCashierChange}>
          <SelectTrigger className="w-[160px] h-9 bg-background border-border rounded-xl text-xs font-semibold focus:ring-primary/20">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-primary" />
              <SelectValue placeholder="All Cashiers" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border shadow-xl">
            <SelectItem value="all" className="text-xs font-medium">All Cashiers</SelectItem>
            {cashiers.map((c) => (
              <SelectItem key={c.key} value={c.key} className="text-xs font-medium">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* My Bills Toggle */}
      {onMyBillsToggle && (
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
           <button
             onClick={() => onMyBillsToggle(!showMyBillsOnly)}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
               showMyBillsOnly 
                 ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                 : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
             }`}
           >
             <Filter className="w-3.5 h-3.5" />
             Only My Bills
           </button>
        </div>
      )}

      {/* Extra Filters (Status, etc.) */}
      {extraFilters && (
        <div className="flex items-center gap-2 ml-auto">
          {extraFilters}
        </div>
      )}
    </>
  );

  return (
    <div className={`flex flex-col gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm ${className}`}>
      {!hideSearch ? (
        <>
          {/* Top Row: Search and Date Range */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:font-normal"
              />
              {searchQuery && (
                <button 
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <POSDateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onRangeChange={onDateRangeChange}
              className="sm:w-auto"
            />
          </div>

          {/* Bottom Row: Selects and Toggles */}
          <div className="flex flex-wrap items-center gap-3">
             {filtersContent}
          </div>
        </>
      ) : (
        /* Unified Row: Compact Layout when Search is Hidden */
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {filtersContent}
          </div>
          <div className="shrink-0 pt-1 sm:pt-0">
             <POSDateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onRangeChange={onDateRangeChange}
              className="sm:w-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
