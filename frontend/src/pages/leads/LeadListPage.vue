<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import PaginationBar from "../../components/PaginationBar.vue";
import { api } from "../../services/api";

const leads = ref([]);
const page = ref(1);
const pageSize = 10;
const loading = ref(true);
const error = ref("");
const filters = reactive({
  status: "",
  source: "",
  search: "",
});
const sourceOptions = ref([]);
const pagedLeads = computed(() => {
  const start = (page.value - 1) * pageSize;
  return leads.value.slice(start, start + pageSize);
});

async function loadLeads() {
  loading.value = true;
  error.value = "";
  try {
    const query = new URLSearchParams();
    if (filters.status) query.set("status", filters.status);
    if (filters.source) query.set("source", filters.source);
    if (filters.search) query.set("search", filters.search);
    leads.value = await api(`/leads?${query.toString()}`);
    page.value = 1;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function loadSources() {
  sourceOptions.value = await api("/lookups/lead-sources");
}

async function disqualify(leadId) {
  await api(`/leads/${leadId}/disqualify`, {
    method: "POST",
    body: JSON.stringify({ reason: "Manually disqualified from list" }),
  });
  await loadLeads();
}

onMounted(async () => {
  await Promise.all([loadLeads(), loadSources()]);
});
watch(leads, () => {
  const totalPages = Math.max(1, Math.ceil(leads.value.length / pageSize));
  if (page.value > totalPages) page.value = totalPages;
});
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="page-title">
          <span class="page-title-icon"><i class="bi bi-person-vcard"></i></span>
          <div>
            <h4 class="mb-0">Leads</h4>
            <small class="text-muted">Capture, triage, dedupe, and convert.</small>
          </div>
        </div>
        <RouterLink class="btn btn-primary btn-sm" to="/leads/create">Create Lead</RouterLink>
      </div>

      <div class="crm-section-title">Filters</div>
      <div class="row g-2 mb-3">
        <div class="col-md-3">
          <select class="form-select" v-model="filters.status">
            <option value="">All Status</option>
            <option>New</option>
            <option>Qualified</option>
            <option>Disqualified</option>
            <option>Potential Duplicate</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select" v-model="filters.source">
            <option value="">All Source</option>
            <option v-for="source in sourceOptions" :key="source.id" :value="source.name">{{ source.name }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <input class="form-control" placeholder="Search name / phone / email" v-model="filters.search" />
        </div>
        <div class="col-md-2">
          <button class="btn btn-outline-secondary w-100" @click="loadLeads">Apply</button>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="loading" class="text-muted">Loading leads...</div>

      <div v-else class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Created</th>
              <th>Name</th>
              <th>Phone / Email</th>
              <th>Source</th>
              <th>Product</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in pagedLeads" :key="lead.id">
              <td>{{ new Date(lead.createdAt).toLocaleDateString() }}</td>
              <td>{{ lead.fullName || lead.companyName || "Unnamed" }}</td>
              <td>{{ lead.phone || "-" }}<br /><small class="text-muted">{{ lead.email || "-" }}</small></td>
              <td>{{ lead.source?.name || "-" }}</td>
              <td>{{ lead.interestedProduct?.name || "Gas Boiler" }}</td>
              <td><span class="status-chip">{{ lead.qualificationStatus || "New" }}</span></td>
              <td class="text-end">
                <RouterLink class="btn btn-sm btn-outline-dark me-1" :to="`/leads/${lead.id}`">Open</RouterLink>
                <RouterLink class="btn btn-sm btn-outline-primary me-1" :to="`/leads/${lead.id}/qualification`">Qualify</RouterLink>
                <button class="btn btn-sm btn-outline-danger" @click="disqualify(lead.id)">Disqualify</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar v-model="page" :total-items="leads.length" :page-size="pageSize" />
    </div>
  </div>
</template>
