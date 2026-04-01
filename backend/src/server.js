const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectDb } = require("./db");
const routes = require("./routes");
const { port, frontendOrigin } = require("./config");
const { seedUsersAndPermissions } = require("./startup");

const app = express();

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/api", routes);

async function boot() {
  await connectDb();
  await seedUsersAndPermissions();
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

boot().catch((err) => {
  console.error(err);
  process.exit(1);
});
