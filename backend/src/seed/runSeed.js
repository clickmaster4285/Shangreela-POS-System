const bcrypt = require("bcryptjs");
const { connectDb } = require("../db");
const {
  User,
  Permission,
  MenuItem,
  Order,
  InventoryItem,
  InventoryLog,
  Supplier,
  Employee,
  Attendance,
  LeaveRequest,
  LeaveBalance,
  SalaryRecord,
  Shift,
  Floor,
  Table,
  Delivery,
  PrinterConfig,
  PosTabConfig,
  GiftCard,
  LoyaltyMember,
  FbrConfig,
  TaxConfig,
  MobileConfig,
} = require("../models");
const { ROLES, DEFAULT_PERMISSIONS, DEMO_USERS } = require("./defaults");
const { MENU_ITEMS } = require("./menuData");

async function seedUsersAndPermissions() {
  for (const role of ROLES) {
    await Permission.findOneAndUpdate({ role }, { role, ...DEFAULT_PERMISSIONS[role] }, { upsert: true, new: true });
  }

  for (const demoUser of DEMO_USERS) {
    const existing = await User.findOne({ email: demoUser.email.toLowerCase() });
    if (!existing) {
      const passwordHash = await bcrypt.hash(demoUser.password, 10);
      await User.create({
        name: demoUser.name,
        email: demoUser.email.toLowerCase(),
        role: demoUser.role,
        passwordHash,
      });
    }
  }
}

async function seedMenuAndOrders() {
  if ((await MenuItem.countDocuments()) === 0) {
    const menu = await MenuItem.insertMany(MENU_ITEMS);

    await Order.insertMany([
      {
        code: "ORD-001",
        type: "dine-in",
        status: "preparing",
        table: 2,
        subtotal: 4250,
        tax: 425,
        discount: 0,
        total: 4675,
        notes: "",
        items: [{ quantity: 1, notes: "", menuItem: { id: String(menu[0]._id), name: menu[0].name, price: menu[0].price, category: menu[0].category } }],
      },
      {
        code: "ORD-002",
        type: "takeaway",
        status: "pending",
        subtotal: 1450,
        tax: 145,
        discount: 0,
        total: 1595,
        customerName: "Ahmed",
        notes: "No ice",
        items: [
          { quantity: 1, notes: "", menuItem: { id: String(menu[2]._id), name: menu[2].name, price: menu[2].price, category: menu[2].category } },
          { quantity: 1, notes: "", menuItem: { id: String(menu[3]._id), name: menu[3].name, price: menu[3].price, category: menu[3].category } },
        ],
      },
    ]);
  }
}

async function seedInventory() {
  if ((await InventoryItem.countDocuments()) === 0) {
    const items = await InventoryItem.insertMany([
      { name: "Lamb Meat", category: "Meat", quantity: 50, unit: "kg", minStock: 15, costPerUnit: 1800, perishable: true, supplier: "Meat House", lastRestocked: new Date().toISOString().slice(0, 10) },
      { name: "Chicken (Whole)", category: "Poultry", quantity: 80, unit: "kg", minStock: 20, costPerUnit: 450, perishable: true, supplier: "Al-Noor Poultry", lastRestocked: new Date().toISOString().slice(0, 10) },
    ]);
    await InventoryLog.insertMany([
      { itemId: String(items[0]._id), itemName: items[0].name, action: "restocked", quantity: 50, note: "Seed data", timestamp: new Date().toISOString(), userId: "seed" },
      { itemId: String(items[1]._id), itemName: items[1].name, action: "restocked", quantity: 80, note: "Seed data", timestamp: new Date().toISOString(), userId: "seed" },
    ]);
    await Supplier.insertMany([{ name: "Meat House", phone: "0300-1234567", email: "meat@example.com", address: "Rawalpindi", items: ["Lamb Meat"] }]);
  }
}

async function seedHr() {
  if ((await Employee.countDocuments()) === 0) {
    const emp = await Employee.insertMany([
      { employeeId: "EMP-001", name: "Muhammad Ali", phone: "0300-1111111", email: "ali@shirazre.com", role: "Head Chef", department: "Kitchen", joinDate: "2022-01-15", salary: 80000, status: "active" },
      { employeeId: "EMP-002", name: "Fatima Noor", phone: "0302-3333333", email: "fatima@shirazre.com", role: "Cashier", department: "Front", joinDate: "2023-02-10", salary: 35000, status: "active" },
    ]);
    const today = new Date().toISOString().slice(0, 10);
    await Attendance.insertMany([
      { employeeId: String(emp[0]._id), date: today, checkIn: "08:00", checkOut: "17:00", status: "present", hoursWorked: 9, lateMinutes: 0 },
      { employeeId: String(emp[1]._id), date: today, checkIn: "09:05", checkOut: "18:00", status: "late", hoursWorked: 8.9, lateMinutes: 5 },
    ]);
    await LeaveRequest.create({ employeeId: String(emp[1]._id), type: "casual", startDate: today, endDate: today, reason: "Personal work", status: "pending", appliedOn: today });
    await LeaveBalance.insertMany([
      { employeeId: String(emp[0]._id), sick: 10, casual: 8, annual: 14, emergency: 3 },
      { employeeId: String(emp[1]._id), sick: 8, casual: 6, annual: 10, emergency: 2 },
    ]);
    await SalaryRecord.insertMany([
      { employeeId: String(emp[0]._id), month: today.slice(0, 7), baseSalary: 80000, bonus: 0, deductions: 0, lateFines: 0, netSalary: 80000, status: "pending" },
      { employeeId: String(emp[1]._id), month: today.slice(0, 7), baseSalary: 35000, bonus: 0, deductions: 0, lateFines: 0, netSalary: 35000, status: "pending" },
    ]);
    await Shift.insertMany([
      { label: "Opening", start: "08:00", end: "16:00", supervisorName: "Hassaan shb", staffCount: 6, notes: "Floor + prep" },
      { label: "Evening", start: "16:00", end: "00:00", supervisorName: "Fahad shb", staffCount: 8, notes: "Peak dining" },
    ]);
  }
}

