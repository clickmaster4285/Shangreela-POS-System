import { FORM_MENU_CATEGORIES } from './categoryFilter';

type Props = {
  selected: string;
  onSelect: (category: string) => void;
};

/**
 * Vertical category rail for the POS (maroon active / white outlined inactive).
 */
export function POSCategoryMenu({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-[11rem] shrink-0">
      {FORM_MENU_CATEGORIES.map(cat => {
        const isActive = selected === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-primary border-border hover:border-primary/40 hover:bg-muted/30'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
