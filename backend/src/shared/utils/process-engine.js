const prisma = require("../db/prisma");
const { getOpportunityBlockers } = require("./gate-checks");

const STAGE_ORDER = ["New", "Quoted", "Accepted", "Delivery", "Closed"];

function stageTransitionAllowed(fromStage = "New", toStage) {
  if (!toStage || fromStage === toStage) return true;
  const fromIndex = STAGE_ORDER.indexOf(fromStage);
  const toIndex = STAGE_ORDER.indexOf(toStage);
  if (fromIndex === -1 || toIndex === -1) return false;
  return toIndex >= fromIndex;
}

async function getOpportunityProcessStatus(opportunityId) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      assessmentPath: true,
      quotes: { include: { lines: true } },
      workOrders: { include: { workOrderType: true } },
    },
  });

  if (!opportunity) {
    const error = new Error("Opportunity not found");
    error.status = 404;
    throw error;
  }

  const hasAcceptedQuote = opportunity.quotes.some((quote) => quote.status === "Accepted");
  const surveyWorkOrders = opportunity.workOrders.filter((wo) => wo.workOrderType?.name === "Survey");
  const installWorkOrders = opportunity.workOrders.filter((wo) => wo.workOrderType?.name === "Install");
  const hasCompletedSurvey = surveyWorkOrders.some((wo) => wo.status === "Completed");

  const blockers = [];
  const nextActions = [];

  const requiresSurvey = Boolean(opportunity.requiresSurvey);
  const assessmentPathName = opportunity.assessmentPath?.name || null;

  if (!assessmentPathName) {
    blockers.push("Assessment path is not selected.");
  } else {
    if (assessmentPathName === "Desktop") {
      blockers.push("Desktop assessment requires approval before progressing.");
    }
    if (assessmentPathName === "Site Survey" && !hasCompletedSurvey) {
      blockers.push("Site survey is required before quote/install progression.");
      if (surveyWorkOrders.length === 0) {
        nextActions.push("Create Survey Work Order");
      }
    }
  }

  if (!hasAcceptedQuote) {
    nextActions.push("Create or Accept Quote");
  } else {
    nextActions.push("Create Install Work Order");
  }

  if (hasAcceptedQuote && installWorkOrders.length > 0) {
    nextActions.push("Progress Install Work Orders");
  }

  const closeBlockers = await getOpportunityBlockers(opportunity.id, false);
  const canRequestPayment = closeBlockers.length === 0;
  const canClose = closeBlockers.length === 0;
  const canCreateQuote = !requiresSurvey || hasCompletedSurvey;
  const canCreateSurveyWorkOrder = requiresSurvey && !hasCompletedSurvey;
  const canCreateInstallWorkOrder = hasAcceptedQuote && (!requiresSurvey || hasCompletedSurvey);

  if (canRequestPayment) nextActions.push("Request Payment");
  if (canClose) nextActions.push("Close Opportunity");

  return {
    opportunityId: opportunity.id,
    currentStage: opportunity.salesStage || "New",
    assessmentPathName,
    requiresSurvey,
    hasAcceptedQuote,
    hasCompletedSurvey,
    canCreateQuote,
    canCreateSurveyWorkOrder,
    canCreateInstallWorkOrder,
    canRequestPayment,
    canClose,
    blockedReasons: [...new Set([...blockers, ...closeBlockers])],
    nextActions: [...new Set(nextActions)],
  };
}

module.exports = {
  STAGE_ORDER,
  stageTransitionAllowed,
  getOpportunityProcessStatus,
};
