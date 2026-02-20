const express = require("express");
const { z } = require("zod");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");
const validate = require("../../shared/middleware/validate");

const router = express.Router();

router.post(
  "/",
  validate(
    z.object({
      title: z.string().min(1),
      accountId: z.number().int(),
      contactId: z.number().int().optional(),
      propertyId: z.number().int(),
      relatedOpportunityId: z.number().int(),
      priority: z.string().optional(),
      rootCause: z.string().optional(),
      resolutionType: z.string().optional(),
      outcomeNotes: z.string().optional(),
      requiresSiteVisit: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const created = await prisma.case.create({
      data: {
        ...req.body,
        caseType: "Complaint",
        status: "Open",
      },
    });
    res.status(201).json(created);
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await prisma.case.findMany({
      include: {
        account: true,
        contact: true,
        property: true,
        relatedOpportunity: true,
        remedialWorkOrder: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(rows);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const row = await prisma.case.findUnique({
      where: { id },
      include: {
        account: true,
        contact: true,
        property: true,
        relatedOpportunity: true,
        remedialWorkOrder: true,
      },
    });
    if (!row) return res.status(404).json({ error: "Case not found" });
    res.json(row);
  }),
);

router.patch(
  "/:id",
  validate(
    z.object({
      status: z.string().optional(),
      priority: z.string().optional(),
      outcomeNotes: z.string().optional(),
      remedialWorkOrderId: z.number().int().optional(),
      resolutionType: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const row = await prisma.case.update({
      where: { id },
      data: req.body,
    });
    res.json(row);
  }),
);

module.exports = router;
