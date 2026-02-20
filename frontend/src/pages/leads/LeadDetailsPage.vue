<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { api } from "../../services/api";

const route = useRoute();
const lead = ref(null);
const loading = ref(true);
const error = ref("");
const note = ref("");
const leadFlow = computed(() => {
  const status = lead.value?.qualificationStatus || "New";
  const duplicate = lead.value?.duplicateStatus && lead.value?.duplicateStatus !== "Unique";
  return [
    { key: "capture", label: "Capture", meta: "Lead details recorded", state: "complete" },
    {
      key: "review",
      label: "Review / Dedupe",
      meta: duplicate ? "Duplicate warning found" : "No duplicate warning",
      state: duplicate ? "blocked" : ["Potential Duplicate", "Duplicate"].includes(status) ? "blocked" : "active",
    },
    {
      key: "qualification",
      label: "Qualification",
      meta: "Qualify or disqualify",
      state: status === "Qualified" || status === "Disqualified" ? "complete" : "active",
    },
    {
      key: "conversion",
      label: "Conversion",
      meta: status === "Qualified" ? "Converted to opportunity" : "Pending",
      state: status === "Qualified" ? "complete" : "blocked",
    },
  ];
});

async function loadLead() {
  loading.value = true;
  error.value = "";
  try {
    lead.value = await api(`/leads/${route.params.id}`);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function runDedupe() {
  await api(`/leads/${route.params.id}/dedupe-check`, { method: "POST" });
  await loadLead();
}

async function saveNote() {
  await api(`/leads/${route.params.id}`, {
    method: "PATCH",
    body: JSON.stringify({ notes: note.value }),
  });
  await loadLead();
}

onMounted(loadLead);
</script>

<template>
  <div v-if="loading" class="text-muted">Loading lead...</div>
  <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
  <div v-else-if="lead" class="row g-3">
    <div class="col-12">
      <div class="bpf-container">
        <div class="crm-section-title mb-2">Lead Business Process Flow</div>
        <div class="bpf-track">
          <div
            v-for="step in leadFlow"
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
    </div>

    <div class="col-lg-8">
      <div class="card">
        <div class="card-body">
          <div class="page-title mb-3">
            <span class="page-title-icon"><i class="bi bi-person-lines-fill"></i></span>
            <h4 class="mb-0">Lead #{{ lead.id }} - {{ lead.fullName || lead.companyName }}</h4>
          </div>
          <div class="row g-2">
            <div class="col-md-6"><strong>Phone:</strong> {{ lead.phone || "-" }}</div>
            <div class="col-md-6"><strong>Email:</strong> {{ lead.email || "-" }}</div>
            <div class="col-md-6"><strong>Source:</strong> {{ lead.source?.name || "-" }}</div>
            <div class="col-md-6"><strong>Status:</strong> {{ lead.qualificationStatus || "-" }}</div>
            <div class="col-md-6"><strong>Funding:</strong> {{ lead.fundingType?.name || "-" }}</div>
            <div class="col-md-6"><strong>Product:</strong> {{ lead.interestedProduct?.name || "-" }}</div>
            <div class="col-12"><strong>Address:</strong> {{ lead.propertyAddressLine1 || "-" }}, {{ lead.propertyCity || "-" }}, {{ lead.propertyPostcode || "-" }}</div>
          </div>
        </div>
      </div>

      <div class="card mt-3">
        <div class="card-body">
          <div class="crm-section-title">Business Rules (Lead)</div>
          <ul class="mb-0">
            <li>Phone or email is required to create/qualify lead.</li>
            <li>Dedupe check compares lead and contact records.</li>
            <li>Qualified lead creates Account + Contact + Property + Opportunity.</li>
            <li>Disqualified leads stay for reporting and audit history.</li>
          </ul>
        </div>
      </div>

      <div class="card mt-3">
        <div class="card-body">
          <h6>Timeline / Internal Notes</h6>
          <textarea class="form-control mb-2" rows="3" v-model="note" :placeholder="lead.notes || 'Add internal note'"></textarea>
          <button class="btn btn-outline-primary btn-sm" @click="saveNote">Save Note</button>
        </div>
      </div>
    </div>

    <div class="col-lg-4">
      <div class="card">
        <div class="card-body">
          <h6>Actions</h6>
          <div class="d-grid gap-2">
            <button class="btn btn-outline-secondary" @click="runDedupe">Run Dedupe Check</button>
            <RouterLink class="btn btn-primary" :to="`/leads/${lead.id}/qualification`">Qualify Lead</RouterLink>
            <RouterLink class="btn btn-outline-dark" to="/leads">Back to List</RouterLink>
          </div>
          <div class="mt-3" v-if="lead.duplicateStatus && lead.duplicateStatus !== 'Unique'">
            <div class="alert alert-warning mb-0">
              Duplicate warning: {{ lead.duplicateStatus }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
