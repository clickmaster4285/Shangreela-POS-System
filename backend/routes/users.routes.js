const express = require("express");
const { authRequired } = require("../middleware/middleware");
const userController = require("../controllers/userController");

const router = express.Router();
router.get("/", authRequired, userController.list);
router.post("/", authRequired, userController.create);
router.delete("/:id", authRequired, userController.remove);

module.exports = router;
