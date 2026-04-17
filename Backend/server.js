require("dotenv").config();
const socket = require("./socket");
const express = require("express");
const { createServer } = require("http");
const app = express();
const server = createServer(app);

socket.initializeSocket(server);

const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const client = require("prom-client");

const userRoutes = require("./routes/user.routes");
const riderRoutes = require("./routes/rider.routes");
const mapsRoutes = require("./routes/maps.routes");
const rideRoutes = require("./routes/ride.routes");
const mailRoutes = require("./routes/mail.routes");

const keepServerRunning = require("./services/active.service");
const dbStream = require("./services/logging.service");

require("./config/db");

const PORT = process.env.PORT || 4000;

/* ============================
   PROMETHEUS METRICS
============================ */
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total de peticiones HTTP",
  labelNames: ["method", "route", "status", "instance"]
});

register.registerMetric(httpRequests);

/* ============================
   HEADER PARA IDENTIFICAR INSTANCIA
============================ */
app.use((req, res, next) => {
  res.setHeader("X-Instance", process.env.INSTANCE || "unknown");

  res.on("finish", () => {
    httpRequests.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode,
      instance: process.env.INSTANCE || "unknown"
    });
  });

  next();
});

if (process.env.ENVIRONMENT == "production") {
  app.use(
    morgan(":method :url :status :response-time ms - :res[content-length]", {
      stream: dbStream,
    })
  );
} else {
  app.use(morgan("dev"));
}

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.ENVIRONMENT == "production") {
  keepServerRunning();
}

/* ============================
   ENDPOINT METRICS
============================ */
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/reload", (req, res) => {
  res.json("Server Reloaded");
});

app.use("/user", userRoutes);
app.use("/rider", riderRoutes);
app.use("/map", mapsRoutes);
app.use("/ride", rideRoutes);
app.use("/mail", mailRoutes);

server.listen(PORT, () => {
  console.log("Server is listening on port", PORT);
});
