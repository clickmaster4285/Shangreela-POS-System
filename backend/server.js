const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const { connectDb } = require("./config/db");
const routes = require("./routes");
const { runAutoInitialization } = require("./utils/autoInitialization");
const { port, frontendOrigin } = require("./config/config");
const app = express();

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

// CORS setup
app.use(cors({ origin: frontendOrigin, credentials: true }));

// ========== ADD CACHE CONTROL MIDDLEWARE HERE ==========
// Disable ETag to prevent 304 responses
app.set('etag', false);

// Cache control middleware for API routes
app.use("/api", (req, res, next) => {
  // Store original send function
  const originalSend = res.send;
  
  // Remove ETag header if present
  res.removeHeader('ETag');
  
  // Set headers to prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // For debugging - log when cache headers are applied
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CACHE DISABLED] ${req.method} ${req.url}`);
  }
  
  next();
});
// ======================================================

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/api", routes);

// Optional: Add version header to help client debugging
app.use("/api", (req, res, next) => {
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Cache-Disabled', 'true');
  next();
});

async function boot() {
  await connectDb();
  await runAutoInitialization();
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
    console.log(`Cache disabled for all /api routes - 304 responses prevented`);
  });
}

boot().catch((err) => {
  console.error(err);
  process.exit(1);
});