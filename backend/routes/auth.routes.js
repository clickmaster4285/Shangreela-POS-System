const express = require("express");
const { authRequired, attachPermissions } = require("../middleware/middleware");
const authController = require("../controllers/authController");

const router = express.Router();
router.get("/demo-accounts", authController.getDemoAccounts);
router.post("/login", authController.login);
router.get("/me", authRequired, attachPermissions, authController.me);

module.exports = router;
