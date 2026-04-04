const express = require("express");
const { authRequired } = require("../middleware/middleware");
const mobileController = require("../controllers/mobileController");

const router = express.Router();
router.get("/config", authRequired, mobileController.getConfig);
router.post("/pairing-token", authRequired, mobileController.newPairingToken);

module.exports = router;
