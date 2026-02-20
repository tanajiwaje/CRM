const app = require("../src/app");
const prisma = require("../src/shared/db/prisma");

function assertStatus(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

async function json(res) {
  return res.json().catch(() => ({}));
}

async function main() {
  const server = app.listen(4050);
  const base = "http://localhost:4050";

  try {
    const loginRes = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@crm.local", password: "Admin@123" }),
    });
    assertStatus(loginRes.status, 200, "Admin login");
    const login = await json(loginRes);
    const token = login.token;
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const leadRes = await fetch(`${base}/leads`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        fullName: "Scenario User",
        email: `scenario-${Date.now()}@example.com`,
        phone: "987654321",
        sourceId: 1,
        createdFromId: 1,
        fundingTypeId: 1,
        interestedProductId: 1,
        propertyAddressLine1: "12 High Street",
        propertyCity: "London",
      }),
    });
    assertStatus(leadRes.status, 201, "Lead create");
    const lead = await json(leadRes);

    const qualifyRes = await fetch(`${base}/leads/${lead.id}/qualify`, {
      method: "POST",
      headers: authHeaders,
    });
    assertStatus(qualifyRes.status, 200, "Lead qualify");
    const qualified = await json(qualifyRes);
    const opportunityId = qualified.opportunity.id;

    const updateOppRes = await fetch(`${base}/opportunities/${opportunityId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ assessmentPathId: 3, requiresSurvey: true }),
    });
    assertStatus(updateOppRes.status, 200, "Set assessment path to Site Survey");

    const blockedQuoteRes = await fetch(`${base}/opportunities/${opportunityId}/quotes`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ quoteName: "Blocked Quote" }),
    });
    assertStatus(blockedQuoteRes.status, 409, "Quote blocked before survey");

    const surveyType = await prisma.workOrderType.findFirst({ where: { name: "Survey" } });
    const installType = await prisma.workOrderType.findFirst({ where: { name: "Install" } });

    const surveyWoRes = await fetch(`${base}/opportunities/${opportunityId}/workorders`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ workOrderTypeId: surveyType.id }),
    });
    assertStatus(surveyWoRes.status, 201, "Survey work order create");
    const surveyWo = await json(surveyWoRes);

    const completeSurveyRes = await fetch(`${base}/workorders/${surveyWo.id}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: "Completed" }),
    });
    assertStatus(completeSurveyRes.status, 200, "Complete survey work order");

    const quoteRes = await fetch(`${base}/opportunities/${opportunityId}/quotes`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ quoteName: "Survey Quote" }),
    });
    assertStatus(quoteRes.status, 201, "Quote create after survey");
    const quote = await json(quoteRes);

    const blockedInstallRes = await fetch(`${base}/opportunities/${opportunityId}/workorders`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ workOrderTypeId: installType.id, evidenceRequired: true }),
    });
    assertStatus(blockedInstallRes.status, 409, "Install blocked before quote acceptance");

    const lineRes = await fetch(`${base}/quotes/${quote.id}/lines`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ description: "Boiler Install", quantity: 1, unitPrice: 1200 }),
    });
    assertStatus(lineRes.status, 201, "Quote line create");

    const acceptQuoteRes = await fetch(`${base}/quotes/${quote.id}/accept`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ acceptanceMethod: "Email" }),
    });
    assertStatus(acceptQuoteRes.status, 200, "Quote accept");

    const installWoRes = await fetch(`${base}/opportunities/${opportunityId}/workorders`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ workOrderTypeId: installType.id, evidenceRequired: true }),
    });
    assertStatus(installWoRes.status, 201, "Install work order create after quote acceptance");

    const processRes = await fetch(`${base}/opportunities/${opportunityId}/process-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assertStatus(processRes.status, 200, "Opportunity process status endpoint");
    const process = await json(processRes);
    if (!Array.isArray(process.nextActions)) {
      throw new Error("Process status missing nextActions");
    }

    console.log("test:process passed");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("test:process failed");
  console.error(error);
  process.exit(1);
});
