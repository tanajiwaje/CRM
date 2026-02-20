<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "../../services/api";

const route = useRoute();
const row = ref(null);
const error = ref("");
const patchForm = reactive({
  status: "In Progress",
  resolutionType: "",
  outcomeNotes: "",
  remedialWorkOrderId: "",
});
const caseFlow = computed(() => {
  if (!row.value) return [];

  const status = row.value.status || "Open";
  const hasRemedial = Boolean(row.value.remedialWorkOrderId);
  const isResolved = ["Resolved", "Closed"].includes(status);

  return [
    { key: "intake", label: "Intake", meta: "Complaint logged", state: "complete" },
    {
      key: "triage",
      label: "Triage",
      meta: hasRemedial ? "Remedial WO linked" : "Office handling",
      state: ["In Progress", "Resolved", "Closed"].includes(status) ? "complete" : "active",
    },
    {
      key: "investigation",
      label: "Investigation",
      meta: status,
      state: status === "In Progress" ? "active" : isResolved ? "complete" : "blocked",
    },
    {
      key: "resolution",
      label: "Resolution",
      meta: row.value.resolutionType || "Pending",
      state: isResolved ? "complete" : "blocked",
    },
    {
      key: "closure",
      label: "Closure",
      meta: status === "Closed" ? "Closed" : "Open",
      state: status === "Closed" ? "complete" : "blocked",
    },
  ];
});

async function load() {
  try {
    row.value = await api(`/cases/${route.params.id}`);
  } catch (e) {
    error.value = e.message;
  }
}

async function save() {
  await api(`/cases/${route.params.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: patchForm.status,
      resolutionType: patchForm.resolutionType || undefined,
      outcomeNotes: patchForm.outcomeNotes || undefined,
      remedialWorkOrderId: patchForm.remedialWorkOrderId ? Number(patchForm.remedialWorkOrderId) : undefined,
    }),
  });
  await load();
}

onMounted(load);
</script>

<template>
  <div v-if="error" class="alert alert-danger">{{ error }}</div>
  <div v-else-if="row" class="card">
    <div class="card-body">
      <div class="bpf-container mb-3">
        <div class="crm-section-title mb-2">Case Business Process Flow</div>
        <div class="bpf-track">
          <div
            v-for="step in caseFlow"
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
      <div class="page-title mb-3">
        <span class="page-title-icon"><i class="bi bi-file-earmark-medical"></i></span>
        <h4 class="mb-0">Case #{{ row.id }} - {{ row.title }}</h4>
      </div>
      <p class="mb-1"><strong>Customer:</strong> {{ row.account?.accountName }}</p>
      <p class="mb-1"><strong>Property:</strong> {{ row.property?.propertyName }}</p>
      <p class="mb-1"><strong>Related Opportunity:</strong> {{ row.relatedOpportunity?.opportunityName }}</p>
      <p class="mb-3"><strong>Current Status:</strong> {{ row.status }}</p>

      <div class="row g-2">
        <div class="col-md-3">
          <label class="form-label">Status</label>
          <select class="form-select" v-model="patchForm.status">
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Resolution Type</label>
          <input class="form-control" v-model="patchForm.resolutionType" />
        </div>
        <div class="col-md-3">
          <label class="form-label">Remedial Work Order ID</label>
          <input class="form-control" v-model="patchForm.remedialWorkOrderId" />
        </div>
        <div class="col-md-12">
          <label class="form-label">Outcome Notes</label>
          <textarea class="form-control" rows="3" v-model="patchForm.outcomeNotes"></textarea>
        </div>
      </div>
      <button class="btn btn-primary mt-3" @click="save">Save Case</button>
    </div>
  </div>
</template>
