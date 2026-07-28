const mongoose = require("mongoose");
const { MenuItem, InventoryItem, InventoryLog } = require("../models");

const MASS_TO_G = { kg: 1000, g: 1 };
const VOLUME_TO_ML = { liter: 1000, l: 1000, ml: 1 };

const normalizeUnit = (unit) => String(unit || "").trim().toLowerCase();

/** Convert quantity between compatible units (g/kg, ml/liter). Same or unknown units pass through. */
function convertQuantity(qty, fromUnit, toUnit) {
  const amount = Number(qty);
  if (!Number.isFinite(amount) || amount === 0) return 0;

  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (!from || !to || from === to) return amount;

  if (MASS_TO_G[from] != null && MASS_TO_G[to] != null) {
    return (amount * MASS_TO_G[from]) / MASS_TO_G[to];
  }
  if (VOLUME_TO_ML[from] != null && VOLUME_TO_ML[to] != null) {
    return (amount * VOLUME_TO_ML[from]) / VOLUME_TO_ML[to];
  }

  return amount;
}

/** Aggregate sold menu-item quantities from order lines (includes bundle expansion). */
function collectSoldMenuQuantities(orderItems) {
  const soldByMenuId = new Map();

  const add = (menuId, qty) => {
    const id = String(menuId || "").trim();
    const n = Number(qty);
    if (!id || !Number.isFinite(n) || n <= 0) return;
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    soldByMenuId.set(id, (soldByMenuId.get(id) || 0) + n);
  };

  for (const line of orderItems || []) {
    const lineQty = Number(line.quantity || 0);
    if (!Number.isFinite(lineQty) || lineQty <= 0) continue;

    const menuId = line.menuItem?.id;
    add(menuId, lineQty);

    const bundles = Array.isArray(line.menuItem?.bundleItems) ? line.menuItem.bundleItems : [];
    for (const bi of bundles) {
      const biId = typeof bi.menuItem === "object" ? bi.menuItem?._id || bi.menuItem?.id : bi.menuItem;
      add(biId, lineQty * Number(bi.quantity || 1));
    }
  }

  return soldByMenuId;
}

/**
 * Build map of inventoryItemId -> quantity to deduct (in that item's stock unit).
 */
async function buildIngredientUsageMap(orderItems) {
  const soldByMenuId = collectSoldMenuQuantities(orderItems);
  const menuIds = Array.from(soldByMenuId.keys());
  if (menuIds.length === 0) return new Map();

  const menuItems = await MenuItem.find({ _id: { $in: menuIds } })
    .populate({
      path: "recipe",
      populate: { path: "ingredients.inventoryItem", select: "name unit" },
    })
    .populate("ingredientOverrides.inventoryItem", "name unit")
    .lean();

  const usage = new Map();

  for (const item of menuItems) {
    const soldQty = soldByMenuId.get(String(item._id)) || 0;
    if (soldQty <= 0) continue;

    const scale = Number(item.scale || 1);
    let ingredients = [];

    if (item.ingredientOverrides && item.ingredientOverrides.length > 0) {
      ingredients = item.ingredientOverrides;
    } else if (item.recipe && item.recipe.ingredients) {
      ingredients = item.recipe.ingredients;
    }

    for (const ing of ingredients) {
      const inv = ing.inventoryItem;
      if (!inv) continue;

      const invId = String(inv._id || inv);
      const invUnit = inv.unit || ing.unit;
      const recipeUnit = ing.unit || invUnit;
      const rawQty = soldQty * scale * Number(ing.baseQuantity || 0);
      const qtyInStockUnit = convertQuantity(rawQty, recipeUnit, invUnit);

      if (!Number.isFinite(qtyInStockUnit) || qtyInStockUnit <= 0) continue;

      const existing = usage.get(invId) || {
        quantity: 0,
        unit: invUnit || "",
        name: inv.name || "",
      };
      existing.quantity += qtyInStockUnit;
      if (!existing.name && inv.name) existing.name = inv.name;
      if (!existing.unit && invUnit) existing.unit = invUnit;
      usage.set(invId, existing);
    }
  }

  return usage;
}

/**
 * Deduct recipe ingredients for a paid/completed order.
 * Idempotent when caller respects `order.inventoryDeducted`.
 */
async function deductInventoryForOrder(order, userId) {
  const usage = await buildIngredientUsageMap(order.items || []);
  if (usage.size === 0) {
    return { deducted: false, items: 0 };
  }

  const invIds = Array.from(usage.keys()).filter((id) => mongoose.Types.ObjectId.isValid(id));
  const stockItems = await InventoryItem.find({ _id: { $in: invIds } });
  const byId = new Map(stockItems.map((i) => [String(i._id), i]));

  const logs = [];
  const orderCode = order.code || String(order._id);
  const timestamp = new Date().toISOString();

  for (const [invId, used] of usage.entries()) {
    const item = byId.get(invId);
    if (!item) continue;

    const qty = Math.round(used.quantity * 1000) / 1000;
    if (qty <= 0) continue;

    item.quantity = Math.max(0, Number(item.quantity || 0) - qty);
    await item.save();

    logs.push({
      itemId: String(item._id),
      itemName: item.name,
      action: "used",
      quantity: qty,
      unit: item.unit,
      note: `Auto-deducted for order ${orderCode}`,
      timestamp,
      userId: userId ? String(userId) : "",
    });
  }

  if (logs.length > 0) {
    await InventoryLog.insertMany(logs, { ordered: false });
  }

  return { deducted: logs.length > 0, items: logs.length };
}

module.exports = {
  convertQuantity,
  collectSoldMenuQuantities,
  buildIngredientUsageMap,
  deductInventoryForOrder,
};
