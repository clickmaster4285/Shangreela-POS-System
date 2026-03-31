/** Category labels shown in the POS sidebar (matches design order). */
export const FORM_MENU_CATEGORIES = [
  'All',
  'Shinwari',
  'BBQ',
  'Pakistani',
  'Chinese',
  'Rice',
  'Noodles',
  'Appetizers',
  'Soups',
  'Sea Food',
  'Steam',
  'Sandwiches',
  'Salads',
  'Regular Item',
  'Tandoor',
  'Deals',
  'Platters',
] as const;

/** Subfolders inside the Pakistani folder (data categories on `MenuItem`). */
export const PAKISTANI_SUBFOLDERS = ['Karahi', 'Handi'] as const;

export type FormMenuCategory = (typeof FORM_MENU_CATEGORIES)[number];

export type PakistaniSubfolder = (typeof PAKISTANI_SUBFOLDERS)[number];

/** Maps sidebar label to `MenuItem.category` in mock data (some labels differ). */
export function categoryLabelToDataCategory(label: string): string {
  if (label === 'Regular Item') return 'Regular Items';
  return label;
}
