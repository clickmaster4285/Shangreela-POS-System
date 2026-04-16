const { parsePagination, buildPaginatedResponse } = require("../utils/pagination");
const { InventoryItem, InventoryLog, Supplier, StockTransfer } = require("../models");

// Fixed locations for stock transfers
const LOCATIONS = ["Main Storage", "Kitchen", "Bar", "Front Desk"];

// Fixed categories for stock transfers (Sections)
const TRANSFER_CATEGORIES = [
  "Pakistani Section",
  "BBQ Section",
  "Shinwari Section",
  "Ice Cream Section",
  "Chinese Section",
  "Continental Section",
  "Beverage Section",
  "General",
];

// List all inventory items with filtering
exports.listItems = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.search) where.name = { $regex: String(req.query.search), $options: "i" };
  if (req.query.category && req.query.category !== "All") where.category = String(req.query.category);
  if (req.query.perishableOnly === "true") where.perishable = true;
  const [items, total] = await Promise.all([
    InventoryItem.find(where).populate("supplier", "name").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    InventoryItem.countDocuments(where),
  ]);
  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
};

// Get single item with full history
exports.getItem = async (req, res) => {
  const item = await InventoryItem.findById(req.params.id).populate("supplier", "name").lean();
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json({ ...item, id: String(item._id) });
};

// Create new inventory item
exports.createItem = async (req, res) => {
  const row = await InventoryItem.create(req.body || {});
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
};

// Update inventory item
exports.updateItem = async (req, res) => {
  const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json({ ...item, id: String(item._id) });
};

// Delete inventory item (soft delete)
exports.deleteItem = async (req, res) => {
  const item = await InventoryItem.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).lean();
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json({ ok: true });
};

// Restock item - adds quantity and records price in history
exports.restockItem = async (req, res) => {
  const { quantity, costPerUnit, supplier, note } = req.body || {};
  const item = await InventoryItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });

  const qty = Number(quantity || 0);
  const cost = Number(costPerUnit || 0);
  const totalPrice = qty * cost;

  // Update item quantity and cost
  item.quantity += qty;
  item.costPerUnit = cost > 0 ? cost : item.costPerUnit;
  item.lastRestocked = new Date();
  if (supplier) item.supplier = supplier;

  // Add to restock history
  item.restockHistory.push({
    quantity: qty,
    costPerUnit: cost,
    totalPrice,
    supplier: supplier || item.supplier,
    note: note || "",
  });

  await item.save();

  // Log the action
  await InventoryLog.create({
    itemId: String(item._id),
    itemName: item.name,
    action: "restocked",
    quantity: qty,
    price: cost,
    note: `Restocked @ ${cost}/unit. Total: ${totalPrice}`,
    timestamp: new Date().toISOString(),
    userId: String(req.user._id),
  });

  res.json({ ok: true, item });
};

// Adjust item quantity (use/waste)
exports.adjustItem = async (req, res) => {
  const { action, quantity, note } = req.body || {};
  const item = await InventoryItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });

  const qty = Math.max(0, Number(quantity || 0));
  if (action === "add") {
    item.quantity += qty;
    item.lastRestocked = new Date();
  } else {
    item.quantity = Math.max(0, item.quantity - qty);
  }
  await item.save();

  await InventoryLog.create({
    itemId: String(item._id),
    itemName: item.name,
    action: action === "add" ? "restocked" : action === "waste" ? "wasted" : "used",
    quantity: qty,
    note: note || "",
    timestamp: new Date().toISOString(),
    userId: String(req.user._id),
  });

  res.json({ ok: true });
};

