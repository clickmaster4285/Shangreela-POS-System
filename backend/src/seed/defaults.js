const ROLES = ["superadmin", "hassaan", "fahad", "cashier"];

const ALL_PAGE_KEYS = [
  "dashboard",
  "terminal",
  "orders",
  "tables",
  "kitchen",
  "billing",
  "menu",
  "reports",
  "users",
  "inventory",
  "hr",
  "delivery",
  "analytics",
  "printers",
  "postabs",
  "giftcards",
  "fbr",
  "tax",
  "mobileapp",
  "outdoordelivery",
];

const MANAGER_ACTIONS = [
  "apply_discount",
  "void_order",
  "edit_menu",
  "print_bill",
  "hold_order",
  "change_table_status",
];

const MANAGER_DATA = ["view_revenue", "view_all_orders", "view_reports", "view_staff"];

const DEFAULT_PERMISSIONS = {
  superadmin: {
    pageAccess: [...ALL_PAGE_KEYS],
    actionPermissions: [...MANAGER_ACTIONS],
    dataVisibility: [...MANAGER_DATA],
  },
  hassaan: {
    pageAccess: [...ALL_PAGE_KEYS],
    actionPermissions: [...MANAGER_ACTIONS],
    dataVisibility: [...MANAGER_DATA],
  },
  fahad: {
    pageAccess: [...ALL_PAGE_KEYS],
    actionPermissions: [...MANAGER_ACTIONS],
    dataVisibility: [...MANAGER_DATA],
  },
  cashier: {
    pageAccess: ["terminal", "orders", "tables", "billing", "delivery", "giftcards"],
    actionPermissions: ["print_bill", "apply_discount", "hold_order", "change_table_status"],
    dataVisibility: ["view_all_orders"],
  },
};

const DEMO_USERS = [
  { name: "Superadmin", email: "superadmin@shirazre.com", role: "superadmin", password: "super123" },
  { name: "Hassaan shb", email: "hassaan@shirazre.com", role: "hassaan", password: "hassaan123" },
  { name: "Fahad shb", email: "fahad@shirazre.com", role: "fahad", password: "fahad123" },
  { name: "Cashier", email: "cashier@shirazre.com", role: "cashier", password: "cashier123" },
];

module.exports = { ROLES, DEFAULT_PERMISSIONS, DEMO_USERS };
