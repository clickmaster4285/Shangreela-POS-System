const express = require("express");
const { authRequired } = require("../middleware/middleware");
const reportsController = require("../controllers/reportsController");

const router = express.Router();
router.get("/weekly-sales", authRequired, reportsController.weeklySales);
router.get("/top-items", authRequired, reportsController.topItems);
router.get("/outdoor-delivery", authRequired, reportsController.outdoorDelivery);

module.exports = router;
