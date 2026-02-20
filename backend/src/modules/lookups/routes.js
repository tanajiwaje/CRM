const express = require("express");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");

const router = express.Router();

const lookupModelMap = {
  "lead-sources": "leadSource",
  "funding-types": "fundingType",
  "product-offerings": "productOffering",
  "assessment-paths": "assessmentPath",
  "workorder-types": "workOrderType",
  "lead-channels": "leadChannel",
  "contact-methods": "contactMethod",
  "contact-roles": "contactRole",
  "consent-statuses": "consentStatus",
  campaigns: "campaign",
  "property-types": "propertyType",
  "tenure-types": "tenureType",
  "evidence-categories": "evidenceCategory",
};

router.get(
  "/:name",
  asyncHandler(async (req, res) => {
    const modelName = lookupModelMap[req.params.name];
    if (!modelName || !prisma[modelName]) {
      return res.status(404).json({ error: "Lookup not found." });
    }
    const rows = await prisma[modelName].findMany({
      where: { isActive: true },
      orderBy: [{ id: "asc" }],
    });
    res.json(rows);
  }),
);

module.exports = router;
