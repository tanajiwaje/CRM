const express = require("express");
const { z } = require("zod");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");
const validate = require("../../shared/middleware/validate");
const { requireRole } = require("../../shared/middleware/auth");
const { getOpportunityProcessStatus } = require("../../shared/utils/process-engine");

const router = express.Router();
const workOrderRoleGuard = requireRole(["ops", "engineer", "admin"]);

router.use((req, res, next) => {
  const isWorkOrderPath =
    req.path.startsWith("/workorders") ||
    /^\/opportunities\/[^/]+\/workorders(?:\/|$)/.test(req.path);
  if (!isWorkOrderPath) return next();
  return workOrderRoleGuard(req, res, next);
});

router.get(
  "/workorders",
  asyncHandler(async (req, res) => {
    const list = await prisma.workOrder.findMany({
      include: { workOrderType: true, opportunity: true, property: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(list);
  }),
);

router.get(
  "/workorders/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const row = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        workOrderType: true,
        opportunity: true,
        property: true,
        bookings: true,
        evidenceItems: true,
        qaResults: { include: { checklistItem: true } },
      },
    });
    if (!row) return res.status(404).json({ error: "Work order not found" });
    res.json(row);
  }),
);

router.post(
  "/opportunities/:id/workorders",
  validate(
    z.object({
      workOrderTypeId: z.number().int(),
      evidenceRequired: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const opportunityId = Number(req.params.id);
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) return res.status(404).json({ error: "Opportunity not found" });

    const workOrderType = await prisma.workOrderType.findUnique({
      where: { id: req.body.workOrderTypeId },
    });
    if (!workOrderType) {
      return res.status(404).json({ error: "Work order type not found" });
    }

    const process = await getOpportunityProcessStatus(opportunityId);
    if (workOrderType.name === "Survey" && !process.canCreateSurveyWorkOrder) {
      return res.status(409).json({
        error: "Survey work order creation blocked.",
        blockedReasons: process.blockedReasons,
      });
    }
    if (workOrderType.name === "Install" && !process.canCreateInstallWorkOrder) {
      return res.status(409).json({
        error: "Install work order creation blocked.",
        blockedReasons: process.blockedReasons,
      });
    }

    const wo = await prisma.workOrder.create({
      data: {
        opportunityId,
        propertyId: opportunity.propertyId,
        workOrderTypeId: req.body.workOrderTypeId,
        fundingTypeId: opportunity.fundingTypeId,
        evidenceRequired: req.body.evidenceRequired ?? false,
        evidenceGateStatus: req.body.evidenceRequired ? "Pending" : "Not Required",
        qaGateStatus: "Pending",
      },
      include: { workOrderType: true },
    });
    res.status(201).json(wo);
  }),
);

router.patch(
  "/workorders/:id/schedule",
  validate(
    z.object({
      scheduledStart: z.string().datetime(),
      scheduledEnd: z.string().datetime(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const wo = await prisma.workOrder.update({
      where: { id },
      data: {
        scheduledStart: new Date(req.body.scheduledStart),
        scheduledEnd: new Date(req.body.scheduledEnd),
      },
    });
    res.json(wo);
  }),
);

router.patch(
  "/workorders/:id/status",
  validate(
    z.object({
      status: z.string().min(1),
      substatus: z.string().optional(),
      completionBlockedReason: z.string().optional(),
      actualStart: z.string().datetime().optional(),
      actualEnd: z.string().datetime().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = { ...req.body };
    if (data.actualStart) data.actualStart = new Date(data.actualStart);
    if (data.actualEnd) data.actualEnd = new Date(data.actualEnd);
    const wo = await prisma.workOrder.update({ where: { id }, data });
    res.json(wo);
  }),
);

router.get(
  "/opportunities/:id/workorders",
  asyncHandler(async (req, res) => {
    const opportunityId = Number(req.params.id);
    const list = await prisma.workOrder.findMany({
      where: { opportunityId },
      include: { workOrderType: true, bookings: true, evidenceItems: true, qaResults: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(list);
  }),
);

module.exports = router;
