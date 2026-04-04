const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, unique: true },
    pageAccess: [String],
    actionPermissions: [String],
    dataVisibility: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Permission", permissionSchema);
