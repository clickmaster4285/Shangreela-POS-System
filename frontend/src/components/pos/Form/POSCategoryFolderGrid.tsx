import { FolderOpen } from 'lucide-react';
import { FORM_MENU_CATEGORIES } from './categoryFilter';

type Props = {
  categories?: string[];
  itemCount: (categoryLabel: string) => number;
  onOpenFolder: (label: string) => void;
};

/**
 * Full-screen grid of category “folders”; opening one shows its items elsewhere.
 */
export function POSCategoryFolderGrid({ categories, itemCount, onOpenFolder }: Props) {
  const displayCategories = categories ?? Array.from(FORM_MENU_CATEGORIES);

  return (
    <div className="flex flex-col h-full min-h-0">
      <p className="text-sm text-muted-foreground mb-3 shrink-0">Select a category to open its menu</p>
      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-2">
          {displayCategories.map(cat => {
            const count = itemCount(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onOpenFolder(cat)}
                className="group flex flex-col items-stretch text-left rounded-2xl border-2 border-border bg-card p-4 min-h-[120px] sm:min-h-[132px] transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-serif text-base sm:text-lg font-bold text-primary leading-tight line-clamp-2">{cat}</span>
                  <FolderOpen className="w-5 h-5 text-primary/60 shrink-0 group-hover:text-primary transition-colors" aria-hidden />
                </div>
                <span className="mt-auto text-xs text-muted-foreground">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
