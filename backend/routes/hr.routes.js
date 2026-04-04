const express = require("express");
const { authRequired } = require("../middleware/middleware");
const hrController = require("../controllers/hrController");

const router = express.Router();
router.get("/employees", authRequired, hrController.listEmployees);
router.post("/employees", authRequired, hrController.createEmployee);
router.get("/attendance", authRequired, hrController.getAttendanceByDate);
router.get("/leaves", authRequired, hrController.listLeaves);
router.patch("/leaves/:id/status", authRequired, hrController.patchLeaveStatus);
router.get("/leave-balances", authRequired, hrController.listLeaveBalances);
router.get("/salary", authRequired, hrController.listSalary);
router.patch("/salary/:employeeId", authRequired, hrController.patchSalary);
router.patch("/salary/:employeeId/mark-paid", authRequired, hrController.markSalaryPaid);
router.get("/shifts", authRequired, hrController.listShifts);

module.exports = router;
