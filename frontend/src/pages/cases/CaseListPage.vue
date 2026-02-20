<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import PaginationBar from "../../components/PaginationBar.vue";
import { api } from "../../services/api";

const rows = ref([]);
const page = ref(1);
const pageSize = 10;
const error = ref("");
const form = reactive({
  title: "",
  accountId: "",
  propertyId: "",
  relatedOpportunityId: "",
  priority: "Medium",
});
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize;
  return rows.value.slice(start, start + pageSize);
});

async function load() {
  try {
    rows.value = await api("/cases");
    page.value = 1;
  } catch (e) {
    error.value = e.message;
  }
}

async function createCase() {
  error.value = "";
  try {
    await api("/cases", {
      method: "POST",
      body: JSON.stringify({
        title: form.title,
        accountId: Number(form.accountId),
        propertyId: Number(form.propertyId),
        relatedOpportunityId: Number(form.relatedOpportunityId),
        priority: form.priority,
      }),
    });
    form.title = "";
    await load();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(load);
watch(rows, () => {
  const totalPages = Math.max(1, Math.ceil(rows.value.length / pageSize));
  if (page.value > totalPages) page.value = totalPages;
});
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="page-title mb-3">
        <span class="page-title-icon"><i class="bi bi-exclamation-octagon"></i></span>
        <div>
          <h4 class="mb-0">Cases</h4>
          <small class="text-muted">Complaint intake, tracking, and resolution workflow.</small>
        </div>
      </div>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <div class="crm-section-title">Create Complaint Case</div>
      <div class="row g-2 mb-3">
        <div class="col-md-3"><input class="form-control" placeholder="Case title" v-model="form.title" /></div>
        <div class="col-md-2"><input class="form-control" placeholder="Account ID" v-model="form.accountId" /></div>
        <div class="col-md-2"><input class="form-control" placeholder="Property ID" v-model="form.propertyId" /></div>
        <div class="col-md-2"><input class="form-control" placeholder="Opportunity ID" v-model="form.relatedOpportunityId" /></div>
        <div class="col-md-2">
          <select class="form-select" v-model="form.priority">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
        <div class="col-md-1"><button class="btn btn-primary w-100" @click="createCase">Create</button></div>
      </div>

      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>ID</th><th>Title</th><th>Customer</th><th>Property</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr v-for="item in pagedRows" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.title }}</td>
              <td>{{ item.account?.accountName || "-" }}</td>
              <td>{{ item.property?.propertyName || "-" }}</td>
              <td>{{ item.status }}</td>
              <td class="text-end"><RouterLink class="btn btn-sm btn-outline-dark" :to="`/cases/${item.id}`">Open</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar v-model="page" :total-items="rows.length" :page-size="pageSize" />
    </div>
  </div>
</template>
