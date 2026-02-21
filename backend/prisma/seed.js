const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const TOTAL_LEADS = 100;

const firstNames = [
  "Oliver",
  "Amelia",
  "Noah",
  "Isla",
  "George",
  "Ava",
  "Arthur",
  "Mia",
  "Leo",
  "Freya",
  "Jack",
  "Grace",
  "Harry",
  "Sophie",
  "Charlie",
  "Lily",
  "Oscar",
  "Florence",
  "Theodore",
  "Evie",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Taylor",
  "Davies",
  "Evans",
  "Thomas",
  "Roberts",
  "Wilson",
  "Walker",
  "Wright",
  "Thompson",
  "White",
  "Hughes",
  "Edwards",
  "Green",
  "Hall",
  "Wood",
];

const streets = [
  "King Street",
  "Church Lane",
  "Station Road",
  "Victoria Avenue",
  "Highfield Road",
  "Mill Lane",
  "Springfield Drive",
  "Maple Close",
  "Meadow View",
  "Park Crescent",
];

const cities = [
  { city: "Bristol", postcodePrefix: "BS" },
  { city: "Leeds", postcodePrefix: "LS" },
  { city: "Manchester", postcodePrefix: "M" },
  { city: "Birmingham", postcodePrefix: "B" },
  { city: "Nottingham", postcodePrefix: "NG" },
  { city: "Sheffield", postcodePrefix: "S" },
  { city: "Leicester", postcodePrefix: "LE" },
  { city: "Coventry", postcodePrefix: "CV" },
];

