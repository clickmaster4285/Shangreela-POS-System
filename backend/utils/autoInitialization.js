const bcrypt = require("bcryptjs");
const { MenuItem, User, Permission } = require("../models");
const { MENU_ITEMS } = require("./menuSeedData");

function menuDocsForInsert() {
  return MENU_ITEMS.map(({ name, price, category, image, description, available, perishable, kitchenRequired }) => ({
    name,
    price,
    category,
    image,
    description,
    available: available !== false,
    perishable: Boolean(perishable),
    kitchenRequired: kitchenRequired !== false,
  }));
}

async function seedMenuIfEmpty() {
  if (!MENU_ITEMS.length) return;
  const existing = await MenuItem.find({}, { name: 1 }).lean();
  const existingNames = new Set(existing.map((x) => String(x.name || "").trim()));
  const toInsert = menuDocsForInsert().filter((item) => !existingNames.has(String(item.name || "").trim()));
  if (!toInsert.length) return;
  await MenuItem.insertMany(toInsert);
  console.log(`✓ Added ${toInsert.length} new menu item(s) from seed data`);
}

const ALL_PAGES = [
  "dashboard",
  "terminal",
  "orders",
  "tables",
  "kitchen",
  "billing",
  "menu",
  "recipes",
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
    {
      role: "store_manager",
      pageAccess: ["dashboard", "terminal", "orders", "tables", "kitchen", "billing", "inventory", "reports", "expenses", "delivery", "outdoordelivery"],
      actionPermissions: ["print_bill", "apply_discount", "hold_order", "change_table_status", "edit_menu"],
      dataVisibility: ["view_all_orders", "view_reports", "view_staff"],
    },
  ];

  for (const roleConfig of roles) {
    const permExists = await Permission.findOne({ role: roleConfig.role });
    if (!permExists) {
      await Permission.create(roleConfig);
      console.log(`✓ ${roleConfig.role} permissions initialized`);
    } else {
      let updated = false;

      const existingPages = permExists.pageAccess || [];
      const existingActions = permExists.actionPermissions || [];
      const existingData = permExists.dataVisibility || [];

      const missingPages = roleConfig.pageAccess.filter(p => !existingPages.includes(p));
      const missingActions = roleConfig.actionPermissions.filter(p => !existingActions.includes(p));
      const missingData = roleConfig.dataVisibility.filter(p => !existingData.includes(p));

      if (missingPages.length > 0) {
        permExists.pageAccess = [...existingPages, ...missingPages];
        updated = true;
      }
      if (missingActions.length > 0) {
        permExists.actionPermissions = [...existingActions, ...missingActions];
        updated = true;
      }
      if (missingData.length > 0) {
        permExists.dataVisibility = [...existingData, ...missingData];
        updated = true;
      }

      if (updated) {
        await permExists.save();
        console.log(`✓ ${roleConfig.role} permissions updated with new modules`);
      }
    }
  }
}

async function initializeSuperAdminPermission() {
  // This is now handled by initializeRolePermissions
  await initializeRolePermissions();
}

async function initializeUsers() {
  const users = [
    {
      role: "superadmin",
      name: "Super Admin",
      email: "superadmin@shirazre.com",
      password: "super123",
      avatar: "",
    },
    {
      role: "hassaan",
      name: "Hassaan",
      email: "hassaan@shirazre.com",
      password: "hassaan123",
      avatar: "",
    },
    {
      role: "fahad",
      name: "Fahad",
      email: "fahad@shirazre.com",
      password: "fahad123",
      avatar: "",
    },
    {
      role: "cashier",
      name: "Cashier",
      email: "cashier@shirazre.com",
      password: "cashier123",
      avatar: "",
    },
  ];

  for (const userConfig of users) {
    const existingUser = await User.findOne({ email: userConfig.email });
    if (existingUser) continue;

    const passwordHash = await bcrypt.hash(userConfig.password, 10);
    await User.create({
      name: userConfig.name,
      email: userConfig.email,
      passwordHash,
      role: userConfig.role,
      avatar: userConfig.avatar,
    });

    console.log(`✓ ${userConfig.role} user initialized (email: ${userConfig.email}, password: ${userConfig.password})`);
  }
}

async function runAutoInitialization() {
  await seedMenuIfEmpty();
  await initializeSuperAdminPermission();
  await initializeUsers();
}

module.exports = { runAutoInitialization, seedMenuIfEmpty, initializeUsers, initializeSuperAdminPermission };
