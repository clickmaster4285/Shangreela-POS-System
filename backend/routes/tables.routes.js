const express = require("express");
const { authRequired } = require("../middleware/middleware");
const tableController = require("../controllers/tableController");

const router = express.Router();
router.get("/", authRequired, tableController.list);
router.post("/", authRequired, tableController.create);
router.post("/bulk", authRequired, tableController.createBulk);
router.put("/:id", authRequired, tableController.update);
router.delete("/bulk", authRequired, tableController.removeBulk);
router.delete("/:id", authRequired, tableController.remove);

module.exports = router;