function pick(list, index) {
  return list[index % list.length];
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function money(value) {
  return Number(value.toFixed(2));
}

function buildCustomer(index) {
  const firstName = pick(firstNames, index);
  const lastName = pick(lastNames, index * 3);
  const cityData = pick(cities, index * 2);
  const houseNumber = 10 + (index % 180);
  const street = pick(streets, index * 5);
  const postcodePart = 10 + (index % 80);
  const postcode = `${cityData.postcodePrefix}${postcodePart} ${1 + (index % 9)}AB`;
  const phone = `07${String(100000000 + index * 7343).slice(0, 9)}`;
  const email = `${firstName}.${lastName}.${index + 1}@fullpower-demo.co.uk`.toLowerCase();
  const fullName = `${firstName} ${lastName}`;
  const propertyLine1 = `${houseNumber} ${street}`;

  return {
    fullName,
    firstName,
    lastName,
    phone,
    email,
    city: cityData.city,
    postcode,
    propertyLine1,
  };
}

async function upsertByName(model, names) {
  for (const name of names) {
    await model.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }
}

async function seedStatus(category, rows) {
  for (const row of rows) {
    await prisma.statusMaster.upsert({
      where: { category_key: { category, key: row.key } },
      update: { label: row.label, isActive: true },
      create: { category, key: row.key, label: row.label, isActive: true },
    });
  }
}

async function clearAllData() {
  await prisma.case.deleteMany();
  await prisma.paymentRequest.deleteMany();
  await prisma.xeroInvoiceLink.deleteMany();
  await prisma.opportunityTimeline.deleteMany();
  await prisma.qAResult.deleteMany();
  await prisma.evidenceItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.quoteLine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.property.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.qAChecklistItem.deleteMany();
  await prisma.qAChecklist.deleteMany();
  await prisma.evidenceRequirement.deleteMany();
  await prisma.statusMaster.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.leadChannel.deleteMany();
  await prisma.assessmentPath.deleteMany();
  await prisma.productOffering.deleteMany();
  await prisma.evidenceCategory.deleteMany();
  await prisma.tenureType.deleteMany();
  await prisma.propertyType.deleteMany();
  await prisma.consentStatus.deleteMany();
  await prisma.contactRole.deleteMany();
  await prisma.contactMethod.deleteMany();
  await prisma.workOrderType.deleteMany();
  await prisma.leadSource.deleteMany();
  await prisma.fundingType.deleteMany();
  await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence;");
}

async function seedLookups() {
  await upsertByName(prisma.fundingType, ["Paying", "Grant"]);
  await upsertByName(prisma.leadSource, ["Web Form", "Social", "Phone", "Manual"]);
  await upsertByName(prisma.workOrderType, ["Survey", "Install", "Remedial"]);
  await upsertByName(prisma.contactMethod, ["Phone", "Email", "SMS"]);
  await upsertByName(prisma.contactRole, ["Homeowner", "Tenant", "Landlord"]);
  await upsertByName(prisma.consentStatus, ["Unknown", "Given", "Withdrawn"]);
  await upsertByName(prisma.propertyType, ["House", "Flat", "Bungalow"]);
  await upsertByName(prisma.tenureType, ["Owner", "Tenant", "Landlord"]);
  await upsertByName(prisma.evidenceCategory, ["Photo", "Document", "Reading"]);
  await upsertByName(prisma.leadChannel, ["Web Form", "Social", "Phone", "Manual"]);

  const productOfferings = [
    { name: "Gas Boiler", technologyGroup: "Heating" },
    { name: "Air Source Heat Pump", technologyGroup: "Heating" },
    { name: "Solar PV", technologyGroup: "Solar" },
    { name: "Battery Storage", technologyGroup: "Storage" },
    { name: "EV Charging", technologyGroup: "EV" },
  ];

  for (const row of productOfferings) {
    await prisma.productOffering.upsert({
      where: { name: row.name },
      update: { technologyGroup: row.technologyGroup, isActive: true },
      create: { ...row, isActive: true },
    });
  }

  const assessmentPaths = [
    { name: "Auto Quote", requiresSurvey: false },
    { name: "Desktop", requiresSurvey: false },
    { name: "Site Survey", requiresSurvey: true },
  ];

  for (const row of assessmentPaths) {
    await prisma.assessmentPath.upsert({
      where: { name: row.name },
      update: { requiresSurvey: row.requiresSurvey, isActive: true },
      create: { ...row, isActive: true },
    });
  }

  await prisma.campaign.createMany({
    data: [
      { name: "Winter Warmth Campaign", isActive: true },
      { name: "Boiler Upgrade Push", isActive: true },
      { name: "Renewables Awareness", isActive: true },
    ],
  });

  await seedStatus("lead", [
    { key: "NEW", label: "New" },
    { key: "QUALIFIED", label: "Qualified" },
    { key: "DISQUALIFIED", label: "Disqualified" },
  ]);
  await seedStatus("duplicate", [
    { key: "UNIQUE", label: "Unique" },
    { key: "POTENTIAL_DUPLICATE", label: "Potential Duplicate" },
    { key: "CONFIRMED_DUPLICATE", label: "Confirmed Duplicate" },
  ]);
  await seedStatus("opportunity", [
    { key: "NEW", label: "New" },
    { key: "QUOTED", label: "Quoted" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "DELIVERY", label: "Delivery" },
    { key: "CLOSED", label: "Closed" },
  ]);
  await seedStatus("quote", [
    { key: "DRAFT", label: "Draft" },
    { key: "SENT", label: "Sent" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "DECLINED", label: "Declined" },
  ]);
  await seedStatus("delivery", [
    { key: "NOT_STARTED", label: "Not Started" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED", label: "Completed" },
  ]);
  await seedStatus("evidence", [
    { key: "NOT_REQUIRED", label: "Not Required" },
    { key: "PENDING", label: "Pending" },
    { key: "SUBMITTED", label: "Submitted" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ]);
  await seedStatus("qa", [
    { key: "NOT_STARTED", label: "Not Started" },
    { key: "PENDING", label: "Pending" },
    { key: "PASSED", label: "Passed" },
    { key: "FAILED", label: "Failed" },
  ]);
  await seedStatus("payment", [
    { key: "NOT_SENT", label: "Not Sent" },
    { key: "SENT", label: "Sent" },
    { key: "PAID", label: "Paid" },
    { key: "FAILED", label: "Failed" },
  ]);
}

async function seedEvidenceAndQaTemplates(reference) {
  const installTypeId = reference.workOrderTypeByName.get("Install").id;
  const surveyTypeId = reference.workOrderTypeByName.get("Survey").id;
  const photoCategoryId = reference.evidenceCategoryByName.get("Photo").id;
  const documentCategoryId = reference.evidenceCategoryByName.get("Document").id;
  const readingCategoryId = reference.evidenceCategoryByName.get("Reading").id;

  await prisma.evidenceRequirement.createMany({
    data: [
      {
        name: "Before photos",
        workOrderTypeId: installTypeId,
        evidenceCategoryId: photoCategoryId,
        requiredCount: 2,
        mandatory: true,
        sortOrder: 10,
        isActive: true,
      },
      {
        name: "After photos",
        workOrderTypeId: installTypeId,
        evidenceCategoryId: photoCategoryId,
        requiredCount: 2,
        mandatory: true,
        sortOrder: 20,
        isActive: true,
      },
      {
        name: "Commissioning sheet",
        workOrderTypeId: installTypeId,
        evidenceCategoryId: documentCategoryId,
        requiredCount: 1,
        mandatory: true,
        sortOrder: 30,
        isActive: true,
      },
      {
        name: "System reading",
        workOrderTypeId: installTypeId,
        evidenceCategoryId: readingCategoryId,
        requiredCount: 1,
        mandatory: true,
        sortOrder: 40,
        isActive: true,
      },
      {
        name: "Survey visit photo",
        workOrderTypeId: surveyTypeId,
        evidenceCategoryId: photoCategoryId,
        requiredCount: 1,
        mandatory: false,
        sortOrder: 50,
        isActive: true,
      },
    ],
  });

  const productIds = Array.from(reference.productByName.values()).map((row) => row.id);
  for (const productId of productIds) {
    const checklist = await prisma.qAChecklist.create({
      data: {
        name: `Install QA - Product ${productId}`,
        productOfferingId: productId,
        workOrderTypeId: installTypeId,
        isActive: true,
      },
    });

    await prisma.qAChecklistItem.createMany({
      data: [
        {
          checklistId: checklist.id,
          itemText: "Installation quality meets company standard",
          mandatory: true,
          sortOrder: 10,
        },
        {
          checklistId: checklist.id,
          itemText: "Safety checks completed and logged",
          mandatory: true,
          sortOrder: 20,
        },
        {
          checklistId: checklist.id,
          itemText: "Customer handover and usage guidance completed",
          mandatory: true,
          sortOrder: 30,
        },
      ],
    });
  }
}

function getProductForIndex(index, products) {
  const weighted = [
    "Gas Boiler",
    "Gas Boiler",
    "Gas Boiler",
    "Air Source Heat Pump",
    "Solar PV",
    "Battery Storage",
    "EV Charging",
  ];
  return products.get(weighted[index % weighted.length]);
}

function getAssessmentForIndex(index, paths) {
  const pathName = index % 5 === 0 ? "Desktop" : index % 3 === 0 ? "Site Survey" : "Auto Quote";
  return paths.get(pathName);
}

function quoteLinesForProduct(productName) {
  if (productName === "Gas Boiler") {
    return [
      { description: "A-rated combi boiler supply and install", quantity: 1, unitPrice: 2450 },
      { description: "Magnetic filter and system treatment", quantity: 1, unitPrice: 215 },
    ];
  }
  if (productName === "Air Source Heat Pump") {
    return [
      { description: "ASHP unit and cylinder package", quantity: 1, unitPrice: 7900 },
      { description: "Pipework and controls", quantity: 1, unitPrice: 1250 },
    ];
  }
  if (productName === "Solar PV") {
    return [
      { description: "4.2kW solar PV panel kit", quantity: 1, unitPrice: 5150 },
      { description: "Scaffolding and roof access", quantity: 1, unitPrice: 850 },
    ];
  }
  if (productName === "Battery Storage") {
    return [
      { description: "10kWh battery and inverter", quantity: 1, unitPrice: 4300 },
      { description: "Consumer unit integration", quantity: 1, unitPrice: 650 },
    ];
  }
  return [
    { description: "7kW smart EV charge point", quantity: 1, unitPrice: 1050 },
    { description: "Install and commissioning", quantity: 1, unitPrice: 325 },
  ];
}

async function createEvidenceForInstall(workOrderId, mode, requirementRows) {
  for (const req of requirementRows) {
    for (let i = 0; i < req.requiredCount; i += 1) {
      const isClosed = mode === "closed";
      const isDelivery = mode === "delivery";
      await prisma.evidenceItem.create({
        data: {
          name: `${req.name} #${i + 1}`,
          workOrderId,
          status: isClosed ? "Approved" : isDelivery ? "Submitted" : "Pending",
          filePath: isClosed || isDelivery ? `/uploads/demo-evidence-${workOrderId}-${req.id}-${i + 1}.jpg` : null,
          capturedBy: isClosed ? "Engineer User" : null,
          capturedOn: isClosed || isDelivery ? daysAgo(2) : null,
          reviewer: isClosed ? "Ops User" : null,
          reviewedOn: isClosed ? daysAgo(1) : null,
        },
      });
    }
  }
}

async function createQaForInstall(workOrderId, opportunityId, productId, mode, checklistMap) {
  const checklistItems = checklistMap.get(productId) || [];
  for (const item of checklistItems) {
    await prisma.qAResult.create({
      data: {
        workOrderId,
        opportunityId,
        checklistItemId: item.id,
        result: mode === "closed" ? "Pass" : "N/A",
        checkedBy: mode === "closed" ? "Ops User" : null,
        checkedOn: mode === "closed" ? daysAgo(1) : null,
      },
    });
  }
}

async function seedJourneys(reference) {
  const payingFundingId = reference.fundingTypeByName.get("Paying").id;
  const leadSources = Array.from(reference.leadSourceByName.values());
  const channels = Array.from(reference.leadChannelByName.values());
  const campaigns = reference.campaigns;
  const installTypeId = reference.workOrderTypeByName.get("Install").id;
  const surveyTypeId = reference.workOrderTypeByName.get("Survey").id;
  const remedialTypeId = reference.workOrderTypeByName.get("Remedial").id;
  const installEvidenceRequirements = await prisma.evidenceRequirement.findMany({
    where: { workOrderTypeId: installTypeId, mandatory: true, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const checklists = await prisma.qAChecklist.findMany({
    where: { workOrderTypeId: installTypeId, isActive: true },
    include: { items: true },
  });
  const checklistMap = new Map(checklists.map((c) => [c.productOfferingId, c.items]));

  let quoteCounter = 1;
  let workOrderCounter = 1;
  let casesCounter = 0;

  for (let i = 0; i < TOTAL_LEADS; i += 1) {
    const customer = buildCustomer(i);
    const product = getProductForIndex(i, reference.productByName);
    const assessmentPath = getAssessmentForIndex(i, reference.assessmentPathByName);
    const source = pick(leadSources, i * 3);
    const channel = pick(channels, i * 5);
    const campaign = pick(campaigns, i * 7);
    const disqualified = i < 15;

    const lead = await prisma.lead.create({
      data: {
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        sourceId: source.id,
        campaignId: campaign.id,
        createdFromId: channel.id,
        duplicateStatus: i % 16 === 0 ? "Potential Duplicate" : "Unique",
        fundingTypeId: payingFundingId,
        interestedProductId: product.id,
        propertyAddressLine1: customer.propertyLine1,
        propertyCity: customer.city,
        propertyPostcode: customer.postcode,
        propertyCountry: "United Kingdom",
        qualificationStatus: disqualified ? "Disqualified" : "Qualified",
        disqualificationReason: disqualified ? "Outside service area for current phase." : null,
        notes: `Lead created from ${source.name} and assigned to ${campaign.name}.`,
        createdAt: daysAgo(120 - i),
        updatedAt: daysAgo(120 - i),
      },
    });

    if (disqualified) {
      continue;
    }

    const account = await prisma.account.create({
      data: {
        accountName: `${customer.fullName} Household`,
        accountType: "Customer",
        phone: customer.phone,
        email: customer.email,
        billingAddressLine1: customer.propertyLine1,
        billingCity: customer.city,
        billingPostcode: customer.postcode,
        billingCountry: "United Kingdom",
        preferredContactMethodId: reference.contactMethodByName.get(i % 2 === 0 ? "Phone" : "Email").id,
        customerFundingTypeId: payingFundingId,
        marketingSourceId: source.id,
        createdAt: daysAgo(110 - i),
        updatedAt: daysAgo(110 - i),
      },
    });

    const contact = await prisma.contact.create({
      data: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        mobile: customer.phone,
        email: customer.email,
        accountId: account.id,
        roleId: reference.contactRoleByName.get("Homeowner").id,
        preferredContactMethodId: reference.contactMethodByName.get(i % 2 === 0 ? "Phone" : "Email").id,
        consentStatusId: reference.consentStatusByName.get("Given").id,
        createdAt: daysAgo(109 - i),
        updatedAt: daysAgo(109 - i),
      },
    });

    await prisma.account.update({
      where: { id: account.id },
      data: { primaryContactId: contact.id },
    });

    const property = await prisma.property.create({
      data: {
        propertyName: `${customer.propertyLine1}, ${customer.city}`,
        accountId: account.id,
        primaryContactId: contact.id,
        addressLine1: customer.propertyLine1,
        city: customer.city,
        postcode: customer.postcode,
        country: "United Kingdom",
        propertyTypeId: reference.propertyTypeByName.get(i % 4 === 0 ? "Bungalow" : "House").id,
        tenureTypeId: reference.tenureTypeByName.get("Owner").id,
        accessNotes: i % 3 === 0 ? "Rear access through side gate." : "Front door access.",
        parkingNotes: i % 4 === 0 ? "Limited driveway space." : "On-street parking available.",
        surveyRequiredDefault: assessmentPath.requiresSurvey,
        utilitiesNotes: "Gas and electric meter located in hallway cupboard.",
        createdFromLeadId: lead.id,
        createdAt: daysAgo(108 - i),
        updatedAt: daysAgo(108 - i),
      },
    });

    const lifecycle = i % 3 === 0 ? "quoted" : i % 3 === 1 ? "delivery" : "closed";

    const opportunity = await prisma.opportunity.create({
      data: {
        opportunityName: `${customer.fullName} - ${product.name}`,
        accountId: account.id,
        primaryContactId: contact.id,
        propertyId: property.id,
        fundingTypeId: payingFundingId,
        productOfferingId: product.id,
        assessmentPathId: assessmentPath.id,
        requiresSurvey: assessmentPath.requiresSurvey,
        salesStage: lifecycle === "quoted" ? "Quoted" : lifecycle === "delivery" ? "Delivery" : "Closed",
        estimatedValue: money(2200 + (i % 7) * 525 + (product.name === "Gas Boiler" ? 0 : 2100)),
        quoteStatus: lifecycle === "quoted" ? "Sent" : "Accepted",
        acceptanceDate: lifecycle === "quoted" ? null : daysAgo(50 - i),
        deliveryStatus: lifecycle === "quoted" ? "Not Started" : lifecycle === "delivery" ? "In Progress" : "Completed",
        evidenceStatus: lifecycle === "closed" ? "Approved" : lifecycle === "delivery" ? "Submitted" : "Not Required",
        qaStatus: lifecycle === "closed" ? "Passed" : lifecycle === "delivery" ? "Pending" : "Not Started",
        paymentLinkSent: lifecycle !== "quoted",
        paymentLinkSentOn: lifecycle !== "quoted" ? daysAgo(14 - (i % 5)) : null,
        paymentRequested: lifecycle === "closed",
        paymentRequestedOn: lifecycle === "closed" ? daysAgo(8 - (i % 3)) : null,
        xeroInvoiceStatus: lifecycle === "closed" ? "AUTHORISED" : "Not Synced",
        xeroInvoiceNumber: lifecycle === "closed" ? `INV-2026-${String(i + 1).padStart(4, "0")}` : null,
        xeroInvoiceId: lifecycle === "closed" ? `xero-demo-${i + 1}` : null,
        actualCloseDate: lifecycle === "closed" ? daysAgo(6 - (i % 2)) : null,
        createdAt: daysAgo(105 - i),
        updatedAt: daysAgo(5),
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        qualifiedAccountId: account.id,
        qualifiedContactId: contact.id,
        qualifiedPropertyId: property.id,
        qualifiedOpportunityId: opportunity.id,
      },
    });

    if (assessmentPath.requiresSurvey) {
      const surveyStatus = lifecycle === "quoted" ? "Scheduled" : "Completed";
      await prisma.workOrder.create({
        data: {
          workOrderNumber: `WO-2026-${String(workOrderCounter).padStart(5, "0")}`,
          opportunityId: opportunity.id,
          propertyId: property.id,
          workOrderTypeId: surveyTypeId,
          fundingTypeId: payingFundingId,
          evidenceRequired: false,
          evidenceGateStatus: "Not Required",
          qaGateStatus: "Not Required",
          scheduledStart: daysAgo(45 - i),
          scheduledEnd: daysAgo(45 - i),
          actualStart: surveyStatus === "Completed" ? daysAgo(45 - i) : null,
          actualEnd: surveyStatus === "Completed" ? daysAgo(45 - i) : null,
          status: surveyStatus,
          substatus: surveyStatus === "Completed" ? "Survey Complete" : "Awaiting Visit",
          createdAt: daysAgo(60 - i),
          updatedAt: daysAgo(44 - i),
        },
      });
      workOrderCounter += 1;
    }

    const quote = await prisma.quote.create({
      data: {
        quoteName: `${product.name} Proposal`,
        quoteNumber: `Q-2026-${String(quoteCounter).padStart(5, "0")}`,
        opportunityId: opportunity.id,
        propertyId: property.id,
        quoteType: "Initial",
        status: lifecycle === "quoted" ? "Sent" : "Accepted",
        sentOn: daysAgo(42 - i),
        acceptedOn: lifecycle === "quoted" ? null : daysAgo(40 - i),
        acceptanceMethod: lifecycle === "quoted" ? null : i % 2 === 0 ? "Email" : "Phone",
        customerProof: lifecycle === "quoted" ? null : "Call recording and confirmation email stored externally.",
        createdAt: daysAgo(43 - i),
        updatedAt: daysAgo(40 - i),
      },
    });
    quoteCounter += 1;

    let quoteTotal = 0;
    for (const line of quoteLinesForProduct(product.name)) {
      const lineTotal = money(line.quantity * line.unitPrice);
      quoteTotal += lineTotal;
      await prisma.quoteLine.create({
        data: {
          quoteId: quote.id,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal,
          createdAt: daysAgo(42 - i),
          updatedAt: daysAgo(42 - i),
        },
      });
    }

    await prisma.quote.update({
      where: { id: quote.id },
      data: { totalAmount: money(quoteTotal) },
    });

    if (lifecycle !== "quoted") {
      const installStatus = lifecycle === "closed" ? "Completed" : "In Progress";
      const installWorkOrder = await prisma.workOrder.create({
        data: {
          workOrderNumber: `WO-2026-${String(workOrderCounter).padStart(5, "0")}`,
          opportunityId: opportunity.id,
          propertyId: property.id,
          workOrderTypeId: installTypeId,
          fundingTypeId: payingFundingId,
          evidenceRequired: true,
          evidenceGateStatus: lifecycle === "closed" ? "Complete" : "Pending",
          qaGateStatus: lifecycle === "closed" ? "Complete" : "Pending",
          scheduledStart: daysAgo(25 - i),
          scheduledEnd: daysAgo(24 - i),
          actualStart: lifecycle === "closed" ? daysAgo(24 - i) : daysAgo(2),
          actualEnd: lifecycle === "closed" ? daysAgo(23 - i) : null,
          status: installStatus,
          substatus: lifecycle === "closed" ? "Handover Complete" : "On Site",
          createdAt: daysAgo(27 - i),
          updatedAt: daysAgo(2),
        },
      });
      workOrderCounter += 1;

      await createEvidenceForInstall(installWorkOrder.id, lifecycle, installEvidenceRequirements);
      await createQaForInstall(
        installWorkOrder.id,
        opportunity.id,
        product.id,
        lifecycle,
        checklistMap,
      );

      if (lifecycle === "closed") {
        await prisma.paymentRequest.create({
          data: {
            opportunityId: opportunity.id,
            propertyId: property.id,
            amountRequested: money(quoteTotal),
            paymentLinkUrl: `https://pay.fullpower-demo.co.uk/${opportunity.id}`,
            paymentLinkSentOn: daysAgo(8 - (i % 3)),
            sentBy: "Ops User",
            paymentStatus: i % 8 === 0 ? "Sent" : "Paid",
            paidOn: i % 8 === 0 ? null : daysAgo(3 - (i % 2)),
            notes: i % 8 === 0 ? "Awaiting customer transfer confirmation." : "Payment settled by card.",
            createdAt: daysAgo(8 - (i % 3)),
            updatedAt: daysAgo(3 - (i % 2)),
          },
        });

        await prisma.xeroInvoiceLink.create({
          data: {
            opportunityId: opportunity.id,
            xeroInvoiceId: `xero-demo-${opportunity.id}`,
            xeroInvoiceNumber: `INV-2026-${String(opportunity.id).padStart(4, "0")}`,
            xeroStatus: "AUTHORISED",
            total: money(quoteTotal),
            lastSyncedOn: daysAgo(2),
            createdAt: daysAgo(3),
            updatedAt: daysAgo(2),
          },
        });
      }
    }

    await prisma.opportunityTimeline.createMany({
      data: [
        {
          opportunityId: opportunity.id,
          note: "Lead qualified and opportunity created.",
          createdBy: "Sales User",
          createdAt: daysAgo(105 - i),
        },
        {
          opportunityId: opportunity.id,
          note:
            lifecycle === "quoted"
              ? "Quote issued and awaiting customer acceptance."
              : lifecycle === "delivery"
                ? "Install started and evidence collection in progress."
                : "Install completed, QA passed and handed to finance.",
          createdBy: lifecycle === "quoted" ? "Sales User" : "Ops User",
          createdAt: daysAgo(10 - (i % 4)),
        },
      ],
    });

    if (i % 14 === 0) {
      const needsSiteVisit = i % 28 === 0;
      let remedialWorkOrderId = null;
      if (needsSiteVisit) {
        const remedial = await prisma.workOrder.create({
          data: {
            workOrderNumber: `WO-2026-${String(workOrderCounter).padStart(5, "0")}`,
            opportunityId: opportunity.id,
            propertyId: property.id,
            workOrderTypeId: remedialTypeId,
            fundingTypeId: payingFundingId,
            evidenceRequired: false,
            evidenceGateStatus: "Not Required",
            qaGateStatus: "Not Required",
            scheduledStart: daysAgo(1),
            scheduledEnd: daysAgo(1),
            status: "Scheduled",
            substatus: "Remedial Visit Planned",
          },
        });
        workOrderCounter += 1;
        remedialWorkOrderId = remedial.id;
      }

      await prisma.case.create({
        data: {
          title: `Complaint #${casesCounter + 1} - ${customer.fullName}`,
          caseType: "Complaint",
          accountId: account.id,
          contactId: contact.id,
          propertyId: property.id,
          relatedOpportunityId: opportunity.id,
          priority: i % 2 === 0 ? "Medium" : "Low",
          slaDueDate: daysAgo(-3),
          rootCause: i % 3 === 0 ? "Missed communication on schedule change." : "Minor cosmetic snag.",
          resolutionType: i % 3 === 0 ? "Call Resolution" : "Remedial Works",
          outcomeNotes: i % 3 === 0 ? "Resolved by customer service callback." : "Scheduled corrective visit.",
          requiresSiteVisit: needsSiteVisit,
          remedialWorkOrderId,
          status: i % 4 === 0 ? "Open" : "Resolved",
        },
      });
      casesCounter += 1;
    }
  }
}

async function loadReferenceData() {
  const [
    fundingTypes,
    leadSources,
    workOrderTypes,
    contactMethods,
    contactRoles,
    consentStatuses,
    propertyTypes,
    tenureTypes,
    evidenceCategories,
    products,
    assessmentPaths,
    leadChannels,
    campaigns,
  ] = await Promise.all([
    prisma.fundingType.findMany(),
    prisma.leadSource.findMany(),
    prisma.workOrderType.findMany(),
    prisma.contactMethod.findMany(),
    prisma.contactRole.findMany(),
    prisma.consentStatus.findMany(),
    prisma.propertyType.findMany(),
    prisma.tenureType.findMany(),
    prisma.evidenceCategory.findMany(),
    prisma.productOffering.findMany(),
    prisma.assessmentPath.findMany(),
    prisma.leadChannel.findMany(),
    prisma.campaign.findMany({ orderBy: { id: "asc" } }),
  ]);

  return {
    fundingTypeByName: new Map(fundingTypes.map((row) => [row.name, row])),
    leadSourceByName: new Map(leadSources.map((row) => [row.name, row])),
    workOrderTypeByName: new Map(workOrderTypes.map((row) => [row.name, row])),
    contactMethodByName: new Map(contactMethods.map((row) => [row.name, row])),
    contactRoleByName: new Map(contactRoles.map((row) => [row.name, row])),
    consentStatusByName: new Map(consentStatuses.map((row) => [row.name, row])),
    propertyTypeByName: new Map(propertyTypes.map((row) => [row.name, row])),
    tenureTypeByName: new Map(tenureTypes.map((row) => [row.name, row])),
    evidenceCategoryByName: new Map(evidenceCategories.map((row) => [row.name, row])),
    productByName: new Map(products.map((row) => [row.name, row])),
    assessmentPathByName: new Map(assessmentPaths.map((row) => [row.name, row])),
    leadChannelByName: new Map(leadChannels.map((row) => [row.name, row])),
    campaigns,
  };
}

async function printSummary() {
  const [
    leads,
    qualifiedLeads,
    opportunities,
    quotes,
    workOrders,
    evidenceItems,
    payments,
    invoices,
    cases,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { qualificationStatus: "Qualified" } }),
    prisma.opportunity.count(),
    prisma.quote.count(),
    prisma.workOrder.count(),
    prisma.evidenceItem.count(),
    prisma.paymentRequest.count(),
    prisma.xeroInvoiceLink.count(),
    prisma.case.count(),
  ]);

  console.log("Seed complete");
  console.log(`Leads: ${leads}`);
  console.log(`Qualified leads: ${qualifiedLeads}`);
  console.log(`Opportunities: ${opportunities}`);
  console.log(`Quotes: ${quotes}`);
  console.log(`Work orders: ${workOrders}`);
  console.log(`Evidence items: ${evidenceItems}`);
  console.log(`Payment requests: ${payments}`);
  console.log(`Xero invoice links: ${invoices}`);
  console.log(`Cases: ${cases}`);
}

async function main() {
  await clearAllData();
  await seedLookups();

  const reference = await loadReferenceData();
  await seedEvidenceAndQaTemplates(reference);
  await seedJourneys(reference);
  await printSummary();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
