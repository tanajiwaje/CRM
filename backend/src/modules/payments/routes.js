const express = require("express");
const { z } = require("zod");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");
const validate = require("../../shared/middleware/validate");
const { requireRole } = require("../../shared/middleware/auth");
const { getOpportunityBlockers } = require("../../shared/utils/gate-checks");
const { getOpportunityProcessStatus } = require("../../shared/utils/process-engine");

const router = express.Router();
const paymentRoleGuard = requireRole(["ops", "admin"]);

router.use((req, res, next) => {
  const isPaymentPath =
    req.path.startsWith("/payment-requests") ||
    /^\/opportunities\/[^/]+\/payment-requests(?:\/|$)/.test(req.path);
  if (!isPaymentPath) return next();
  return paymentRoleGuard(req, res, next);
});

router.post(
  "/opportunities/:id/payment-requests",
  validate(
    z.object({
      amountRequested: z.number().positive(),
      paymentLinkUrl: z.string().url().optional(),
      sentBy: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const opportunityId = Number(req.params.id);
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) return res.status(404).json({ error: "Opportunity not found" });

    const process = await getOpportunityProcessStatus(opportunityId);
    if (!process.canRequestPayment) {
      return res.status(409).json({
        error: "Payment request blocked by process rules.",
        blockedReasons: process.blockedReasons,
      });
    }

    const blockers = await getOpportunityBlockers(opportunityId, false);
    if (blockers.length > 0) {
      return res.status(409).json({
        error: "Payment request blocked by delivery/evidence/QA gates.",
        blockedReasons: blockers,
      });
    }

    const request = await prisma.paymentRequest.create({
      data: {
        opportunityId,
        propertyId: opportunity.propertyId,
        amountRequested: req.body.amountRequested,
        paymentLinkUrl: req.body.paymentLinkUrl,
        paymentLinkSentOn: req.body.paymentLinkUrl ? new Date() : null,
        sentBy: req.body.sentBy,
        paymentStatus: req.body.paymentLinkUrl ? "Sent" : "Not Sent",
        notes: req.body.notes,
      },
    });

    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        paymentRequested: true,
        paymentRequestedOn: new Date(),
      },
    });

    res.status(201).json(request);
  }),
);

router.get(
  "/opportunities/:id/payment-requests",
  asyncHandler(async (req, res) => {
    const opportunityId = Number(req.params.id);
    const rows = await prisma.paymentRequest.findMany({
      where: { opportunityId },
      orderBy: { createdAt: "desc" },
    });
    res.json(rows);
  }),
);

router.patch(
  "/payment-requests/:id/status",
  validate(
    z.object({
      paymentStatus: z.enum(["Not Sent", "Sent", "Paid", "Failed"]),
      paidOn: z.string().datetime().optional(),
      notes: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = {
      paymentStatus: req.body.paymentStatus,
      notes: req.body.notes,
      paidOn: req.body.paidOn ? new Date(req.body.paidOn) : undefined,
    };
    const updated = await prisma.paymentRequest.update({ where: { id }, data });
    res.json(updated);
  }),
);

module.exports = router;
