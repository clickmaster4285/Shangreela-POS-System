const express = require("express");
const { authRequired } = require("../middleware/middleware");
const floorController = require("../controllers/floorController");

const router = express.Router();
router.get("/", authRequired, floorController.list);
router.post("/", authRequired, floorController.create);
router.put("/:id", authRequired, floorController.update);
router.delete("/:id", authRequired, floorController.remove);

module.exports = router;
