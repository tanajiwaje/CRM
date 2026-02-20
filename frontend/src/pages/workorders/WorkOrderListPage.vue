<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import PaginationBar from "../../components/PaginationBar.vue";
import { api } from "../../services/api";

const rows = ref([]);
const page = ref(1);
const pageSize = 10;
const loading = ref(true);
const error = ref("");
const filters = reactive({
  type: "",
  status: "",
});

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    if (filters.type && row.workOrderType?.name !== filters.type) return false;
    if (filters.status && row.status !== filters.status) return false;
    return true;
  }),
);
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredRows.value.slice(start, start + pageSize);
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    rows.value = await api("/workorders");
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(filteredRows, () => {
  const totalPages = Math.max(1, Math.ceil(filteredRows.value.length / pageSize));
  if (page.value > totalPages) page.value = totalPages;
});
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="page-title">
          <span class="page-title-icon"><i class="bi bi-tools"></i></span>
          <div>
            <h4 class="mb-0">Work Orders</h4>
            <small class="text-muted">Survey, install, and remedial execution queue.</small>
          </div>
        </div>
        <button class="btn btn-outline-secondary btn-sm" @click="load">Refresh</button>
      </div>

      <div class="crm-section-title">Filters</div>
      <div class="row g-2 mb-3">
        <div class="col-md-3">
          <select class="form-select" v-model="filters.type">
            <option value="">All Types</option>
            <option>Survey</option>
            <option>Install</option>
            <option>Remedial</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select" v-model="filters.status">
            <option value="">All Status</option>
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="loading" class="text-muted">Loading work orders...</div>
      <div v-else class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>WO</th>
              <th>Type</th>
              <th>Customer / Property</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Evidence Gate</th>
              <th>QA Gate</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.id">
              <td>#{{ row.id }}</td>
              <td>{{ row.workOrderType?.name }}</td>
              <td>{{ row.opportunity?.opportunityName }}<br /><small class="text-muted">{{ row.property?.propertyName }}</small></td>
              <td>{{ row.scheduledStart ? new Date(row.scheduledStart).toLocaleString() : "-" }}</td>
              <td><span class="status-chip">{{ row.status }}</span></td>
              <td><span class="status-chip">{{ row.evidenceGateStatus }}</span></td>
              <td><span class="status-chip">{{ row.qaGateStatus }}</span></td>
              <td class="text-end"><RouterLink class="btn btn-sm btn-outline-dark" :to="`/workorders/${row.id}`">Open</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar v-model="page" :total-items="filteredRows.length" :page-size="pageSize" />
    </div>
  </div>
</template>
