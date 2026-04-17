const express = require("express");

const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const usersRoutes = require("./users.routes");
const permissionsRoutes = require("./permissions.routes");
const menuRoutes = require("./menu.routes");
const ordersRoutes = require("./orders.routes");
const inventoryRoutes = require("./inventory.routes");
const hrRoutes = require("./hr.routes");
const dashboardRoutes = require("./dashboard.routes");
const floorsRoutes = require("./floors.routes");
const tablesRoutes = require("./tables.routes");
const deliveriesRoutes = require("./deliveries.routes");
const analyticsRoutes = require("./analytics.routes");
const reportsRoutes = require("./reports.routes");
const settingsRoutes = require("./settings.routes");
const giftCardsRoutes = require("./giftCards.routes");
const loyaltyRoutes = require("./loyalty.routes");
const integrationsRoutes = require("./integrations.routes");
const mobileRoutes = require("./mobile.routes");
const expensesRoutes = require("./expenses.routes");
const initDataRoutes = require("./initData.routes");

const router = express.Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/permissions", permissionsRoutes);
router.use("/menu", menuRoutes);
router.use("/orders", ordersRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/hr", hrRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/floors", floorsRoutes);
router.use("/tables", tablesRoutes);
router.use("/deliveries", deliveriesRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/reports", reportsRoutes);
router.use("/settings", settingsRoutes);
router.use("/gift-cards", giftCardsRoutes);
router.use("/loyalty", loyaltyRoutes);
router.use("/integrations", integrationsRoutes);
router.use("/mobile", mobileRoutes);
router.use("/expenses", expensesRoutes);
router.use("/init-data", initDataRoutes);

module.exports = router;
