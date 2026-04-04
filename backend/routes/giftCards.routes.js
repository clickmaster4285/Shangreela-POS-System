const express = require("express");
const { authRequired } = require("../middleware/middleware");
const giftCardController = require("../controllers/giftCardController");

const router = express.Router();
router.get("/", authRequired, giftCardController.list);
router.post("/", authRequired, giftCardController.create);
router.patch("/:id/redeem", authRequired, giftCardController.redeem);

module.exports = router;
