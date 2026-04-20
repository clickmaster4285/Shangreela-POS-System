require("dotenv").config();

/* ================= IMPORTS ================= */
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

/* ================= APP SETUP ================= */
const app = express();
const server = http.createServer(app);

/* ================= ENV VARIABLES ================= */
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

/* ================= MIDDLEWARE ================= */

// Compression
app.use(compression());

// JSON Parser
app.use(express.json({ limit: "2mb" }));

// Logger
app.use(morgan("dev"));

/* ================= FILE UPLOADS SETUP ================= */
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

// Static access
app.use("/uploads", express.static(uploadsPath));

/* ================= CORS CONFIGURATION ================= */
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);

/* ================= CACHE CONFIGURATION ================= */
app.set("etag", "weak");

app.use("/api", (req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
  } else {
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }
  next();
});

/* ================= API HEADERS ================= */
app.use("/api", (req, res, next) => {
  res.setHeader("X-API-Version", "1.0.0");
  next();
});

/* ================= ROUTES ================= */
app.use("/api", routes);

/* ================= APPLICATION BOOT ================= */
async function boot() {
  try {
    await connectDb();
    console.log("Database connected");

    await runAutoInitialization();
    console.log("Auto initialization completed");

    const io = initSocket(server);
    app.set("io", io);

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Socket.IO running at ws://localhost:${PORT}/socket.io`);
      console.log("Cache policy: GET revalidation, write requests no-store");
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

/* ================= START SERVER ================= */
boot();