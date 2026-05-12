const express = require("express");
const { authRequired } = require("../middleware/middleware");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();
router.get("/bundle", authRequired, dashboardController.bundle);
router.get("/summary", authRequired, dashboardController.summary);
router.get("/sales-daily", authRequired, dashboardController.salesDaily);
router.get("/revenue-weekly", authRequired, dashboardController.revenueWeekly);
router.get("/top-items", authRequired, dashboardController.topItems);
router.get("/recent-orders", authRequired, dashboardController.recentOrders);

module.exports = router;
