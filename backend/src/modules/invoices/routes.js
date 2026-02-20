const express = require("express");
const { z } = require("zod");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");
const validate = require("../../shared/middleware/validate");
const { requireRole } = require("../../shared/middleware/auth");

const router = express.Router();
const invoiceRoleGuard = requireRole(["ops", "admin"]);

router.use((req, res, next) => {
  const isInvoicePath = /^\/opportunities\/[^/]+\/invoice(?:\/|$)/.test(req.path);
  if (!isInvoicePath) return next();
  return invoiceRoleGuard(req, res, next);
});

router.patch(
  "/opportunities/:id/invoice",
  validate(
    z.object({
      xeroInvoiceId: z.string().optional(),
      xeroInvoiceNumber: z.string().optional(),
      xeroStatus: z.string().optional(),
      total: z.number().optional(),
      syncError: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const opportunityId = Number(req.params.id);
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) return res.status(404).json({ error: "Opportunity not found" });

    const invoice = await prisma.xeroInvoiceLink.upsert({
      where: { opportunityId },
      create: {
        opportunityId,
        xeroInvoiceId: req.body.xeroInvoiceId,
        xeroInvoiceNumber: req.body.xeroInvoiceNumber,
        xeroStatus: req.body.xeroStatus,
        total: req.body.total,
        syncError: req.body.syncError,
        lastSyncedOn: new Date(),
      },
      update: {
        xeroInvoiceId: req.body.xeroInvoiceId,
        xeroInvoiceNumber: req.body.xeroInvoiceNumber,
        xeroStatus: req.body.xeroStatus,
        total: req.body.total,
        syncError: req.body.syncError,
        lastSyncedOn: new Date(),
      },
    });

    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        xeroInvoiceId: req.body.xeroInvoiceId,
        xeroInvoiceNumber: req.body.xeroInvoiceNumber,
        xeroInvoiceStatus: req.body.xeroStatus,
      },
    });

    res.json(invoice);
  }),
);

module.exports = router;
