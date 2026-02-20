const express = require("express");
const { z } = require("zod");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");
const validate = require("../../shared/middleware/validate");
const { requireRole } = require("../../shared/middleware/auth");
const { getOpportunityProcessStatus } = require("../../shared/utils/process-engine");

const router = express.Router();
const quoteRoleGuard = requireRole(["sales", "ops", "admin"]);

router.use((req, res, next) => {
  const isQuotePath =
    req.path.startsWith("/quotes") || /^\/opportunities\/[^/]+\/quotes(?:\/|$)/.test(req.path);
  if (!isQuotePath) return next();
  return quoteRoleGuard(req, res, next);
});

router.post(
  "/opportunities/:id/quotes",
  validate(
    z.object({
      quoteName: z.string().min(1),
      quoteType: z.string().optional(),
      propertyId: z.number().int().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const opportunityId = Number(req.params.id);
    const process = await getOpportunityProcessStatus(opportunityId);
    if (!process.canCreateQuote) {
      return res.status(409).json({
        error: "Quote creation blocked by process rules.",
        blockedReasons: process.blockedReasons,
      });
    }
    const quote = await prisma.quote.create({
      data: {
        quoteName: req.body.quoteName,
        opportunityId,
        propertyId: req.body.propertyId,
        quoteType: req.body.quoteType || "Initial",
      },
    });
    res.status(201).json(quote);
  }),
);

router.post(
  "/quotes/:id/lines",
  validate(
    z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const quoteId = Number(req.params.id);
    const { description, quantity, unitPrice } = req.body;
    const lineTotal = quantity * unitPrice;

    const line = await prisma.quoteLine.create({
      data: { quoteId, description, quantity, unitPrice, lineTotal },
    });

    const agg = await prisma.quoteLine.aggregate({
      where: { quoteId },
      _sum: { lineTotal: true },
    });
    await prisma.quote.update({
      where: { id: quoteId },
      data: { totalAmount: agg._sum.lineTotal || 0 },
    });

    res.status(201).json(line);
  }),
);

router.patch(
  "/quotes/:id",
  validate(
    z.object({
      status: z.enum(["Draft", "Sent", "Accepted", "Declined"]).optional(),
      sentOn: z.string().datetime().optional(),
      quoteName: z.string().optional(),
      quoteType: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = { ...req.body };
    if (data.sentOn) data.sentOn = new Date(data.sentOn);
    const quote = await prisma.quote.update({ where: { id }, data });
    res.json(quote);
  }),
);

router.post(
  "/quotes/:id/accept",
  validate(
    z.object({
      acceptanceMethod: z.string().min(1),
      customerProof: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    if (quote.lines.length === 0) {
      return res.status(409).json({ error: "Cannot accept quote without at least one line." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const accepted = await tx.quote.update({
        where: { id },
        data: {
          status: "Accepted",
          acceptedOn: new Date(),
          acceptanceMethod: req.body.acceptanceMethod,
          customerProof: req.body.customerProof,
        },
      });
      await tx.opportunity.update({
        where: { id: quote.opportunityId },
        data: {
          quoteStatus: "Accepted",
          acceptanceDate: new Date(),
        },
      });
      return accepted;
    });

    res.json(result);
  }),
);

router.get(
  "/quotes/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { lines: true, opportunity: true },
    });
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    res.json(quote);
  }),
);

module.exports = router;
