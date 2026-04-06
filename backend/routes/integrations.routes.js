const express = require("express");
const { authRequired } = require("../middleware/middleware");
const fbrController = require("../controllers/fbrController");

const router = express.Router();
router.get("/fbr/config", authRequired, fbrController.getConfig);
router.put("/fbr/config", authRequired, fbrController.putConfig);
router.post("/fbr/test-connection", authRequired, fbrController.testConnection);

module.exports = router;
