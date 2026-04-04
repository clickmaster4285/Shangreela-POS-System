const mongoose = require("mongoose");

const rolePermissionsSchema = new mongoose.Schema(
  {
    pageAccess: [String],
    actionPermissions: [String],
    dataVisibility: [String],
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, index: true },
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

const permissionSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, unique: true },
    pageAccess: [String],
    actionPermissions: [String],
    dataVisibility: [String],
  },
  { timestamps: true }
);

const menuItemSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    category: String,
    description: String,
    image: String,
    available: { type: Boolean, default: true },
    perishable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ["dine-in", "takeaway", "delivery"], required: true },
    status: { type: String, enum: ["pending", "preparing", "ready", "completed"], required: true },
    table: Number,
    customerName: String,
    orderTaker: String,
    notes: String,
    subtotal: Number,
    tax: Number,
    discount: Number,
    total: Number,
    items: [
      {
        quantity: Number,
        notes: String,
        requestId: String,
        requestAt: Date,
        menuItem: {
          id: String,
          name: String,
          price: Number,
          category: String,
        },
      },
    ],
  },
  { timestamps: true }
);

const inventoryItemSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    quantity: Number,
    unit: String,
    minStock: Number,
    costPerUnit: Number,
    perishable: Boolean,
    expiryDate: String,
    supplier: String,
    lastRestocked: String,
  },
  { timestamps: true }
);

const inventoryLogSchema = new mongoose.Schema(
  {
    itemId: String,
    itemName: String,
    action: String,
    quantity: Number,
    note: String,
    timestamp: String,
    userId: String,
  },
  { timestamps: true }
);

const supplierSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
    address: String,
    items: [String],
  },
  { timestamps: true }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: String,
    name: String,
    phone: String,
    email: String,
    role: String,
    department: String,
    joinDate: String,
    salary: Number,
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: String,
    date: String,
    checkIn: String,
    checkOut: String,
    status: String,
    hoursWorked: Number,
    lateMinutes: Number,
  },
  { timestamps: true }
);

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: String,
    type: String,
    startDate: String,
    endDate: String,
    reason: String,
    status: String,
    appliedOn: String,
  },
  { timestamps: true }
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: String,
    sick: Number,
    casual: Number,
    annual: Number,
    emergency: Number,
  },
  { timestamps: true }
);

const salaryRecordSchema = new mongoose.Schema(
  {
    employeeId: String,
    month: String,
    baseSalary: Number,
    bonus: Number,
    deductions: Number,
    lateFines: Number,
    netSalary: Number,
    status: String,
    paidOn: String,
  },
  { timestamps: true }
);

const shiftSchema = new mongoose.Schema(
  {
    label: String,
    start: String,
    end: String,
    supervisorName: String,
    staffCount: Number,
    notes: String,
  },
  { timestamps: true }
);

const floorSchema = new mongoose.Schema(
  {
    key: { type: String, index: true },
    name: String,
  },
  { timestamps: true }
);

const tableSchema = new mongoose.Schema(
  {
    number: Number,
    name: String,
    seats: Number,
    floorKey: String,
    status: { type: String, default: "available" },
    currentOrder: String,
  },
  { timestamps: true }
);

const deliverySchema = new mongoose.Schema(
  {
    orderId: String,
    customerName: String,
    phone: String,
    address: String,
    items: [String],
    total: Number,
    status: { type: String, default: "pending" },
    assignedRider: String,
    estimatedTime: String,
  },
  { timestamps: true }
);

const printerConfigSchema = new mongoose.Schema(
  {
    slotId: String,
    label: String,
    role: String,
    connection: String,
    address: String,
    enabled: Boolean,
  },
  { timestamps: true }
);

const posTabConfigSchema = new mongoose.Schema(
  {
    slotId: String,
    name: String,
    deviceHint: String,
    linkedTerminal: String,
    active: Boolean,
  },
  { timestamps: true }
);

const giftCardSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    balance: Number,
    issued: String,
    status: String,
  },
  { timestamps: true }
);

const loyaltyMemberSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    points: Number,
    tier: String,
  },
  { timestamps: true }
);

const fbrConfigSchema = new mongoose.Schema(
  {
    ntn: String,
    posId: String,
    sandbox: Boolean,
    linked: Boolean,
  },
  { timestamps: true }
);

const taxConfigSchema = new mongoose.Schema(
  {
    salesTaxRate: Number,
    furtherTaxRate: Number,
    serviceChargeRate: Number,
    withholdingLabel: String,
  },
  { timestamps: true }
);

const mobileConfigSchema = new mongoose.Schema(
  {
    pairingToken: String,
    downloadUrl: String,
    features: [{ icon: String, title: String, text: String }],
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model("User", userSchema),
  Permission: mongoose.model("Permission", permissionSchema),
  MenuItem: mongoose.model("MenuItem", menuItemSchema),
  Order: mongoose.model("Order", orderSchema),
  InventoryItem: mongoose.model("InventoryItem", inventoryItemSchema),
  InventoryLog: mongoose.model("InventoryLog", inventoryLogSchema),
  Supplier: mongoose.model("Supplier", supplierSchema),
  Employee: mongoose.model("Employee", employeeSchema),
  Attendance: mongoose.model("Attendance", attendanceSchema),
  LeaveRequest: mongoose.model("LeaveRequest", leaveRequestSchema),
  LeaveBalance: mongoose.model("LeaveBalance", leaveBalanceSchema),
  SalaryRecord: mongoose.model("SalaryRecord", salaryRecordSchema),
  Shift: mongoose.model("Shift", shiftSchema),
  Floor: mongoose.model("Floor", floorSchema),
  Table: mongoose.model("Table", tableSchema),
  Delivery: mongoose.model("Delivery", deliverySchema),
  PrinterConfig: mongoose.model("PrinterConfig", printerConfigSchema),
  PosTabConfig: mongoose.model("PosTabConfig", posTabConfigSchema),
  GiftCard: mongoose.model("GiftCard", giftCardSchema),
  LoyaltyMember: mongoose.model("LoyaltyMember", loyaltyMemberSchema),
  FbrConfig: mongoose.model("FbrConfig", fbrConfigSchema),
  TaxConfig: mongoose.model("TaxConfig", taxConfigSchema),
  MobileConfig: mongoose.model("MobileConfig", mobileConfigSchema),
  rolePermissionsSchema,
};
