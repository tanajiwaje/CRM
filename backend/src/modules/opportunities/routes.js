const express = require("express");
const { z } = require("zod");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");
const validate = require("../../shared/middleware/validate");
const { getOpportunityBlockers } = require("../../shared/utils/gate-checks");
const {
  stageTransitionAllowed,
  getOpportunityProcessStatus,
} = require("../../shared/utils/process-engine");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const opportunities = await prisma.opportunity.findMany({
      include: {
        account: true,
        property: true,
        primaryContact: true,
        workOrders: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(opportunities);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        account: true,
        property: true,
        primaryContact: true,
        quotes: { include: { lines: true } },
        workOrders: true,
        evidenceItems: true,
        timelineNotes: true,
      },
    });
    if (!opportunity) return res.status(404).json({ error: "Opportunity not found" });
    const process = await getOpportunityProcessStatus(id);
    res.json({ ...opportunity, process });
  }),
);

router.get(
  "/:id/process-status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const process = await getOpportunityProcessStatus(id);
    res.json(process);
  }),
);

router.patch(
  "/:id",
  validate(
    z.object({
      opportunityName: z.string().optional(),
      assessmentPathId: z.number().int().optional(),
      requiresSurvey: z.boolean().optional(),
      salesStage: z.string().optional(),
      targetInstallWindowStart: z.string().datetime().optional(),
      targetInstallWindowEnd: z.string().datetime().optional(),
      estimatedValue: z.number().optional(),
      quoteStatus: z.string().optional(),
      deliveryStatus: z.string().optional(),
      evidenceStatus: z.string().optional(),
      qaStatus: z.string().optional(),
      paymentLinkSent: z.boolean().optional(),
      paymentLinkSentOn: z.string().datetime().optional(),
      paymentRequested: z.boolean().optional(),
      paymentRequestedOn: z.string().datetime().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    if (req.body.salesStage) {
      const allowed = stageTransitionAllowed(existing.salesStage || "New", req.body.salesStage);
      if (!allowed) {
        return res.status(409).json({
          error: "Invalid stage transition.",
          blockedReasons: [
            `Cannot move stage from "${existing.salesStage || "New"}" to "${req.body.salesStage}".`,
          ],
        });
      }
    }

    const data = { ...req.body };
    if (data.targetInstallWindowStart) data.targetInstallWindowStart = new Date(data.targetInstallWindowStart);
    if (data.targetInstallWindowEnd) data.targetInstallWindowEnd = new Date(data.targetInstallWindowEnd);
    if (data.paymentLinkSentOn) data.paymentLinkSentOn = new Date(data.paymentLinkSentOn);
    if (data.paymentRequestedOn) data.paymentRequestedOn = new Date(data.paymentRequestedOn);
    const updated = await prisma.opportunity.update({ where: { id }, data });
    res.json(updated);
  }),
);

router.post(
  "/:id/timeline",
  validate(
    z.object({
      note: z.string().min(1),
      createdBy: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const opportunityId = Number(req.params.id);
    const row = await prisma.opportunityTimeline.create({
      data: {
        opportunityId,
        note: req.body.note,
        createdBy: req.body.createdBy,
      },
    });
    res.status(201).json(row);
  }),
);

router.post(
  "/:id/close",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const process = await getOpportunityProcessStatus(id);
    const blockers = process.blockedReasons.length > 0
      ? process.blockedReasons
      : await getOpportunityBlockers(id, false);
    if (blockers.length > 0) {
      return res.status(409).json({ error: "Opportunity close blocked", blockedReasons: blockers });
    }

    const closed = await prisma.opportunity.update({
      where: { id },
      data: {
        salesStage: "Closed",
        actualCloseDate: new Date(),
        closeBlockedReason: null,
      },
    });
    res.json(closed);
  }),
);

module.exports = router;
