<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import PaginationBar from "../../components/PaginationBar.vue";
import { api } from "../../services/api";

const route = useRoute();
const loading = ref(true);
const error = ref("");
const opportunity = ref(null);
const process = ref(null);
const activeTab = ref("summary");
const noteInput = ref("");
const quoteForm = reactive({ quoteName: "Initial Quote" });
const lineForm = reactive({ quoteId: "", description: "", quantity: 1, unitPrice: 0 });
const workOrderForm = reactive({ workOrderTypeId: 0, evidenceRequired: false });
const assessmentPaths = ref([]);
const workOrderTypes = ref([]);
const quotePage = ref(1);
const workOrderPage = ref(1);
const timelinePage = ref(1);
const pageSize = 10;

const blockers = computed(() => process.value?.blockedReasons || []);
const selectedWorkOrderTypeName = computed(
  () => workOrderTypes.value.find((x) => x.id === Number(workOrderForm.workOrderTypeId))?.name || "",
);
const pagedQuotes = computed(() => {
  const start = (quotePage.value - 1) * pageSize;
  return (opportunity.value?.quotes || []).slice(start, start + pageSize);
});
const pagedWorkOrders = computed(() => {
  const start = (workOrderPage.value - 1) * pageSize;
  return (opportunity.value?.workOrders || []).slice(start, start + pageSize);
});
const pagedTimeline = computed(() => {
  const start = (timelinePage.value - 1) * pageSize;
  return (opportunity.value?.timelineNotes || []).slice(start, start + pageSize);
});
const opportunityFlow = computed(() => {
  if (!opportunity.value) return [];

  const hasAcceptedQuote = Boolean(process.value?.hasAcceptedQuote);
  const assessmentPathName = process.value?.assessmentPathName || "Pending";
  const isDeliveryComplete = opportunity.value.deliveryStatus === "Completed";
  const isEvidenceComplete = opportunity.value.evidenceStatus === "Approved";
  const isQaComplete = opportunity.value.qaStatus === "Passed";
  const paymentDone = Boolean(opportunity.value.paymentRequested);
  const invoiceDone = Boolean(opportunity.value.xeroInvoiceNumber);
  const closed = Boolean(opportunity.value.actualCloseDate);

  return [
    { key: "opportunity", label: "Opportunity", meta: "Customer + Property + Product", state: "complete" },
    {
      key: "assessment",
      label: "Assessment",
      meta: assessmentPathName,
      state: assessmentPathName === "Pending" ? "active" : "complete",
    },
    {
      key: "quote",
      label: "Quote",
      meta: hasAcceptedQuote ? "Accepted" : opportunity.value.quoteStatus || "Pending",
      state: hasAcceptedQuote ? "complete" : "active",
    },
    {
      key: "delivery",
      label: "Delivery",
      meta: opportunity.value.deliveryStatus || "Not Started",
      state: isDeliveryComplete ? "complete" : "active",
    },
    {
      key: "evidence",
      label: "Evidence",
      meta: opportunity.value.evidenceStatus || "Pending",
      state: isEvidenceComplete ? "complete" : "blocked",
    },
    {
      key: "qa",
      label: "QA",
      meta: opportunity.value.qaStatus || "Pending",
      state: isQaComplete ? "complete" : "blocked",
    },
    {
      key: "payment",
      label: "Payment",
      meta: paymentDone ? "Requested" : "Not requested",
      state: paymentDone ? "complete" : "blocked",
    },
    {
      key: "invoice",
      label: "Invoice",
      meta: invoiceDone ? opportunity.value.xeroInvoiceNumber : "Missing",
      state: invoiceDone ? "complete" : "blocked",
    },
    {
      key: "close",
      label: "Close",
      meta: closed ? "Closed" : "Open",
      state: closed ? "complete" : "active",
    },
  ];
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [opportunityResult, assessmentResult, woTypesResult] = await Promise.all([
      api(`/opportunities/${route.params.id}`),
      api("/lookups/assessment-paths"),
      api("/lookups/workorder-types"),
    ]);
    opportunity.value = opportunityResult;
    process.value = opportunity.value.process || (await api(`/opportunities/${route.params.id}/process-status`));
    assessmentPaths.value = assessmentResult;
    workOrderTypes.value = woTypesResult;
    if (!workOrderForm.workOrderTypeId) {
      workOrderForm.workOrderTypeId = workOrderTypes.value[0]?.id || 0;
    }
    quotePage.value = 1;
    workOrderPage.value = 1;
    timelinePage.value = 1;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function saveOpportunityPatch(patch) {
  await api(`/opportunities/${route.params.id}`, { method: "PATCH", body: JSON.stringify(patch) });
  await load();
}

async function addTimeline() {
  if (!noteInput.value.trim()) return;
  await api(`/opportunities/${route.params.id}/timeline`, {
    method: "POST",
    body: JSON.stringify({ note: noteInput.value }),
  });
  noteInput.value = "";
  await load();
}

async function createQuote() {
  if (!process.value?.canCreateQuote) return;
  await api(`/opportunities/${route.params.id}/quotes`, {
    method: "POST",
    body: JSON.stringify({ quoteName: quoteForm.quoteName }),
  });
  await load();
}

async function addLine() {
  await api(`/quotes/${lineForm.quoteId}/lines`, {
    method: "POST",
    body: JSON.stringify({
      description: lineForm.description,
      quantity: Number(lineForm.quantity),
      unitPrice: Number(lineForm.unitPrice),
    }),
  });
  lineForm.description = "";
  lineForm.quantity = 1;
  lineForm.unitPrice = 0;
  await load();
}

async function sendQuote(quoteId) {
  await api(`/quotes/${quoteId}`, { method: "PATCH", body: JSON.stringify({ status: "Sent", sentOn: new Date().toISOString() }) });
  await load();
}

async function acceptQuote(quoteId) {
  await api(`/quotes/${quoteId}/accept`, { method: "POST", body: JSON.stringify({ acceptanceMethod: "Email" }) });
  await load();
}

async function createWorkOrder() {
  if (selectedWorkOrderTypeName.value === "Survey" && !process.value?.canCreateSurveyWorkOrder) return;
  if (selectedWorkOrderTypeName.value === "Install" && !process.value?.canCreateInstallWorkOrder) return;
  await api(`/opportunities/${route.params.id}/workorders`, {
    method: "POST",
    body: JSON.stringify({ workOrderTypeId: Number(workOrderForm.workOrderTypeId), evidenceRequired: workOrderForm.evidenceRequired }),
  });
  await load();
}

onMounted(load);
</script>

<template>
  <div v-if="loading" class="text-muted">Loading opportunity...</div>
  <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
  <div v-else-if="opportunity">
    <div class="bpf-container mb-3">
      <div class="crm-section-title mb-2">Opportunity Business Process Flow</div>
      <div class="bpf-track">
        <div
          v-for="step in opportunityFlow"
          :key="step.key"
          class="bpf-stage"
          :class="{
            'is-complete': step.state === 'complete',
            'is-active': step.state === 'active',
            'is-blocked': step.state === 'blocked',
          }"
        >
          <div class="bpf-label">{{ step.label }}</div>
          <div class="bpf-meta">{{ step.meta }}</div>
        </div>
      </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="page-title">
        <span class="page-title-icon"><i class="bi bi-kanban"></i></span>
        <div>
          <h4 class="mb-0">{{ opportunity.opportunityName }}</h4>
          <small class="text-muted">Current stage, next allowed actions, and blockers.</small>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="load">Refresh</button>
        <RouterLink class="btn btn-outline-dark btn-sm" to="/opportunities">Back</RouterLink>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <div class="crm-section-title">Status Snapshot</div>
        <div class="row g-2">
          <div class="col-md-3"><strong>Stage:</strong> {{ opportunity.salesStage }}</div>
          <div class="col-md-3"><strong>Quote:</strong> {{ opportunity.quoteStatus }}</div>
          <div class="col-md-3"><strong>Delivery:</strong> {{ opportunity.deliveryStatus }}</div>
          <div class="col-md-3"><strong>Evidence / QA:</strong> {{ opportunity.evidenceStatus }} / {{ opportunity.qaStatus }}</div>
        </div>
      </div>
    </div>

    <ul class="nav nav-tabs mb-3">
      <li class="nav-item" v-for="tab in ['summary','assessment','quote','delivery','evidence','qa','finance','timeline']" :key="tab">
        <button class="nav-link text-capitalize" :class="{ active: activeTab === tab }" @click="activeTab = tab">{{ tab }}</button>
      </li>
    </ul>

    <div class="tab-pane-card" v-if="activeTab === 'summary'">
      <div class="crm-section-title">Summary</div>
      <h6>Current stage and next actions</h6>
      <div class="row g-2">
        <div class="col-md-6"><strong>Customer:</strong> {{ opportunity.account?.accountName || "-" }}</div>
        <div class="col-md-6"><strong>Primary Contact:</strong> {{ opportunity.primaryContact?.firstName || "-" }}</div>
        <div class="col-md-6"><strong>Property:</strong> {{ opportunity.property?.propertyName || "-" }}</div>
        <div class="col-md-6"><strong>Funding / Product:</strong> {{ opportunity.fundingType?.name || "-" }} / {{ opportunity.productOffering?.name || "-" }}</div>
      </div>
      <div class="mt-3" v-if="blockers.length">
        <div class="alert alert-warning">
          <strong>Blocked reasons:</strong>
          <ul class="mb-0">
            <li v-for="item in blockers" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
      <div class="mt-3" v-if="process?.nextActions?.length">
        <h6 class="mb-1">Next Allowed Actions</h6>
        <div class="d-flex flex-wrap gap-2">
          <span class="badge text-bg-success" v-for="item in process.nextActions" :key="item">{{ item }}</span>
        </div>
      </div>
      <div class="row g-3 mt-1">
        <div class="col-lg-6">
          <div class="border rounded p-3 h-100">
            <div class="crm-section-title">Master Data Driven Fields</div>
            <ul class="mb-0">
              <li>Funding Type: {{ opportunity.fundingType?.name || "-" }}</li>
              <li>Product Offering: {{ opportunity.productOffering?.name || "-" }}</li>
              <li>Assessment Path: {{ process?.assessmentPathName || "-" }}</li>
              <li>Quote/Delivery/Evidence/QA statuses controlled by process.</li>
            </ul>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="border rounded p-3 h-100">
            <div class="crm-section-title">Business Rules (Opportunity)</div>
            <ul class="mb-0">
              <li>Quote can be accepted only when at least one quote line exists.</li>
              <li>Install work order creation depends on quote/survey rules.</li>
              <li>Payment request is blocked until delivery + evidence + QA pass.</li>
              <li>Close action is blocked when mandatory gates are incomplete.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="tab-pane-card" v-else-if="activeTab === 'assessment'">
      <div class="crm-section-title">Assessment</div>
      <h6>Assessment Path</h6>
      <div class="row g-2 align-items-end">
        <div class="col-md-4">
          <label class="form-label">Assessment Path</label>
          <select
            class="form-select"
            :value="opportunity.assessmentPathId || ''"
            @change="saveOpportunityPatch({ assessmentPathId: Number($event.target.value), requiresSurvey: assessmentPaths.find((x) => x.id === Number($event.target.value))?.requiresSurvey || false })"
          >
            <option value="">Select</option>
            <option v-for="path in assessmentPaths" :key="path.id" :value="path.id">{{ path.name }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <div class="alert alert-info mb-0">Requires Survey: <strong>{{ opportunity.requiresSurvey ? "Yes" : "No" }}</strong></div>
        </div>
      </div>
    </div>

    <div class="tab-pane-card" v-else-if="activeTab === 'quote'">
      <div class="crm-section-title">Quote</div>
      <h6>Create / Manage Quotes</h6>
      <div class="d-flex gap-2 mb-3">
        <input class="form-control" v-model="quoteForm.quoteName" />
        <button class="btn btn-primary" :disabled="!process?.canCreateQuote" @click="createQuote">Create Quote</button>
      </div>
      <div class="table-responsive">
        <table class="table">
          <thead><tr><th>Quote</th><th>Status</th><th>Total</th><th></th></tr></thead>
          <tbody>
            <tr v-for="q in pagedQuotes" :key="q.id">
              <td>{{ q.quoteName }}</td>
              <td>{{ q.status }}</td>
              <td>{{ q.totalAmount }}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" @click="sendQuote(q.id)">Mark Sent</button>
                <button class="btn btn-sm btn-outline-success me-1" @click="acceptQuote(q.id)">Accept</button>
                <button class="btn btn-sm btn-outline-dark" @click="lineForm.quoteId = q.id">Add Lines</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar v-model="quotePage" :total-items="opportunity.quotes?.length || 0" :page-size="pageSize" />
      <div class="row g-2 mt-2">
        <div class="col-md-2"><input class="form-control" v-model="lineForm.quoteId" placeholder="Quote ID" /></div>
        <div class="col-md-5"><input class="form-control" v-model="lineForm.description" placeholder="Description" /></div>
        <div class="col-md-2"><input class="form-control" type="number" min="1" v-model="lineForm.quantity" placeholder="Qty" /></div>
        <div class="col-md-2"><input class="form-control" type="number" min="0" v-model="lineForm.unitPrice" placeholder="Unit Price" /></div>
        <div class="col-md-1"><button class="btn btn-outline-dark w-100" @click="addLine">Add</button></div>
      </div>
    </div>

    <div class="tab-pane-card" v-else-if="activeTab === 'delivery'">
      <div class="crm-section-title">Delivery</div>
      <h6>Work Orders</h6>
      <div class="row g-2 align-items-end mb-3">
        <div class="col-md-3">
          <label class="form-label">Type</label>
          <select class="form-select" v-model.number="workOrderForm.workOrderTypeId">
            <option v-for="type in workOrderTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <div class="form-check mt-4">
            <input id="evRequired" class="form-check-input" type="checkbox" v-model="workOrderForm.evidenceRequired" />
            <label class="form-check-label" for="evRequired">Evidence Required</label>
          </div>
        </div>
        <div class="col-md-3">
          <button
            class="btn btn-primary"
            :disabled="
              (selectedWorkOrderTypeName === 'Survey' && !process?.canCreateSurveyWorkOrder) ||
              (selectedWorkOrderTypeName === 'Install' && !process?.canCreateInstallWorkOrder)
            "
            @click="createWorkOrder"
          >
            Create Work Order
          </button>
        </div>
      </div>
      <table class="table">
        <thead><tr><th>ID</th><th>Type</th><th>Status</th><th>Evidence Gate</th><th>QA Gate</th><th></th></tr></thead>
        <tbody>
          <tr v-for="wo in pagedWorkOrders" :key="wo.id">
            <td>{{ wo.id }}</td>
            <td>{{ wo.workOrderType?.name }}</td>
            <td>{{ wo.status }}</td>
            <td>{{ wo.evidenceGateStatus }}</td>
            <td>{{ wo.qaGateStatus }}</td>
            <td class="text-end"><RouterLink class="btn btn-sm btn-outline-dark" :to="`/workorders/${wo.id}`">Open</RouterLink></td>
          </tr>
        </tbody>
      </table>
      <PaginationBar v-model="workOrderPage" :total-items="opportunity.workOrders?.length || 0" :page-size="pageSize" />
    </div>

    <div class="tab-pane-card" v-else-if="activeTab === 'evidence'">
      <div class="crm-section-title">Evidence</div>
      <h6>Evidence</h6>
      <p class="text-muted mb-0">Use Work Order Details to generate checklist, upload evidence, and approve/reject items.</p>
    </div>

    <div class="tab-pane-card" v-else-if="activeTab === 'qa'">
      <div class="crm-section-title">QA</div>
      <h6>QA</h6>
      <p class="text-muted mb-0">Use Work Order Details to generate QA checklist and mark Pass/Fail/N/A.</p>
    </div>

    <div class="tab-pane-card" v-else-if="activeTab === 'finance'">
      <div class="crm-section-title">Finance</div>
      <h6>Finance</h6>
      <RouterLink class="btn btn-outline-dark btn-sm" to="/finance">Open Payments / Invoice Panel</RouterLink>
    </div>

    <div class="tab-pane-card" v-else-if="activeTab === 'timeline'">
      <div class="crm-section-title">Timeline</div>
      <h6>Timeline</h6>
      <div class="d-flex gap-2 mb-2">
        <input class="form-control" v-model="noteInput" placeholder="Add timeline note" />
        <button class="btn btn-outline-primary" @click="addTimeline">Add</button>
      </div>
      <ul class="list-group">
        <li class="list-group-item" v-for="item in pagedTimeline" :key="item.id">
          <div>{{ item.note }}</div>
          <small class="text-muted">{{ new Date(item.createdAt).toLocaleString() }}</small>
        </li>
      </ul>
      <PaginationBar v-model="timelinePage" :total-items="opportunity.timelineNotes?.length || 0" :page-size="pageSize" />
    </div>
  </div>
</template>
