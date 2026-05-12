import { X } from 'lucide-react';

interface AddCategoryModalProps {
  showCategoryForm: boolean;
  onClose: () => void;
  newCategory: string;
  setNewCategory: (v: string) => void;
  addCategory: () => void;
  inputClass: string;
}

export function AddCategoryModal({
  showCategoryForm,
  onClose,
  newCategory,
  setNewCategory,
  addCategory,
  inputClass,
}: AddCategoryModalProps) {
  if (!showCategoryForm) return null;

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4"
        style={{ boxShadow: 'var(--shadow-elevated)' }}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-serif text-lg font-bold">New Category</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <input
          className={inputClass}
          placeholder="Category name"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={addCategory}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-secondary transition-colors"
          >
            Save Category
          </button>
        </div>
      </div>
    </div>
  );
}
