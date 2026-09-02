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

  // Extra Filters (e.g., Type dropdown, Status tabs)
  extraFilters?: React.ReactNode;
  
  // Bottom Filters (for mobile: e.g., Status tabs on separate row)
  bottomFilters?: React.ReactNode;
  
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
  bottomFilters,
  showMyBillsOnly,
  onMyBillsToggle,
  hideSearch = false,
  className,
}: POSFilterBarProps) {
  // Desktop: All filters in one flex-wrap row
  // Mobile: Separate rows for each section
  const desktopFilters = (
    <div className="hidden sm:flex flex-wrap items-center gap-3">
      {/* Floor */}
      <div className="flex items-center gap-2 shrink-0">
        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap">Floor</label>
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border overflow-x-auto scrollbar-none">
          <button
            onClick={() => onFloorChange('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
              selectedFloor === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            All Floors
          </button>
          {floors.map((f) => (
            <button
              key={f.key}
              onClick={() => onFloorChange(f.key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                selectedFloor === f.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Cashier */}
      <div className="flex items-center gap-2 shrink-0">
        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap">Cashier</label>
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

      {/* My Bills */}
      {onMyBillsToggle && (
        <button
          onClick={() => onMyBillsToggle(!showMyBillsOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
            showMyBillsOnly 
              ? 'bg-primary/10 border-primary text-primary shadow-sm' 
              : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Only My Bills</span>
        </button>
      )}

      {/* Extra Filters (Type) */}
      {extraFilters && (
        <div className="flex items-center gap-2">
          {extraFilters}
        </div>
      )}

      {/* Bottom Filters (Status tabs) - inline on desktop */}
      {bottomFilters && (
        <div className="flex items-center gap-2">
          {bottomFilters}
        </div>
      )}
    </div>
  );

  // Mobile: 3-row layout
  const mobileFilters = (
    <div className="flex flex-col sm:hidden gap-2">
      {/* Row 1: Floor + Cashier */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap">Floor</label>
          <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-xl border border-border overflow-x-auto scrollbar-none">
            <button
              onClick={() => onFloorChange('all')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                selectedFloor === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              All
            </button>
            {floors.map((f) => (
              <button
                key={f.key}
                onClick={() => onFloorChange(f.key)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                  selectedFloor === f.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Select value={selectedCashier} onValueChange={onCashierChange}>
            <SelectTrigger className="w-[100px] h-8 bg-background border-border rounded-xl text-xs font-semibold focus:ring-primary/20">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-primary" />
                <SelectValue placeholder="All" />
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
      </div>

      {/* Row 2: My Bills + Type */}
      <div className="flex flex-wrap items-center gap-2">
        {onMyBillsToggle && (
          <button
            onClick={() => onMyBillsToggle(!showMyBillsOnly)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all border shrink-0 ${
              showMyBillsOnly 
                ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span className="whitespace-nowrap">My Bills</span>
          </button>
        )}
        
        {extraFilters && (
          <div className="flex items-center gap-2">
            {extraFilters}
          </div>
        )}
      </div>

      {/* Row 3: Status tabs */}
      {bottomFilters && (
        <div className="flex items-center gap-2 w-full">
          {bottomFilters}
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col gap-2.5 sm:gap-3 p-3 sm:p-4 bg-card border border-border rounded-2xl shadow-sm ${className}`}>
      {!hideSearch ? (
        <>
          {/* Top Row: Search and Date Range */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:font-normal"
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

          {/* Mobile: 3-row layout */}
          {mobileFilters}

          {/* Desktop: Single row layout */}
          {desktopFilters}
        </>
      ) : (
        /* Unified Row: Compact Layout when Search is Hidden */
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Floor */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap">Floor</label>
              <div className="flex items-center gap-0.5 sm:gap-1 bg-muted/40 p-0.5 sm:p-1 rounded-xl border border-border overflow-x-auto scrollbar-none">
                <button
                  onClick={() => onFloorChange('all')}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                    selectedFloor === 'all'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  All
                </button>
                {floors.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => onFloorChange(f.key)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                      selectedFloor === f.key
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Cashier */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap hidden sm:inline">Cashier</label>
              <Select value={selectedCashier} onValueChange={onCashierChange}>
                <SelectTrigger className="w-[100px] sm:w-[160px] h-8 sm:h-9 bg-background border-border rounded-xl text-xs font-semibold focus:ring-primary/20">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                    <SelectValue placeholder="All" />
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

            {/* My Bills */}
            {onMyBillsToggle && (
              <button
                onClick={() => onMyBillsToggle(!showMyBillsOnly)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all border shrink-0 ${
                  showMyBillsOnly 
                    ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                    : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="whitespace-nowrap">My Bills</span>
              </button>
            )}

            {extraFilters && (
              <div className="flex items-center gap-2">
                {extraFilters}
              </div>
            )}
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
