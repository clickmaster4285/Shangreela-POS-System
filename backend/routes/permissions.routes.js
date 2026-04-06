const express = require("express");
const { authRequired } = require("../middleware/middleware");
const permissionController = require("../controllers/permissionController");

const router = express.Router();
router.get("/", authRequired, permissionController.getAll);
router.put("/", authRequired, permissionController.putAll);

module.exports = router;
