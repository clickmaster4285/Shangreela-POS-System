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

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/api", routes);

async function boot() {
  await connectDb();
  await runAutoInitialization();
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

boot().catch((err) => {
  console.error(err);
  process.exit(1);
});
