import { ArrowLeft } from 'lucide-react';

type Props = {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
};

/**
 * Full-screen panel for one category: back control + scrollable body (e.g. text-only menu items).
 */
export function POSFolderContent({ title, onBack, children }: Props) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 shrink-0 pb-3 border-b border-border mb-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
          aria-label="Back to categories"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-bold text-foreground truncate">{title}</h2>
          <p className="text-xs text-muted-foreground">Tap an item to add to cart</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">{children}</div>
    </div>
  );
}
