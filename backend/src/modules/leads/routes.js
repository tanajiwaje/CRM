const express = require("express");
const { z } = require("zod");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");
const validate = require("../../shared/middleware/validate");

const router = express.Router();

const leadCreateSchema = z.object({
  fullName: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  sourceId: z.number().int().optional(),
  campaignId: z.number().int().optional(),
  createdFromId: z.number().int().optional(),
  fundingTypeId: z.number().int().optional(),
  interestedProductId: z.number().int().optional(),
  propertyAddressLine1: z.string().optional(),
  propertyAddressLine2: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyPostcode: z.string().optional(),
  propertyCountry: z.string().optional(),
  notes: z.string().optional(),
});

const leadUpdateSchema = leadCreateSchema.partial().extend({
  qualificationStatus: z.string().optional(),
  disqualificationReason: z.string().optional(),
});

function splitName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "Unknown";
  const lastName = parts.join(" ") || "Contact";
  return { firstName, lastName };
}

async function findDuplicateTargets({ email, phone }) {
  const [lead, contact] = await Promise.all([
    prisma.lead.findFirst({
      where: {
        OR: [{ email: email || undefined }, { phone: phone || undefined }],
      },
      orderBy: { id: "desc" },
    }),
    prisma.contact.findFirst({
      where: {
        OR: [{ email: email || undefined }, { mobile: phone || undefined }],
      },
      orderBy: { id: "desc" },
    }),
  ]);
  return { lead, contact };
}

router.post(
  "/",
  validate(leadCreateSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body;
    const duplicate = await findDuplicateTargets(payload);
    const createData = {
      ...payload,
      duplicateStatus: duplicate.lead || duplicate.contact ? "Potential Duplicate" : "Unique",
      duplicateOfLeadId: duplicate.lead?.id || null,
      qualificationStatus: "New",
    };
    const lead = await prisma.lead.create({ data: createData });
    res.status(201).json(lead);
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, source, search } = req.query;
    const leads = await prisma.lead.findMany({
      where: {
        qualificationStatus: status ? String(status) : undefined,
        source: source
          ? {
              name: {
                contains: String(source),
              },
            }
          : undefined,
        OR: search
          ? [
              { fullName: { contains: String(search) } },
              { companyName: { contains: String(search) } },
              { email: { contains: String(search) } },
              { phone: { contains: String(search) } },
            ]
          : undefined,
      },
      orderBy: { createdAt: "desc" },
      include: {
        source: true,
        campaign: true,
        createdFrom: true,
        fundingType: true,
        interestedProduct: true,
      },
    });
    res.json(leads);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        source: true,
        campaign: true,
        createdFrom: true,
        fundingType: true,
        interestedProduct: true,
      },
    });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(lead);
  }),
);

router.patch(
  "/:id",
  validate(leadUpdateSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const lead = await prisma.lead.update({ where: { id }, data: req.body });
    res.json(lead);
  }),
);

router.post(
  "/:id/dedupe-check",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const duplicate = await findDuplicateTargets({ email: lead.email, phone: lead.phone });
    const duplicateStatus = duplicate.lead?.id && duplicate.lead.id !== id ? "Potential Duplicate" : duplicate.contact ? "Potential Duplicate" : "Unique";
    const updated = await prisma.lead.update({
      where: { id },
      data: {
        duplicateStatus,
        duplicateOfLeadId:
          duplicate.lead?.id && duplicate.lead.id !== id ? duplicate.lead.id : null,
      },
    });
    res.json(updated);
  }),
);

router.post(
  "/:id/qualify",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const accountName = lead.companyName || lead.fullName || `Lead-${lead.id}`;
      let account = await tx.account.findFirst({
        where: { accountName: accountName },
      });

      if (!account) {
        account = await tx.account.create({
          data: {
            accountName,
            email: lead.email || null,
            phone: lead.phone || null,
            customerFundingTypeId: lead.fundingTypeId || null,
            accountType: "Customer",
          },
        });
      }

      const names = splitName(lead.fullName || lead.companyName || "");
      let contact = await tx.contact.findFirst({
        where: {
          accountId: account.id,
          OR: [{ email: lead.email || undefined }, { mobile: lead.phone || undefined }],
        },
      });

      if (!contact) {
        contact = await tx.contact.create({
          data: {
            accountId: account.id,
            firstName: names.firstName,
            lastName: names.lastName,
            email: lead.email || null,
            mobile: lead.phone || null,
          },
        });
      }

      const propertyName = lead.propertyAddressLine1 || `Property for ${accountName}`;
      const property = await tx.property.create({
        data: {
          propertyName,
          accountId: account.id,
          primaryContactId: contact.id,
          addressLine1: lead.propertyAddressLine1,
          addressLine2: lead.propertyAddressLine2,
          city: lead.propertyCity,
          postcode: lead.propertyPostcode,
          country: lead.propertyCountry,
          createdFromLeadId: lead.id,
        },
      });

      const existingOpenOpportunity = await tx.opportunity.findFirst({
        where: {
          propertyId: property.id,
          productOfferingId: lead.interestedProductId || undefined,
          actualCloseDate: null,
        },
      });

      if (existingOpenOpportunity) {
        throw Object.assign(new Error("Active opportunity already exists for this property/product."), {
          status: 409,
        });
      }

      const opportunity = await tx.opportunity.create({
        data: {
          opportunityName: `${accountName} - ${property.propertyName}`,
          accountId: account.id,
          primaryContactId: contact.id,
          propertyId: property.id,
          fundingTypeId: lead.fundingTypeId || null,
          productOfferingId: lead.interestedProductId || null,
          salesStage: "New",
          quoteStatus: "Draft",
          deliveryStatus: "Not Started",
          evidenceStatus: "Not Required",
          qaStatus: "Not Started",
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          qualificationStatus: "Qualified",
          qualifiedAccountId: account.id,
          qualifiedContactId: contact.id,
          qualifiedPropertyId: property.id,
          qualifiedOpportunityId: opportunity.id,
        },
      });

      return { updatedLead, account, contact, property, opportunity };
    });

    res.json(result);
  }),
);

router.post(
  "/:id/disqualify",
  validate(
    z.object({
      reason: z.string().min(1),
    }),
  ),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        qualificationStatus: "Disqualified",
        disqualificationReason: req.body.reason,
      },
    });
    res.json(lead);
  }),
);

module.exports = router;
