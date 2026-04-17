const { MenuItem, Table, Floor, User } = require("../models");

const parseInclude = (value) => {
  if (!value) return new Set(["menu", "tables", "floors", "users"]);
  return new Set(
    String(value)
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
  );
};

exports.getInitData = async (req, res) => {
  const include = parseInclude(req.query.include);
  const jobs = [];

  if (include.has("menu")) {
    jobs.push(
      MenuItem.find({})
        .sort({ createdAt: -1 })
        .lean()
        .then((items) => ["menu", items.map((i) => ({ ...i, id: String(i._id) }))])
    );
  }

  if (include.has("tables")) {
    jobs.push(
      Table.find({})
        .sort({ number: 1 })
        .lean()
        .then((rows) => [
          "tables",
          rows.map((t) => ({
            id: String(t._id),
            number: t.number,
            name: t.name,
            seats: t.seats,
            floorKey: t.floorKey,
            status: t.status,
            currentOrder: t.currentOrder || "",
          })),
        ])
    );
  }

  if (include.has("floors")) {
    jobs.push(
      Floor.find({})
        .sort({ createdAt: 1 })
        .lean()
        .then((rows) => ["floors", rows.map((f) => ({ id: String(f._id), key: f.key, name: f.name }))])
    );
  }

  if (include.has("users")) {
    jobs.push(
      User.find({}, { passwordHash: 0 })
        .sort({ createdAt: -1 })
        .lean()
        .then((rows) => [
          "users",
          rows.map((u) => ({
            id: String(u._id),
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar || "",
          })),
        ])
    );
  }

  const entries = await Promise.all(jobs);
  const payload = Object.fromEntries(entries);
  res.json(payload);
};
