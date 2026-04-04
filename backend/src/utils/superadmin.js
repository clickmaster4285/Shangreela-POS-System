const bcrypt = require("bcryptjs");
const { User } = require("../models");
const {
  superadminName,
  superadminEmail,
  superadminPassword,
  superadminRole,
} = require("../config");

async function initializeSuperAdmin() {
  const email = String(superadminEmail || "").toLowerCase();
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    console.log(`Superadmin already exists: ${email}`);
    return existingUser;
  }

  const passwordHash = await bcrypt.hash(String(superadminPassword), 10);
  const user = await User.create({
    name: superadminName,
    email,
    role: superadminRole,
    passwordHash,
  });

  console.log(`Initialized superadmin account: ${email}`);
  return user;
}

module.exports = { initializeSuperAdmin };
