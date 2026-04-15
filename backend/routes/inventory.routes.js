const express = require("express");
const { authRequired } = require("../middleware/middleware");
const inventoryController = require("../controllers/inventoryController");

const router = express.Router();

// Inventory Items
router.get("/items", authRequired, inventoryController.listItems);
router.get("/items/low-stock", authRequired, inventoryController.getLowStockItems);
router.get("/items/categories", authRequired, inventoryController.getCategories);
router.get("/items/:id", authRequired, inventoryController.getItem);
router.post("/items", authRequired, inventoryController.createItem);
router.put("/items/:id", authRequired, inventoryController.updateItem);
router.delete("/items/:id", authRequired, inventoryController.deleteItem);
router.post("/items/:id/restock", authRequired, inventoryController.restockItem);
router.post("/items/:id/adjust", authRequired, inventoryController.adjustItem);

// Stock Transfers
router.post("/transfers", authRequired, inventoryController.createTransfer);
router.get("/transfers", authRequired, inventoryController.listTransfers);
router.get("/transfers/:id", authRequired, inventoryController.getTransfer);

// Locations
router.get("/locations", authRequired, inventoryController.getLocations);

// Logs
router.get("/logs", authRequired, inventoryController.listLogs);

// Suppliers
router.get("/suppliers", authRequired, inventoryController.listSuppliers);
router.post("/suppliers", authRequired, inventoryController.createSupplier);
router.put("/suppliers/:id", authRequired, inventoryController.updateSupplier);
router.delete("/suppliers/:id", authRequired, inventoryController.deleteSupplier);

module.exports = router;
