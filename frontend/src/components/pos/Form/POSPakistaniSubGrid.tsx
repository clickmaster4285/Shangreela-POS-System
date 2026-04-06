import { FolderOpen } from 'lucide-react';
import { PAKISTANI_SUBFOLDERS, type PakistaniSubfolder } from './categoryFilter';

type Props = {
  itemCount: (categoryLabel: string) => number;
  onOpenSubfolder: (sub: PakistaniSubfolder) => void;
};

/**
 * Second level inside **Pakistani**: Karahi and Handi folders with item counts.
 */
export function POSPakistaniSubGrid({ itemCount, onOpenSubfolder }: Props) {
  const sortedSubfolders = [...PAKISTANI_SUBFOLDERS].sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-col h-full min-h-0">
      <p className="text-sm text-muted-foreground mb-3 shrink-0">Open Karahi or Handi</p>
      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 max-w-xl">
          {sortedSubfolders.map(sub => {
            const count = itemCount(sub);
            return (
              <button
                key={sub}
                type="button"
                onClick={() => onOpenSubfolder(sub)}
                className="group flex flex-col items-stretch text-left rounded-2xl border-2 border-border bg-card p-4 min-h-[120px] sm:min-h-[132px] transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-serif text-base sm:text-lg font-bold text-primary leading-tight line-clamp-2">{sub}</span>
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
