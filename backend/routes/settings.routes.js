const express = require("express");
const path = require("path");
const multer = require("multer");
const { authRequired } = require("../middleware/middleware");
const printerController = require("../controllers/printerController");
const posTabController = require("../controllers/posTabController");
const taxController = require("../controllers/taxController");
const paymentController = require("../controllers/paymentController");

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "..", "uploads", "payment"),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || ".png") || ".png";
      cb(null, `qr-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed for QR upload."));
  },
});

const router = express.Router();
router.get("/printers", authRequired, printerController.list);
router.put("/printers", authRequired, printerController.replaceAll);
router.get("/pos-tabs", authRequired, posTabController.list);
router.put("/pos-tabs", authRequired, posTabController.replaceAll);
router.get("/tax", authRequired, taxController.get);
router.put("/tax", authRequired, taxController.put);
router.get("/payment", authRequired, paymentController.get);
router.put("/payment", authRequired, paymentController.put);
router.post("/payment/qr", authRequired, upload.single("qrImage"), paymentController.uploadQr);
router.delete("/payment/qr", authRequired, paymentController.removeQr);

module.exports = router;
