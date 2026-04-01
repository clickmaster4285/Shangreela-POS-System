const bcrypt = require("bcryptjs");
const { User, Permission } = require("./models");
const { ROLES, DEFAULT_PERMISSIONS, DEMO_USERS } = require("./seed/defaults");

async function seedUsersAndPermissions() {
  for (const role of ROLES) {
    await Permission.findOneAndUpdate({ role }, { role, ...DEFAULT_PERMISSIONS[role] }, { upsert: true, new: true });
  }
  for (const demoUser of DEMO_USERS) {
    const email = demoUser.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (!existing) {
      const passwordHash = await bcrypt.hash(demoUser.password, 10);
      await User.create({
        name: demoUser.name,
        email,
        role: demoUser.role,
        passwordHash,
      });
    }
  }
}

module.exports = { seedUsersAndPermissions };
