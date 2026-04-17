/**
 * Socket.IO event names for the restaurant POS.
 * Keep names stable: frontend listens for the same strings.
 */
module.exports = {
  ORDERS_CHANGED: "pos_orders_changed",
  TABLES_CHANGED: "pos_tables_changed",
  MENU_CHANGED: "pos_menu_changed",
  FLOORS_CHANGED: "pos_floors_changed",
  DELIVERIES_CHANGED: "pos_deliveries_changed",
  DASHBOARD_CHANGED: "pos_dashboard_changed",
  INVENTORY_CHANGED: "pos_inventory_changed",
  EXPENSES_CHANGED: "pos_expenses_changed",
  HR_CHANGED: "pos_hr_changed",
  USERS_CHANGED: "pos_users_changed",
  PERMISSIONS_CHANGED: "pos_permissions_changed",
  GIFTCARDS_CHANGED: "pos_giftcards_changed",
  LOYALTY_CHANGED: "pos_loyalty_changed",
  SETTINGS_CHANGED: "pos_settings_changed",
  FBR_CHANGED: "pos_fbr_changed",
  MOBILE_CHANGED: "pos_mobile_changed",
};
