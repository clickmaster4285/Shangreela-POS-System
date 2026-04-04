const express = require("express");
const { authRequired } = require("../middleware/middleware");
const deliveryController = require("../controllers/deliveryController");

const router = express.Router();
router.get("/", authRequired, deliveryController.list);
router.post("/", authRequired, deliveryController.create);
router.patch("/:id/status", authRequired, deliveryController.patchStatus);

module.exports = router;
