const express = require("express");
const { z } = require("zod");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");
const validate = require("../../shared/middleware/validate");

const router = express.Router();

const lookupModelMap = {
  "lead-sources": "leadSource",
  "funding-types": "fundingType",
  "product-offerings": "productOffering",
  "assessment-paths": "assessmentPath",
  "workorder-types": "workOrderType",
  "contact-methods": "contactMethod",
  "contact-roles": "contactRole",
  "consent-statuses": "consentStatus",
  campaigns: "campaign",
  "lead-channels": "leadChannel",
  "property-types": "propertyType",
  "tenure-types": "tenureType",
  "evidence-categories": "evidenceCategory",
  statuses: "statusMaster",
};

function getLookupModel(name) {
  const modelName = lookupModelMap[name];
  return modelName ? prisma[modelName] : null;
}

router.get(
  "/lookups/:name",
  asyncHandler(async (req, res) => {
    const model = getLookupModel(req.params.name);
    if (!model) return res.status(404).json({ error: "Lookup model not found." });
    const items = await model.findMany({ orderBy: { id: "asc" } });
    res.json(items);
  }),
);

router.post(
  "/lookups/:name",
  validate(
    z.object({
      name: z.string().min(1).optional(),
      key: z.string().min(1).optional(),
      label: z.string().min(1).optional(),
      category: z.string().min(1).optional(),
      technologyGroup: z.string().optional(),
      requiresSurvey: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const model = getLookupModel(req.params.name);
    if (!model) return res.status(404).json({ error: "Lookup model not found." });

    let data = { ...req.body };
    if (req.params.name === "statuses") {
      if (!data.category || !data.key || !data.label) {
        return res.status(400).json({ error: "category, key and label are required for statuses." });
      }
      data.isActive = data.isActive ?? true;
    } else {
      if (!data.name) return res.status(400).json({ error: "name is required." });
      data.isActive = data.isActive ?? true;
    }

    const created = await model.create({ data });
    res.status(201).json(created);
  }),
);

router.patch(
  "/lookups/:name/:id",
  asyncHandler(async (req, res) => {
    const model = getLookupModel(req.params.name);
    if (!model) return res.status(404).json({ error: "Lookup model not found." });
    const id = Number(req.params.id);
    const updated = await model.update({
      where: { id },
      data: req.body,
    });
    res.json(updated);
  }),
);

router.get(
  "/evidence-requirements",
  asyncHandler(async (req, res) => {
    const rows = await prisma.evidenceRequirement.findMany({
      include: {
        productOffering: true,
        workOrderType: true,
        fundingType: true,
        evidenceCategory: true,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    res.json(rows);
  }),
);

router.post(
  "/evidence-requirements",
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
      isActive: z.boolean().default(true),
    }),
  ),
  asyncHandler(async (req, res) => {
    const row = await prisma.evidenceRequirement.create({ data: req.body });
    res.status(201).json(row);
  }),
);

router.patch(
  "/evidence-requirements/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const row = await prisma.evidenceRequirement.update({
      where: { id },
      data: req.body,
    });
    res.json(row);
  }),
);

router.get(
  "/qa-checklists",
  asyncHandler(async (req, res) => {
    const rows = await prisma.qAChecklist.findMany({
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        productOffering: true,
        workOrderType: true,
      },
      orderBy: { id: "desc" },
    });
    res.json(rows);
  }),
);

router.post(
  "/qa-checklists",
  validate(
    z.object({
      name: z.string().min(1),
      productOfferingId: z.number().int().optional(),
      workOrderTypeId: z.number().int().optional(),
      isActive: z.boolean().default(true),
      items: z.array(
        z.object({
          itemText: z.string().min(1),
          mandatory: z.boolean().default(true),
          sortOrder: z.number().int().default(0),
        }),
      ),
    }),
  ),
  asyncHandler(async (req, res) => {
    const { items, ...data } = req.body;
    const row = await prisma.qAChecklist.create({
      data: {
        ...data,
        items: { create: items || [] },
      },
      include: { items: true },
    });
    res.status(201).json(row);
  }),
);

router.patch(
  "/qa-checklist-items/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const row = await prisma.qAChecklistItem.update({
      where: { id },
      data: req.body,
    });
    res.json(row);
  }),
);

module.exports = router;
