const express = require("express");
const { authRequired } = require("../middleware/middleware");
const printerController = require("../controllers/printerController");
const posTabController = require("../controllers/posTabController");
const taxController = require("../controllers/taxController");

const router = express.Router();
router.get("/printers", authRequired, printerController.list);
router.put("/printers", authRequired, printerController.replaceAll);
router.get("/pos-tabs", authRequired, posTabController.list);
router.put("/pos-tabs", authRequired, posTabController.replaceAll);
router.get("/tax", authRequired, taxController.get);
router.put("/tax", authRequired, taxController.put);

module.exports = router;
