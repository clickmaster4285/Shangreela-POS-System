const express = require("express");
const { authRequired } = require("../middleware/middleware");
const { getInitData } = require("../controllers/initDataController");

const router = express.Router();

router.get("/", authRequired, getInitData);

module.exports = router;
