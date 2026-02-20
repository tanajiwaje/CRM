const prisma = require("../db/prisma");

async function getOpportunityBlockers(opportunityId, requireInvoice = false) {
  const blockers = [];

  const installOrders = await prisma.workOrder.findMany({
    where: {
      opportunityId,
      workOrderType: { name: "Install" },
    },
    include: { evidenceItems: true, qaResults: true },
  });

  if (installOrders.length === 0) {
    blockers.push("No install work orders found.");
  }

  for (const wo of installOrders) {
    if (wo.status !== "Completed") {
      blockers.push(`Work order ${wo.id} is not completed.`);
    }

    const mandatoryRequirements = await prisma.evidenceRequirement.findMany({
      where: {
        mandatory: true,
        isActive: true,
        OR: [{ workOrderTypeId: wo.workOrderTypeId }, { workOrderTypeId: null }],
      },
    });

    for (const req of mandatoryRequirements) {
      const approvedCount = wo.evidenceItems.filter(
        (item) => item.requirementId === req.id && item.status === "Approved",
      ).length;
      if (approvedCount < req.requiredCount) {
        blockers.push(
          `Work order ${wo.id} missing approved evidence for requirement "${req.name}".`,
        );
      }
    }

    const failedQa = wo.qaResults.some((result) => result.result === "Fail");
    if (failedQa) {
      blockers.push(`Work order ${wo.id} has failed QA results.`);
    }
  }

  const anyQa = installOrders.some((wo) => wo.qaResults.length > 0);
  if (!anyQa) {
    blockers.push("QA results are not completed.");
  }

  if (requireInvoice) {
    const invoice = await prisma.xeroInvoiceLink.findFirst({
      where: { opportunityId },
    });
    if (!invoice?.xeroInvoiceNumber) {
      blockers.push("Invoice reference is missing.");
    }
  }

  return blockers;
}

module.exports = { getOpportunityBlockers };
