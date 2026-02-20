const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./modules/auth/routes");
const adminRoutes = require("./modules/admin/routes");
const leadsRoutes = require("./modules/leads/routes");
const lookupsRoutes = require("./modules/lookups/routes");
const customersRoutes = require("./modules/customers/routes");
const opportunitiesRoutes = require("./modules/opportunities/routes");
const quotesRoutes = require("./modules/quotes/routes");
const workordersRoutes = require("./modules/workorders/routes");
const evidenceRoutes = require("./modules/evidence/routes");
const qaRoutes = require("./modules/qa/routes");
const paymentsRoutes = require("./modules/payments/routes");
const invoicesRoutes = require("./modules/invoices/routes");
const casesRoutes = require("./modules/cases/routes");
const errorHandler = require("./shared/middleware/error-handler");
const { requireAuth, requireRole } = require("./shared/middleware/auth");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use(requireAuth);
app.use("/lookups", lookupsRoutes);
app.use("/leads", requireRole(["sales", "ops", "admin"]), leadsRoutes);
app.use("/customers", requireRole(["sales", "ops", "admin"]), customersRoutes);
app.use("/opportunities", requireRole(["sales", "ops", "engineer", "admin"]), opportunitiesRoutes);
app.use("/", quotesRoutes);
app.use("/", workordersRoutes);
app.use("/", evidenceRoutes);
app.use("/", qaRoutes);
app.use("/", paymentsRoutes);
app.use("/", invoicesRoutes);
app.use("/cases", requireRole(["ops", "admin"]), casesRoutes);
app.use("/admin", requireRole(["admin"]), adminRoutes);

app.use(errorHandler);

module.exports = app;
