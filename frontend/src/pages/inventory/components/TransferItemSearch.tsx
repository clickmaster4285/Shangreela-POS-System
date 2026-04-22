import { useState, useEffect, useMemo, useRef } from 'react';
import { Search } from 'lucide-react';
import { type InventoryItem } from '@/data/inventory/inventoryData';
import Fuse from 'fuse.js';

interface TransferItemSearchProps {
   inventory: InventoryItem[];
   value: string;
   onSelect: (itemId: string) => void;
}

export function TransferItemSearch({ inventory, value, onSelect }: TransferItemSearchProps) {
   const [query, setQuery] = useState('');
   const [open, setOpen] = useState(false);
   const containerRef = useRef<HTMLDivElement>(null);

   const fuse = useMemo(
      () => new Fuse(inventory, { keys: ['name', 'category'], threshold: 0.35, minMatchCharLength: 1 }),
      [inventory]
   );

   const results = useMemo(() => {
      if (!query.trim()) return inventory.slice(0, 30);
      return fuse.search(query).map(r => r.item).slice(0, 30);
   }, [query, fuse, inventory]);

   const selectedItem = inventory.find(i => (i.id || i._id) === value);

   useEffect(() => {
      const handler = (e: MouseEvent) => {
         if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, []);

   return (
      <div ref={containerRef} className="relative flex-1 min-w-0">
         <div
            className="flex items-center gap-1 px-2 py-1.5 bg-transparent border-none text-sm cursor-pointer"
            onClick={() => { setOpen(true); setQuery(''); }}
         >
            {open ? (
               <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search item…"
                  className="w-full bg-background border border-primary/30 rounded-lg px-2 py-1 text-sm outline-none"
                  onClick={e => e.stopPropagation()}
               />
            ) : (
               <span className={selectedItem ? 'text-foreground' : 'text-muted-foreground'}>
                  {selectedItem ? `${selectedItem.name} (${selectedItem.quantity} ${selectedItem.unit})` : 'Select Item'}
               </span>
            )}
         </div>
         {open && (
            <div className="absolute z-50 left-0 top-full mt-1 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
               {!query && (
                  <div className="px-3 py-1.5 border-b border-border">
                     <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                           autoFocus
                           value={query}
                           onChange={e => setQuery(e.target.value)}
                           placeholder="Type to search…"
                           className="w-full pl-7 pr-2 py-1 bg-muted rounded-lg text-xs outline-none"
                        />
                     </div>
                  </div>
               )}
               <div className="max-h-48 overflow-y-auto">
                  {results.length === 0 && (
                     <p className="px-3 py-4 text-xs text-muted-foreground text-center">No items found</p>
                  )}
                  {results.map(item => (
                     <button
                        key={item.id || item._id}
                        type="button"
                        onMouseDown={() => { onSelect(item.id || item._id || ''); setOpen(false); setQuery(''); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between ${(item.id || item._id) === value ? 'bg-primary/5 font-bold' : ''
                           }`}
                     >
                        <span>{item.name} <span className="text-muted-foreground font-normal">· {item.category}</span></span>
                        <span className="text-muted-foreground ml-2 shrink-0">{item.quantity} {item.unit}</span>
                     </button>
                  ))}
               </div>
            </div>
         )}
      </div>
   );
}