async function seedOpsAndSettings() {
  if ((await Floor.countDocuments()) === 0) {
    await Floor.insertMany([
      { key: "ground", name: "Ground floor" },
      { key: "first", name: "First floor" },
      { key: "outdoor", name: "Outdoor" },
    ]);
  }
  if ((await Table.countDocuments()) === 0) {
    await Table.insertMany([
      { number: 1, name: "Table 1", seats: 2, floorKey: "ground", status: "available" },
      { number: 2, name: "Table 2", seats: 2, floorKey: "ground", status: "occupied", currentOrder: "ORD-001" },
      { number: 3, name: "Table 3", seats: 4, floorKey: "ground", status: "available" },
    ]);
  }
  if ((await Delivery.countDocuments()) === 0) {
    await Delivery.insertMany([
      { orderId: "ORD-001", customerName: "Ahmed Khan", phone: "03001234567", address: "F-7 Islamabad", items: ["Mutton Karahi"], total: 4800, status: "out_for_delivery", assignedRider: "Imran Ali", estimatedTime: "25 min" },
      { orderId: "ORD-002", customerName: "Fatima Noor", phone: "03219876543", address: "Gulberg Lahore", items: ["Chicken Karahi"], total: 3200, status: "pending", assignedRider: "Hassan Raza", estimatedTime: "40 min" },
    ]);
  }
  if ((await PrinterConfig.countDocuments()) === 0) {
    await PrinterConfig.insertMany([
      { slotId: "p1", label: "Receipt printer", role: "Customer receipt & FBR slip", connection: "network", address: "192.168.1.201:9100", enabled: true },
      { slotId: "p2", label: "Kitchen printer", role: "KOT / kitchen tickets", connection: "usb", address: "USB001", enabled: true },
      { slotId: "p3", label: "Bar / cold station", role: "Beverages & desserts", connection: "network", address: "192.168.1.202:9100", enabled: true },
    ]);
  }
  if ((await PosTabConfig.countDocuments()) === 0) {
    await PosTabConfig.insertMany([
      { slotId: "t1", name: "POS tab 1", deviceHint: "Front counter — display A", linkedTerminal: "TERM-01", active: true },
      { slotId: "t2", name: "POS tab 2", deviceHint: "Outdoor kiosk", linkedTerminal: "TERM-02", active: true },
      { slotId: "t3", name: "POS tab 3", deviceHint: "Manager override station", linkedTerminal: "TERM-03", active: true },
    ]);
  }
  if ((await GiftCard.countDocuments()) === 0) {
    await GiftCard.insertMany([
      { code: "GC-5000-AB12", balance: 5000, issued: "2025-12-01", status: "active" },
      { code: "GC-2000-CD34", balance: 0, issued: "2025-11-10", status: "redeemed" },
    ]);
  }
  if ((await LoyaltyMember.countDocuments()) === 0) {
    await LoyaltyMember.insertMany([
      { name: "Ahmed Khan", phone: "03001112233", points: 1240, tier: "Gold" },
      { name: "Sana Malik", phone: "03214445566", points: 420, tier: "Silver" },
    ]);
  }
  if ((await FbrConfig.countDocuments()) === 0) await FbrConfig.create({ ntn: "1234567-8", posId: "SRZ-POS-001", sandbox: true, linked: false });
  if ((await TaxConfig.countDocuments()) === 0) await TaxConfig.create({ salesTaxRate: 16, furtherTaxRate: 4, serviceChargeRate: 10, withholdingLabel: "As per FBR" });
  if ((await MobileConfig.countDocuments()) === 0) {
    await MobileConfig.create({
      pairingToken: "",
      downloadUrl: "",
      features: [
        { icon: "MapPin", title: "Table & outdoor orders", text: "Wait staff and supervisors track floors and delivery handoff." },
        { icon: "CreditCard", title: "Gift & loyalty", text: "Scan cards and apply balances from the handheld flow." },
      ],
    });
  }
}

async function runSeed() {
  await connectDb();
  await seedUsersAndPermissions();
  await seedMenuAndOrders();
  await seedInventory();
  await seedHr();
  await seedOpsAndSettings();
  console.log("Seed complete");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error(err);
  process.exit(1);
});
