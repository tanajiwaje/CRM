const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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

async function main() {
  await upsertByName(prisma.fundingType, ["Paying", "Grant"]);
  await upsertByName(prisma.leadSource, ["Web Form", "Social", "Phone", "Manual"]);
  await upsertByName(prisma.workOrderType, ["Survey", "Install", "Remedial"]);
  await upsertByName(prisma.contactMethod, ["Phone", "Email", "SMS"]);
  await upsertByName(prisma.contactRole, ["Homeowner", "Tenant", "Landlord"]);
  await upsertByName(prisma.consentStatus, ["Unknown", "Given", "Withdrawn"]);
  await upsertByName(prisma.propertyType, ["House", "Flat", "Bungalow"]);
  await upsertByName(prisma.tenureType, ["Owner", "Tenant", "Landlord"]);
  await upsertByName(prisma.evidenceCategory, ["Photo", "Document", "Reading"]);

  await prisma.productOffering.upsert({
    where: { name: "Gas Boiler" },
    update: { technologyGroup: "Heating", isActive: true },
    create: { name: "Gas Boiler", technologyGroup: "Heating", isActive: true },
  });

  const assessmentPaths = [
    { name: "Auto Quote", requiresSurvey: false },
    { name: "Desktop", requiresSurvey: false },
    { name: "Site Survey", requiresSurvey: true },
  ];

  for (const row of assessmentPaths) {
    await prisma.assessmentPath.upsert({
      where: { name: row.name },
      update: { requiresSurvey: row.requiresSurvey, isActive: true },
      create: row,
    });
  }

  await prisma.campaign.upsert({
    where: { name: "Default Campaign" },
    update: { isActive: true },
    create: { name: "Default Campaign", isActive: true },
  });

  await upsertByName(prisma.leadChannel, ["Web Form", "Social", "Phone", "Manual"]);

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

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
