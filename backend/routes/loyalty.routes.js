const express = require("express");
const { authRequired } = require("../middleware/middleware");
const loyaltyController = require("../controllers/loyaltyController");

const router = express.Router();
router.get("/members", authRequired, loyaltyController.listMembers);
router.post("/members", authRequired, loyaltyController.createMember);
router.patch("/members/:id/points", authRequired, loyaltyController.patchPoints);

module.exports = router;
