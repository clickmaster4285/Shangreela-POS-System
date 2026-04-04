const { MenuItem } = require("../models");
const { MENU_ITEMS } = require("./menuSeedData");

function menuDocsForInsert() {
  return MENU_ITEMS.map(({ name, price, category, image, description, available, perishable }) => ({
    name,
    price,
    category,
    image,
    description,
    available: available !== false,
    perishable: Boolean(perishable),
  }));
}

async function seedMenuIfEmpty() {
  const count = await MenuItem.countDocuments();
  if (count > 0 || !MENU_ITEMS.length) return;
  await MenuItem.insertMany(menuDocsForInsert());
}

async function runAutoInitialization() {
  await seedMenuIfEmpty();
}

module.exports = { runAutoInitialization, seedMenuIfEmpty };
