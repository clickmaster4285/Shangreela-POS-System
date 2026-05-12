const { Server } = require("socket.io");
const EVENTS = require("./events");

const frontendPrimary =
  process.env.Frontend_URL ||
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:8080";
let frontendOrigins = String(frontendPrimary)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (!frontendOrigins.length) {
  frontendOrigins = ["http://localhost:8080"];
}

let ioInstance = null;

const SCOPE_TO_EVENT = {
  orders: EVENTS.ORDERS_CHANGED,
  tables: EVENTS.TABLES_CHANGED,
  menu: EVENTS.MENU_CHANGED,
  floors: EVENTS.FLOORS_CHANGED,
  deliveries: EVENTS.DELIVERIES_CHANGED,
  dashboard: EVENTS.DASHBOARD_CHANGED,
  inventory: EVENTS.INVENTORY_CHANGED,
  expenses: EVENTS.EXPENSES_CHANGED,
  hr: EVENTS.HR_CHANGED,
  users: EVENTS.USERS_CHANGED,
  permissions: EVENTS.PERMISSIONS_CHANGED,
  giftcards: EVENTS.GIFTCARDS_CHANGED,
  loyalty: EVENTS.LOYALTY_CHANGED,
  settings: EVENTS.SETTINGS_CHANGED,
  fbr: EVENTS.FBR_CHANGED,
  mobile: EVENTS.MOBILE_CHANGED,
};

/**
 * @param {import('http').Server} server
 * @returns {import('socket.io').Server}
 */
function initSocket(server) {
  ioInstance = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: frontendOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  global.io = ioInstance;

  ioInstance.on("connection", (socket) => {
    socket.on("ping", () => {
      socket.emit("pong", {
        message: "Socket connected successfully",
        socketId: socket.id,
        time: Date.now(),
      });
    });

    socket.on("disconnect", () => {});
  });

  return ioInstance;
}

function getIO() {
  return ioInstance || global.io;
}

/**
 * Notify all connected POS clients that a domain changed.
 * @param {string|string[]} scopes e.g. "orders" or ["orders", "tables"]
 */
function emitPosChange(scopes) {
  const io = getIO();
  if (!io) return;
  const list = Array.isArray(scopes) ? scopes : [scopes];
  const seen = new Set();
  const at = Date.now();

  for (const scope of list) {
    const eventName = SCOPE_TO_EVENT[scope];
    if (!eventName || seen.has(eventName)) continue;
    seen.add(eventName);
    io.emit(eventName, { scopes: [scope], at });
  }
}

module.exports = {
  initSocket,
  getIO,
  emitPosChange,
  EVENTS,
};
