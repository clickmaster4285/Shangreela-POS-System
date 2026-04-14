import { Search } from 'lucide-react';
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
  openFolder,
  pakistaniSub,
  categorySearch,
  setCategorySearch,
  folderItemSearch,
  setFolderItemSearch,
  pakistaniSubSearch,
  setPakistaniSubSearch,
  filteredCategoryLabels,
  itemCount,
  openTopFolder,
  handleFolderBack,
  filteredPakistaniSubfolders,
  setPakistaniSub,
  displayFolderItems,
  addToCart,
  posSearchInputClass,
}: POSMenuAreaProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {openFolder === null ? (
        <div className="flex flex-col h-full min-h-0 gap-3">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={categorySearch}
              onChange={e => setCategorySearch(e.target.value)}
              placeholder="Search categories…"
              className={posSearchInputClass}
              aria-label="Search categories"
            />
          </div>
          <div className="flex-1 min-h-0">
            {filteredCategoryLabels.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No categories match your search.</p>
            ) : (
              <POSCategoryFolderGrid categories={filteredCategoryLabels} itemCount={itemCount} onOpenFolder={openTopFolder} />
            )}
          </div>
        </div>
      ) : openFolder === 'Pakistani' && pakistaniSub === null ? (
        <POSFolderContent title="Pakistani" onBack={handleFolderBack}>
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={pakistaniSubSearch}
              onChange={e => setPakistaniSubSearch(e.target.value)}
              placeholder="Search Karahi / Handi…"
              className={posSearchInputClass}
              aria-label="Search Pakistani subfolders"
            />
          </div>
          {filteredPakistaniSubfolders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No matching folders.</p>
          ) : (
            <POSPakistaniSubGrid
              itemCount={itemCount}
              onOpenSubfolder={setPakistaniSub}
              subfolders={filteredPakistaniSubfolders}
            />
          )}
        </POSFolderContent>
      ) : (
        <POSFolderContent
          title={
            openFolder === 'Pakistani' && pakistaniSub
              ? `Pakistani › ${pakistaniSub}`
              : openFolder
          }
          onBack={handleFolderBack}
        >
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={folderItemSearch}
              onChange={e => setFolderItemSearch(e.target.value)}
              placeholder="Search items in this category…"
              className={posSearchInputClass}
              aria-label="Search items in category"
            />
          </div>
          {displayFolderItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No items match your search.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {displayFolderItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="flex flex-col text-left pos-card p-0 overflow-hidden hover:border-primary/50 transition-all group"
                  disabled={!item.available}
                >
                  {item.image ? (
                    <>
                      <div className="relative overflow-hidden bg-muted/30">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-40 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{item.name}</h3>
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">Rs. {item.price.toLocaleString()}</span>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 p-4">
                      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                      {(item.category === 'Deals' || item.category === 'Platters') && item.description && (
                        <p className="text-xs text-muted-foreground leading-5 line-clamp-3">
                          <span className="font-semibold text-foreground/80">Includes:</span> {item.description}
                        </p>
                      )}
                      <p className="font-serif text-base font-bold text-primary mt-2">Rs. {item.price.toLocaleString()}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </POSFolderContent>
      )}
    </div>
  );
}
