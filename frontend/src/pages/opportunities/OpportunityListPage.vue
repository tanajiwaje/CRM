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
  stage: "",
  deliveryStatus: "",
  search: "",
  readyToClose: false,
});

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    if (filters.stage && row.salesStage !== filters.stage) return false;
    if (filters.deliveryStatus && row.deliveryStatus !== filters.deliveryStatus) return false;
    if (filters.readyToClose && !(row.deliveryStatus === "Completed" && row.evidenceStatus === "Approved" && row.qaStatus === "Passed")) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match = `${row.opportunityName} ${row.account?.accountName || ""} ${row.property?.postcode || ""}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
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
    rows.value = await api("/opportunities");
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
          <span class="page-title-icon"><i class="bi bi-briefcase"></i></span>
          <div>
            <h4 class="mb-0">Opportunity Hub</h4>
            <small class="text-muted">Single control center for quote, delivery, QA, and close.</small>
          </div>
        </div>
        <button class="btn btn-outline-secondary btn-sm" @click="load">Refresh</button>
      </div>
      <div class="crm-section-title">Filters</div>
      <div class="row g-2 mb-3">
        <div class="col-md-2">
          <select class="form-select" v-model="filters.stage">
            <option value="">All Stages</option>
            <option>New</option>
            <option>Quoted</option>
            <option>Accepted</option>
            <option>Delivery</option>
            <option>Closed</option>
          </select>
        </div>
        <div class="col-md-2">
          <select class="form-select" v-model="filters.deliveryStatus">
            <option value="">Delivery Status</option>
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
        </div>
        <div class="col-md-5">
          <input class="form-control" v-model="filters.search" placeholder="Search customer/postcode/opportunity" />
        </div>
        <div class="col-md-3 d-flex align-items-center">
          <input id="readyClose" class="form-check-input me-2" type="checkbox" v-model="filters.readyToClose" />
          <label class="form-check-label" for="readyClose">Ready to Close only</label>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="loading" class="text-muted">Loading opportunities...</div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Opportunity</th>
              <th>Customer</th>
              <th>Property</th>
              <th>Stage</th>
              <th>Quote</th>
              <th>Delivery</th>
              <th>Evidence</th>
              <th>QA</th>
              <th>Finance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.id">
              <td>{{ row.opportunityName }}</td>
              <td>{{ row.account?.accountName || "-" }}</td>
              <td>{{ row.property?.propertyName || "-" }}</td>
              <td><span class="status-chip">{{ row.salesStage || "-" }}</span></td>
              <td><span class="status-chip">{{ row.quoteStatus || "-" }}</span></td>
              <td><span class="status-chip">{{ row.deliveryStatus || "-" }}</span></td>
              <td><span class="status-chip">{{ row.evidenceStatus || "-" }}</span></td>
              <td><span class="status-chip">{{ row.qaStatus || "-" }}</span></td>
              <td>
                <span class="status-chip me-1">{{ row.paymentRequested ? "Payment Requested" : "No Payment" }}</span>
                <span class="status-chip">{{ row.xeroInvoiceNumber ? "Invoice OK" : "Invoice Missing" }}</span>
              </td>
              <td class="text-end">
                <RouterLink class="btn btn-sm btn-outline-dark" :to="`/opportunities/${row.id}`">Open</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar v-model="page" :total-items="filteredRows.length" :page-size="pageSize" />
    </div>
  </div>
</template>
