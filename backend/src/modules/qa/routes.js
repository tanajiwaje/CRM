const express = require("express");
const { z } = require("zod");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");
const validate = require("../../shared/middleware/validate");
const { requireRole } = require("../../shared/middleware/auth");

const router = express.Router();
const qaRoleGuard = requireRole(["ops", "engineer", "admin"]);

router.use((req, res, next) => {
  const isQaPath = req.path.startsWith("/qa") || /^\/workorders\/[^/]+\/qa(?:\/|$)/.test(req.path);
  if (!isQaPath) return next();
  return qaRoleGuard(req, res, next);
});

router.post(
  "/qa/checklists",
  validate(
    z.object({
      name: z.string().min(1),
      productOfferingId: z.number().int().optional(),
      workOrderTypeId: z.number().int().optional(),
      items: z
        .array(
          z.object({
            itemText: z.string().min(1),
            mandatory: z.boolean().default(true),
            sortOrder: z.number().int().default(0),
          }),
        )
        .min(1),
    }),
  ),
  asyncHandler(async (req, res) => {
    const { items, ...checklistData } = req.body;
    const checklist = await prisma.qAChecklist.create({
      data: {
        ...checklistData,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });
    res.status(201).json(checklist);
  }),
);

router.post(
  "/workorders/:id/qa/generate",
  asyncHandler(async (req, res) => {
    const workOrderId = Number(req.params.id);
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { opportunity: true },
    });
    if (!workOrder) return res.status(404).json({ error: "Work order not found" });

    const checklist = await prisma.qAChecklist.findFirst({
      where: {
        isActive: true,
        OR: [{ workOrderTypeId: null }, { workOrderTypeId: workOrder.workOrderTypeId }],
        AND: [
          {
            OR: [
              { productOfferingId: null },
              { productOfferingId: workOrder.opportunity.productOfferingId },
            ],
          },
        ],
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    if (!checklist) return res.status(404).json({ error: "No QA checklist found" });

    const results = [];
    for (const item of checklist.items) {
      const existing = await prisma.qAResult.findFirst({
        where: { workOrderId, checklistItemId: item.id },
      });
      if (existing) {
        results.push(existing);
        continue;
      }
      const created = await prisma.qAResult.create({
        data: {
          opportunityId: workOrder.opportunityId,
          workOrderId,
          checklistItemId: item.id,
          result: "N/A",
        },
      });
      results.push(created);
    }

    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { qaGateStatus: results.length > 0 ? "Pending" : "Not Required" },
    });

    res.status(201).json(results);
  }),
);

router.patch(
  "/qa/results/:id",
  validate(
    z.object({
      result: z.enum(["Pass", "Fail", "N/A"]),
      notes: z.string().optional(),
      checkedBy: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const updated = await prisma.qAResult.update({
      where: { id },
      data: {
        result: req.body.result,
        notes: req.body.notes,
        checkedBy: req.body.checkedBy,
        checkedOn: new Date(),
      },
    });

    if (updated.workOrderId) {
      const remaining = await prisma.qAResult.count({
        where: {
          workOrderId: updated.workOrderId,
          result: "N/A",
        },
      });
      const hasFail = await prisma.qAResult.count({
        where: {
          workOrderId: updated.workOrderId,
          result: "Fail",
        },
      });
      await prisma.workOrder.update({
        where: { id: updated.workOrderId },
        data: { qaGateStatus: remaining === 0 && hasFail === 0 ? "Complete" : "Pending" },
      });
    }

    res.json(updated);
  }),
);

router.get(
  "/workorders/:id/qa",
  asyncHandler(async (req, res) => {
    const workOrderId = Number(req.params.id);
    const results = await prisma.qAResult.findMany({
      where: { workOrderId },
      include: { checklistItem: true },
      orderBy: { id: "asc" },
    });
    res.json(results);
  }),
);

module.exports = router;