// Create stock transfer - transfer multiple items to a location
exports.createTransfer = async (req, res) => {
  const { fromLocation, toLocation, transferCategory, items, note } = req.body || {};

  if (!fromLocation || !toLocation || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Invalid transfer data. fromLocation, toLocation, and items array are required." });
  }

  if (fromLocation === toLocation) {
    return res.status(400).json({ message: "Source and destination locations must be different." });
  }

  // Validate all items exist and have sufficient quantity
  const itemIds = items.map((item) => item.itemId);
  const inventoryItems = await InventoryItem.find({ _id: { $in: itemIds } }).lean();

  if (inventoryItems.length !== itemIds.length) {
    return res.status(400).json({ message: "One or more items not found." });
  }

  // Check quantity for each item
  for (const transferItem of items) {
    const invItem = inventoryItems.find((i) => String(i._id) === String(transferItem.itemId));
    if (!invItem) {
      return res.status(400).json({ message: `Item not found: ${transferItem.itemId}` });
    }
    if (invItem.quantity < transferItem.quantity) {
      return res.status(400).json({
        message: `Insufficient quantity for ${invItem.name}. Available: ${invItem.quantity}, Requested: ${transferItem.quantity}`,
      });
    }
  }

  // Deduct quantities from source location
  for (const transferItem of items) {
    await InventoryItem.findByIdAndUpdate(transferItem.itemId, {
      $inc: { quantity: -transferItem.quantity },
    });
  }

  // Create the transfer record
  const transfer = await StockTransfer.create({
    fromLocation,
    toLocation,
    transferCategory: transferCategory || "General",
    items: items.map((item) => {
      const invItem = inventoryItems.find((i) => String(i._id) === String(item.itemId));
      return {
        itemId: item.itemId,
        itemName: invItem.name,
        quantity: item.quantity,
        unit: invItem.unit,
        itemCategory: item.itemCategory || invItem.category,
      };
    }),
    note: note || "",
    createdBy: req.user._id,
  });

  // Log each item transfer
  const logs = items.map((item) => {
    const invItem = inventoryItems.find((i) => String(i._id) === String(item.itemId));
    return InventoryLog.create({
      itemId: String(item.itemId),
      itemName: invItem.name,
      action: "transferred",
      quantity: item.quantity,
      note: `Transferred from ${fromLocation} to ${toLocation}${transferCategory ? ` (${transferCategory})` : ""}`,
      timestamp: new Date().toISOString(),
      userId: String(req.user._id),
    });
  });
  await Promise.all(logs);

  res.status(201).json({ ok: true, transfer });
};

// List all stock transfers
exports.listTransfers = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.fromLocation) where.fromLocation = String(req.query.fromLocation);
  if (req.query.toLocation) where.toLocation = String(req.query.toLocation);
  if (req.query.transferCategory) where.transferCategory = String(req.query.transferCategory);
  if (req.query.status) where.status = String(req.query.status);

  const [transfers, total] = await Promise.all([
    StockTransfer.find(where).populate("createdBy", "name").populate("items.itemId", "name category").sort({ transferDate: -1 }).skip(skip).limit(limit).lean(),
    StockTransfer.countDocuments(where),
  ]);

  res.json(buildPaginatedResponse({ items: transfers.map((t) => ({ ...t, id: String(t._id) })), total, page, limit }));
};

// Get single transfer details
exports.getTransfer = async (req, res) => {
  const transfer = await StockTransfer.findById(req.params.id).populate("createdBy", "name").populate("items.itemId", "name category unit").lean();
  if (!transfer) return res.status(404).json({ message: "Transfer not found" });
  res.json({ ...transfer, id: String(transfer._id) });
};

// Get available locations (fixed list)
exports.getLocations = async (_req, res) => {
  res.json({ locations: LOCATIONS });
};

// Get available transfer categories (sections)
exports.getTransferCategories = async (_req, res) => {
  res.json({ categories: TRANSFER_CATEGORIES });
};

// List inventory logs
exports.listLogs = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [items, total] = await Promise.all([
    InventoryLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    InventoryLog.countDocuments({}),
  ]);
  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
};

// List suppliers
exports.listSuppliers = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.search) where.name = { $regex: String(req.query.search), $options: "i" };

  const [rows, total] = await Promise.all([
    Supplier.find(where).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Supplier.countDocuments(where),
  ]);
  
  res.json(buildPaginatedResponse({ items: rows.map((s) => ({ ...s, id: String(s._id) })), total, page, limit }));
};

// Create supplier
exports.createSupplier = async (req, res) => {
  const row = await Supplier.create(req.body || {});
  res.status(201).json({ ...row.toObject(), id: String(row._id) });
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  const row = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!row) return res.status(404).json({ message: "Supplier not found" });
  res.json({ ...row, id: String(row._id) });
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  const row = await Supplier.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ message: "Supplier not found" });
  res.json({ ok: true });
};

// Get item categories (unique list from inventory)
exports.getCategories = async (_req, res) => {
  const categories = await InventoryItem.distinct("category");
  res.json({ categories });
};

// Get low stock items with pagination
exports.getLowStockItems = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {
    $expr: { $lte: ["$quantity", "$minStock"] },
    isActive: true,
  };

  const [items, total] = await Promise.all([
    InventoryItem.find(where).populate("supplier", "name").sort({ quantity: 1 }).skip(skip).limit(limit).lean(),
    InventoryItem.countDocuments(where),
  ]);

  res.json(buildPaginatedResponse({ items: items.map((i) => ({ ...i, id: String(i._id) })), total, page, limit }));
};
