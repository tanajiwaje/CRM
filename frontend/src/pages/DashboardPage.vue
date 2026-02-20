<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "../services/api";
import { getUser } from "../services/auth";
import heroImage from "../assets/home-hero.svg";

const loading = ref(true);
const error = ref("");
const kpis = ref({
  newLeads: 0,
  qualifiedLeads: 0,
  openOpportunities: 0,
  scheduledWorkOrders: 0,
  evidencePending: 0,
  qaPending: 0,
  paymentRequested: 0,
  readyToClose: 0,
});
const user = getUser();
const kpiMeta = {
  newLeads: { label: "New Leads Today", icon: "bi-person-plus" },
  qualifiedLeads: { label: "Qualified Leads", icon: "bi-check2-circle" },
  openOpportunities: { label: "Open Opportunities", icon: "bi-briefcase" },
  scheduledWorkOrders: { label: "Scheduled Work Orders", icon: "bi-calendar3" },
  evidencePending: { label: "Evidence Pending", icon: "bi-camera" },
  qaPending: { label: "QA Pending", icon: "bi-patch-check" },
  paymentRequested: { label: "Payment Requested", icon: "bi-cash-coin" },
  readyToClose: { label: "Ready To Close", icon: "bi-flag" },
};
const processSteps = [
  { icon: "bi-person-plus", label: "1. Lead Capture", detail: "Web/Social/Phone/Manual enquiry created" },
  { icon: "bi-check2-square", label: "2. Qualification", detail: "Dedupe + suitability check (qualify/disqualify)" },
  { icon: "bi-briefcase", label: "3. Opportunity", detail: "Account + Contact + Property + Opportunity created" },
  { icon: "bi-ui-checks-grid", label: "4. Assessment", detail: "Auto Quote or Site Survey decision path" },
  { icon: "bi-receipt", label: "5. Quote & Accept", detail: "Quote lines, send quote, customer acceptance" },
  { icon: "bi-tools", label: "6. Delivery", detail: "Survey/Install work orders scheduled and progressed" },
  { icon: "bi-camera", label: "7. Evidence & QA", detail: "Mandatory evidence + QA checklist approval" },
  { icon: "bi-credit-card", label: "8. Payment & Invoice", detail: "Payment request + Xero invoice reference" },
  { icon: "bi-flag", label: "9. Close", detail: "Close only when all gates pass" },
];
const roleFlows = [
  {
    role: "Sales User",
    icon: "bi-person-badge",
    color: "text-primary",
    flow: "Create lead -> dedupe -> qualify -> create/manage quote -> customer acceptance -> handoff to Ops.",
  },
  {
    role: "Ops User",
    icon: "bi-gear-wide-connected",
    color: "text-success",
    flow: "Set assessment path -> create survey/install work orders -> monitor gates -> request payment -> record invoice -> close.",
  },
  {
    role: "Engineer User",
    icon: "bi-tools",
    color: "text-warning",
    flow: "Open assigned work orders -> update schedule/status -> submit evidence -> complete QA items -> mark ready for Ops review.",
  },
  {
    role: "Admin User",
    icon: "bi-shield-lock",
    color: "text-dark",
    flow: "Manage master data, evidence templates, QA templates, and role governance for process compliance.",
  },
];

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const role = user?.role || "";
    const canSeeLeads = ["sales", "ops", "admin"].includes(role);
    const canSeeWorkOrders = ["engineer", "ops", "admin"].includes(role);

    const [leadsResult, opportunitiesResult, workOrdersResult] = await Promise.allSettled([
      canSeeLeads ? api("/leads") : Promise.resolve([]),
      api("/opportunities"),
      canSeeWorkOrders ? api("/workorders") : Promise.resolve([]),
    ]);

    const leads = leadsResult.status === "fulfilled" ? leadsResult.value : [];
    const opportunities = opportunitiesResult.status === "fulfilled" ? opportunitiesResult.value : [];
    const workOrders = workOrdersResult.status === "fulfilled" ? workOrdersResult.value : [];

    kpis.value.newLeads = canSeeLeads ? leads.filter((x) => x.qualificationStatus === "New").length : 0;
    kpis.value.qualifiedLeads = canSeeLeads ? leads.filter((x) => x.qualificationStatus === "Qualified").length : 0;
    kpis.value.openOpportunities = opportunities.filter((x) => !x.actualCloseDate).length;
    kpis.value.scheduledWorkOrders = canSeeWorkOrders ? workOrders.filter((x) => x.scheduledStart).length : 0;
    kpis.value.evidencePending = opportunities.filter((x) => x.evidenceStatus !== "Approved").length;
    kpis.value.qaPending = opportunities.filter((x) => x.qaStatus !== "Passed").length;
    kpis.value.paymentRequested = opportunities.filter((x) => x.paymentRequested).length;
    kpis.value.readyToClose = opportunities.filter(
      (x) => x.deliveryStatus === "Completed" && x.evidenceStatus === "Approved" && x.qaStatus === "Passed",
    ).length;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="card mb-4">
    <div class="card-body p-0 overflow-hidden">
      <div class="row g-0">
        <div class="col-lg-7 p-4 p-xl-5">
          <span class="badge text-bg-primary mb-3">Home</span>
          <h2 class="mb-2">PowerFlow Ops Suite</h2>
          <p class="mb-4 text-muted">
            Professional operations console for your full process: lead capture, qualification, quoting,
            survey/install delivery, evidence, QA, payments, invoicing, and closure.
          </p>
          <div class="row g-3">
            <div class="col-md-6">
              <div class="p-3 border rounded-3 h-100">
                <div class="fw-semibold mb-1">Company Focus</div>
                <small class="text-muted">Gas Boilers (Phase 1), Heat Pumps, Solar PV, Battery Storage, EV Charging.</small>
              </div>
            </div>
            <div class="col-md-6">
              <div class="p-3 border rounded-3 h-100">
                <div class="fw-semibold mb-1">Operating Model</div>
                <small class="text-muted">Lean, automation-first, no inventory, process-gated completion.</small>
              </div>
            </div>
          </div>
          <div class="d-flex gap-2 mt-4 flex-wrap">
            <RouterLink class="btn btn-primary" to="/leads/create">Create Lead</RouterLink>
            <RouterLink class="btn btn-outline-primary" to="/opportunities">Open Opportunity Hub</RouterLink>
            <RouterLink class="btn btn-outline-dark" to="/workorders">Open Work Orders</RouterLink>
          </div>
        </div>
        <div class="col-lg-5">
          <img :src="heroImage" alt="CRM process overview" class="w-100 h-100 object-fit-cover" />
        </div>
      </div>
    </div>
  </div>

  <div class="d-flex justify-content-between align-items-center mb-3">
    <div class="page-title">
      <span class="page-title-icon"><i class="bi bi-bar-chart"></i></span>
      <div>
        <h4 class="mb-0">Performance Overview</h4>
        <small class="text-muted">Role: {{ user?.role || "-" }} | real-time KPI snapshot</small>
      </div>
    </div>
    <button class="btn btn-outline-secondary btn-sm" @click="loadData">Refresh</button>
  </div>

  <div v-if="error" class="alert alert-danger">{{ error }}</div>
  <div v-if="loading" class="text-muted">Loading dashboard...</div>

  <div v-else class="row g-3">
    <div class="col-12 col-md-6 col-xl-3" v-for="(value, key) in kpis" :key="key">
      <div class="card kpi-card">
        <div class="card-body d-flex justify-content-between align-items-start">
          <div>
            <div class="kpi-title">{{ kpiMeta[key].label }}</div>
            <h2 class="mb-0 mt-2">{{ value }}</h2>
          </div>
          <div class="page-title-icon">
            <i class="bi" :class="kpiMeta[key].icon"></i>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="card mt-4">
    <div class="card-body">
      <div class="crm-section-title">Complete User Journey (Manual Flow)</div>
      <div class="row g-2">
        <div class="col-12 col-md-6 col-xl-4" v-for="step in processSteps" :key="step.label">
          <div class="journey-step h-100">
            <div class="d-flex align-items-start gap-2">
              <span class="page-title-icon"><i class="bi" :class="step.icon"></i></span>
              <div>
                <div class="fw-semibold">{{ step.label }}</div>
                <small class="text-muted">{{ step.detail }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="card mt-4">
    <div class="card-body">
      <div class="crm-section-title">Role-wise End-to-End Flow</div>
      <div class="row g-3">
        <div class="col-12 col-md-6" v-for="item in roleFlows" :key="item.role">
          <div class="role-flow-card h-100">
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="bi fs-5" :class="[item.icon, item.color]"></i>
              <h6 class="mb-0">{{ item.role }}</h6>
            </div>
            <small class="text-muted">{{ item.flow }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
