const express = require("express");
const { authRequired } = require("../middleware/middleware");
const orderController = require("../controllers/orderController");

const router = express.Router();
router.get("/", authRequired, orderController.list);
router.post("/", authRequired, orderController.create);
router.get("/open-by-table/:tableNumber", authRequired, orderController.openByTable);
router.patch("/:id/status", authRequired, orderController.patchStatus);
router.patch("/:id/table", authRequired, orderController.changeTable);
router.patch("/:id/switch-type", authRequired, orderController.switchType);
router.patch("/:id/add-items", authRequired, orderController.addItems);
router.patch("/:id/edit-items", authRequired, orderController.editItems);
router.patch("/:id/billing-totals", authRequired, orderController.patchBillingTotals);
router.post("/:id/payment", authRequired, orderController.payment);
router.post("/:id/cancel", authRequired, orderController.cancel);
router.delete("/:id", authRequired, orderController.remove);

module.exports = router;
