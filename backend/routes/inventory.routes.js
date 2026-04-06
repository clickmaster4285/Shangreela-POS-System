const express = require("express");
const { authRequired } = require("../middleware/middleware");
const inventoryController = require("../controllers/inventoryController");

const router = express.Router();
router.get("/items", authRequired, inventoryController.listItems);
router.post("/items", authRequired, inventoryController.createItem);
router.post("/items/:id/adjust", authRequired, inventoryController.adjustItem);
router.get("/logs", authRequired, inventoryController.listLogs);
router.get("/suppliers", authRequired, inventoryController.listSuppliers);

module.exports = router;
