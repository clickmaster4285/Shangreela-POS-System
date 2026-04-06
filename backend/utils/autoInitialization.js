const bcrypt = require("bcryptjs");
const { MenuItem, User, Permission } = require("../models");
const { MENU_ITEMS } = require("./menuSeedData");

function menuDocsForInsert() {
  return MENU_ITEMS.map(({ name, price, category, image, description, available, perishable }) => ({
    name,
    price,
    category,
    image,
    description,
    available: available !== false,
    perishable: Boolean(perishable),
  }));
}

async function seedMenuIfEmpty() {
  const count = await MenuItem.countDocuments();
  if (count > 0 || !MENU_ITEMS.length) return;
  await MenuItem.insertMany(menuDocsForInsert());
}

const ALL_PAGES = [
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

const CASHIER_PAGES = ["terminal", "orders", "tables", "billing", "delivery", "giftcards"];
const CASHIER_ACTIONS = ["print_bill", "apply_discount", "hold_order", "change_table_status"];
const CASHIER_DATA = ["view_all_orders"];

async function initializeRolePermissions() {
  const roles = [
    {
      role: "superadmin",
      pageAccess: ALL_PAGES,
      actionPermissions: MANAGER_ACTIONS,
      dataVisibility: MANAGER_DATA,
    },
    {
      role: "hassaan",
      pageAccess: ALL_PAGES,
      actionPermissions: MANAGER_ACTIONS,
      dataVisibility: MANAGER_DATA,
    },
    {
      role: "fahad",
      pageAccess: ALL_PAGES,
      actionPermissions: MANAGER_ACTIONS,
      dataVisibility: MANAGER_DATA,
    },
    {
      role: "cashier",
      pageAccess: CASHIER_PAGES,
      actionPermissions: CASHIER_ACTIONS,
      dataVisibility: CASHIER_DATA,
    },
  ];

  for (const roleConfig of roles) {
    const permExists = await Permission.findOne({ role: roleConfig.role });
    if (!permExists) {
      await Permission.create(roleConfig);
      console.log(`✓ ${roleConfig.role} permissions initialized`);
    }
  }
}

async function initializeSuperAdminPermission() {
  // This is now handled by initializeRolePermissions
  await initializeRolePermissions();
}

async function initializeSuperAdmin() {
  const superAdminExists = await User.findOne({ role: "superadmin" });
  if (superAdminExists) return;

  const passwordHash = await bcrypt.hash("super123", 10);
  await User.create({
    name: "Super Admin",
    email: "superadmin@shirazre.com",
    passwordHash,
    role: "superadmin",
    avatar: "",
  });

  console.log("✓ Super Admin user initialized (email: superadmin@shirazre.com, password: super123)");
}

async function runAutoInitialization() {
  await seedMenuIfEmpty();
  await initializeSuperAdminPermission();
  await initializeSuperAdmin();
}

module.exports = { runAutoInitialization, seedMenuIfEmpty, initializeSuperAdmin, initializeSuperAdminPermission };
