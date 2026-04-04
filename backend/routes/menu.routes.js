const express = require("express");
const { authRequired } = require("../middleware/middleware");
const menuController = require("../controllers/menuController");

const router = express.Router();
router.get("/", authRequired, menuController.list);
router.post("/", authRequired, menuController.create);
router.put("/:id", authRequired, menuController.update);
router.delete("/:id", authRequired, menuController.remove);

module.exports = router;
