const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const { connectDb } = require("./config/db");
const routes = require("./routes");
const { runAutoInitialization } = require("./utils/autoInitialization");
const { initSocket } = require("./socket");
const { port, frontendOrigins } = require("./config/config");
const app = express();
const server = http.createServer(app);

app.use(compression());

// Uploads setup (your existing code)
const uploadsPath = path.join(__dirname, "uploads");
const uploadSubfolders = ["expenses", "staff", "menu"];
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
uploadSubfolders.forEach((sub) => {
  const folderPath = path.join(uploadsPath, sub);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});
app.use("/uploads", express.static(uploadsPath));

// CORS setup (same origins as Socket.IO — see `socket/index.js`)
app.use(
  cors({
    origin: frontendOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
    credentials: true,
  })
);

// Keep ETag enabled for lightweight conditional GETs.
app.set("etag", "weak");

// Route-level cache policy:
// - GET requests can revalidate/private cache briefly
// - mutating requests stay no-store
app.use("/api", (req, res, next) => {
  const isGet = req.method === "GET";
  if (isGet) {
    res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
    return next();
  }

  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/api", routes);

// Optional: Add version header to help client debugging
app.use("/api", (req, res, next) => {
  res.setHeader("X-API-Version", "1.0.0");
  next();
});

async function boot() {
  await connectDb();
  await runAutoInitialization();
  const io = initSocket(server);
  app.set("io", io);
  server.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
    console.log(`Socket.IO at ws://localhost:${port}/socket.io`);
    console.log("Cache policy enabled: GET revalidation + no-store for writes");
  });
}

boot().catch((err) => {
  console.error(err);
  process.exit(1);
});