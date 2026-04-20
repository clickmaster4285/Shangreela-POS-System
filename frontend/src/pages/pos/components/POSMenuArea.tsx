import { Search, ChevronDown } from 'lucide-react';
import {
  POSCategoryFolderGrid,
  POSFolderContent,
  POSPakistaniSubGrid,
  type PakistaniSubfolder
} from '@/components/pos/Form';
import { MenuItem } from '@/data/mockData';

interface POSMenuAreaProps {
  openFolder: string | null;
  pakistaniSub: PakistaniSubfolder | null;
  categorySearch: string;
  setCategorySearch: (v: string) => void;
  folderItemSearch: string;
  setFolderItemSearch: (v: string) => void;
  pakistaniSubSearch: string;
  setPakistaniSubSearch: (v: string) => void;
  filteredCategoryLabels: string[];
  itemCount: (label: string) => number;
  openTopFolder: (label: string) => void;
  handleFolderBack: () => void;
  filteredPakistaniSubfolders: PakistaniSubfolder[];
  setPakistaniSub: (v: PakistaniSubfolder | null) => void;
  displayFolderItems: MenuItem[];
  addToCart: (item: MenuItem) => void;
  posSearchInputClass: string;
}

export function POSMenuArea({
  openFolder, // This will operate as the active category filter
  pakistaniSub,
  categorySearch,
  setCategorySearch,
  folderItemSearch,
  setFolderItemSearch,
  pakistaniSubSearch,
  setPakistaniSubSearch,
  filteredCategoryLabels,
  itemCount,
  openTopFolder, // Use this for clicking pills
  handleFolderBack,
  filteredPakistaniSubfolders,
  setPakistaniSub,
  displayFolderItems,
  addToCart,
  posSearchInputClass,
}: POSMenuAreaProps) {

  // Make sure openFolder resolves to something (default is 'All')
  const activeCategory = openFolder || 'All';

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-background/50 rounded-2xl border border-border overflow-hidden">

      {/* Search Header */}
      <div className="p-3 border-b border-border bg-card/60 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={folderItemSearch}
            onChange={e => setFolderItemSearch(e.target.value)}
            placeholder={`Search items in ${activeCategory}...`}
            className="w-full bg-background border border-border rounded-full pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            className="w-full bg-background border border-border rounded-full pl-4 pr-10 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
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
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <p className="text-muted-foreground font-medium">No items found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {displayFolderItems.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="flex flex-col text-left bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all group focus:outline-none"
                disabled={!item.available}
              >
                {item.image ? (
                  <>
                    <div className="relative overflow-hidden bg-muted/30 aspect-[4/3]">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 pointer-events-none">
                        <span className="inline-flex items-center rounded-md bg-white/20 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm border border-white/20">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 p-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{item.name}</h3>
                        {item.description && <p className="text-[11px] leading-4 text-muted-foreground line-clamp-2 mt-1">{item.description}</p>}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-black text-primary">Rs. {item.price.toLocaleString()}</span>
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <PlusIcon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col flex-1 p-4 aspect-[4/3]">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{item.name}</h3>
                      <div className="mt-1.5"><span className="inline-block px-2 py-0.5 rounded-md bg-muted text-[10px] uppercase font-bold tracking-wide text-muted-foreground border border-border/60">
                        {item.category}
                      </span></div>
                      {(item.category === 'Deals' || item.category === 'Platters') && item.description && (
                        <p className="text-[11px] text-muted-foreground leading-4 line-clamp-3 mt-2">
                          {/* {item.description} */}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">Rs. {item.price.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Custom icon for UI aesthetics
function PlusIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
