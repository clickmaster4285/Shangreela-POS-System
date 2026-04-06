const { Schema, model } = require('mongoose');

const MenuCategorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = model('MenuCategory', MenuCategorySchema);
