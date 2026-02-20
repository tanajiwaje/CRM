const express = require("express");
const { z } = require("zod");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");
const validate = require("../../shared/middleware/validate");
const { requireRole } = require("../../shared/middleware/auth");
const upload = require("../../shared/utils/upload");

const router = express.Router();
const evidenceRoleGuard = requireRole(["ops", "engineer", "admin"]);

router.use((req, res, next) => {
  const isEvidencePath =
    req.path.startsWith("/evidence") || /^\/workorders\/[^/]+\/evidence(?:\/|$)/.test(req.path);
  if (!isEvidencePath) return next();
  return evidenceRoleGuard(req, res, next);
});

router.post(
  "/evidence/requirements",
  validate(
    z.object({
      name: z.string().min(1),
      productOfferingId: z.number().int().optional(),
      workOrderTypeId: z.number().int().optional(),
      fundingTypeId: z.number().int().optional(),
      evidenceCategoryId: z.number().int().optional(),
      requiredCount: z.number().int().positive().default(1),
      mandatory: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
    }),
  ),
  asyncHandler(async (req, res) => {
    const row = await prisma.evidenceRequirement.create({ data: req.body });
    res.status(201).json(row);
  }),
);

router.post(
  "/workorders/:id/evidence/generate",
  asyncHandler(async (req, res) => {
    const workOrderId = Number(req.params.id);
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { opportunity: true },
    });
    if (!workOrder) return res.status(404).json({ error: "Work order not found" });

    const requirements = await prisma.evidenceRequirement.findMany({
      where: {
        isActive: true,
        OR: [{ workOrderTypeId: null }, { workOrderTypeId: workOrder.workOrderTypeId }],
        AND: [
          {
            OR: [{ productOfferingId: null }, { productOfferingId: workOrder.opportunity.productOfferingId }],
          },
          {
            OR: [{ fundingTypeId: null }, { fundingTypeId: workOrder.fundingTypeId }],
          },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    const created = [];
    for (const reqItem of requirements) {
      for (let i = 0; i < reqItem.requiredCount; i += 1) {
        const item = await prisma.evidenceItem.create({
          data: {
            name: `${reqItem.name} #${i + 1}`,
            opportunityId: workOrder.opportunityId,
            workOrderId: workOrder.id,
            propertyId: workOrder.propertyId,
            requirementId: reqItem.id,
            evidenceTypeId: reqItem.evidenceCategoryId,
            status: "Pending",
          },
        });
        created.push(item);
      }
    }

    await prisma.workOrder.update({
      where: { id: workOrder.id },
      data: { evidenceGateStatus: created.length > 0 ? "Pending" : "Not Required" },
    });

    res.status(201).json(created);
  }),
);

router.post(
  "/evidence/items/:id/upload",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!req.file) return res.status(400).json({ error: "File is required" });
    const item = await prisma.evidenceItem.update({
      where: { id },
      data: {
        filePath: `/uploads/${req.file.filename}`,
        capturedOn: new Date(),
        status: "Submitted",
      },
    });
    res.json(item);
  }),
);

router.patch(
  "/evidence/items/:id/status",
  validate(
    z.object({
      status: z.enum(["Pending", "Submitted", "Approved", "Rejected"]),
      reviewer: z.string().optional(),
      rejectionReason: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const current = await prisma.evidenceItem.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: "Evidence item not found" });
    if (req.body.status === "Approved" && !current.filePath) {
      return res.status(409).json({ error: "Upload an image before approving evidence." });
    }

    const item = await prisma.evidenceItem.update({
      where: { id },
      data: {
        status: req.body.status,
        reviewer: req.body.reviewer,
        rejectionReason: req.body.rejectionReason,
        notes: req.body.notes,
        reviewedOn: new Date(),
      },
      include: { workOrder: true },
    });

    if (item.workOrderId) {
      const pendingCount = await prisma.evidenceItem.count({
        where: {
          workOrderId: item.workOrderId,
          OR: [{ status: "Pending" }, { status: "Submitted" }, { status: "Rejected" }],
        },
      });
      await prisma.workOrder.update({
        where: { id: item.workOrderId },
        data: { evidenceGateStatus: pendingCount === 0 ? "Complete" : "Pending" },
      });
    }

    res.json(item);
  }),
);

router.get(
  "/workorders/:id/evidence",
  asyncHandler(async (req, res) => {
    const workOrderId = Number(req.params.id);
    const items = await prisma.evidenceItem.findMany({
      where: { workOrderId },
      include: { requirement: true, evidenceType: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(items);
  }),
);

module.exports = router;
