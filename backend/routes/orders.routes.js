const express = require("express");
const { authRequired, attachPermissions } = require("../middleware/middleware");
const orderController = require("../controllers/orderController");

const router = express.Router();
router.use(authRequired, attachPermissions);

router.get("/", orderController.list);
router.post("/", orderController.create);
router.get("/open-by-table/:tableNumber", orderController.openByTable);
router.patch("/:id/status", orderController.patchStatus);
router.patch("/:id/table", orderController.changeTable);
router.patch("/:id/switch-type", orderController.switchType);
router.patch("/:id/add-items", orderController.addItems);
router.patch("/:id/edit-items", orderController.editItems);
router.patch("/:id/billing-totals", orderController.patchBillingTotals);
router.post("/:id/payment", orderController.payment);
router.post("/:id/cancel", orderController.cancel);
router.delete("/:id", orderController.remove);

module.exports = router;
