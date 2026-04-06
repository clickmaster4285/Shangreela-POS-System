const express = require("express");
const { authRequired } = require("../middleware/middleware");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();
router.get("/summary", authRequired, analyticsController.summary);
router.get("/order-type-breakdown", authRequired, analyticsController.orderTypeBreakdown);
router.get("/monthly-trend", authRequired, analyticsController.monthlyTrend);

module.exports = router;
