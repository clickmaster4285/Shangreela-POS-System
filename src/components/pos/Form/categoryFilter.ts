/** Category labels shown in the POS sidebar (matches design order). */
export const FORM_MENU_CATEGORIES = [
  'All',
  'Shinwari',
  'BBQ',
  'Karahi',
  'Handi',
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

export type FormMenuCategory = (typeof FORM_MENU_CATEGORIES)[number];

/** Maps sidebar label to `MenuItem.category` in mock data (some labels differ). */
export function categoryLabelToDataCategory(label: string): string {
  if (label === 'Regular Item') return 'Regular Items';
  return label;
}
