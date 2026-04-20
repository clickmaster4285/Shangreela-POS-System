const mongoose = require("mongoose");
const { connectDb } = require("../config/db");
const Order = require("../models/order");
const Expense = require("../models/expense");
const { MenuItem } = require("../models");

async function seedTestData(count = 10) {
  try {
    await connectDb();
    console.log("Connected to database...");

    const menuItems = await MenuItem.find();
    if (menuItems.length === 0) {
      console.log("No menu items found. Please run the server first to initialize basic data.");
      process.exit(0);
    }

    console.log(`Generating ${count} orders and ${count} expenses...`);

    // 1. Generate Batch of Orders
    const sampleOrders = Array.from({ length: count }).map((_, i) => {
      const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
      const subtotal = randomItem.price * (Math.floor(Math.random() * 3) + 1);
      return {
        code: "ORD-" + Math.random().toString(36).substr(2, 5).toUpperCase() + i,
        type: ["dine-in", "takeaway", "delivery"][Math.floor(Math.random() * 3)],
        status: "completed",
        table: Math.floor(Math.random() * 20) + 1,
        customerName: `Batch Customer ${i + 1}`,
        subtotal: subtotal,
        total: subtotal,
        paymentMethod: ["cash", "card", "easypesa"][Math.floor(Math.random() * 3)],
        items: [{ 
          menuItem: { 
            name: randomItem.name, 
            price: randomItem.price,
            category: randomItem.category 
          }, 
          quantity: Math.floor(Math.random() * 3) + 1 
        }],
        createdAt: new Date() // Ensure it shows up for today
      };
    });

    // 2. Generate Batch of Expenses
    const sampleExpenses = Array.from({ length: count }).map((_, i) => {
      const categories = ["supplies", "utilities", "rent", "wages", "maintenance", "other"];
      const amount = Math.floor(Math.random() * 5000) + 200;
      return {
        category: categories[Math.floor(Math.random() * categories.length)],
        description: `Batch Expense ${i + 1}`,
        amount: amount,
        paymentStatus: "paid",
        paymentMethod: ["cash", "bank", "check"][Math.floor(Math.random() * 3)],
        paymentDate: new Date(),
        vendor: `Batch Vendor ${i + 1}`
      };
    });

    // Run insertions in parallel
    await Promise.all([
      Order.insertMany(sampleOrders),
      Expense.insertMany(sampleExpenses)
    ]);

    console.log(`✓ Successfully added ${count} orders and ${count} expenses in parallel batches.`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

// Get count from command line argument or default to 10
const countArg = parseInt(process.argv[2]) || 10;
seedTestData(countArg);
