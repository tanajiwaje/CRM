<script setup>
import { computed, ref } from "vue";
import PaginationBar from "../../components/PaginationBar.vue";
import { api } from "../../services/api";

const workOrderId = ref("");
const evidence = ref([]);
const qa = ref([]);
const error = ref("");
const evidencePage = ref(1);
const qaPage = ref(1);
const pageSize = 10;
const pagedEvidence = computed(() => {
  const start = (evidencePage.value - 1) * pageSize;
  return evidence.value.slice(start, start + pageSize);
});
const pagedQa = computed(() => {
  const start = (qaPage.value - 1) * pageSize;
  return qa.value.slice(start, start + pageSize);
});

async function load() {
  error.value = "";
  try {
    evidence.value = await api(`/workorders/${workOrderId.value}/evidence`);
    qa.value = await api(`/workorders/${workOrderId.value}/qa`);
    evidencePage.value = 1;
    qaPage.value = 1;
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="page-title mb-3">
        <span class="page-title-icon"><i class="bi bi-patch-check"></i></span>
        <div>
          <h4 class="mb-0">Evidence / QA Panel</h4>
          <small class="text-muted">Quick review by work order.</small>
        </div>
      </div>
      <div class="row g-2 mb-3">
        <div class="col-md-3">
          <input class="form-control" placeholder="Work Order ID" v-model="workOrderId" />
        </div>
        <div class="col-md-2">
          <button class="btn btn-outline-dark w-100" @click="load">Load</button>
        </div>
      </div>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div class="row g-3">
        <div class="col-md-6">
          <h6>Evidence Items</h6>
          <ul class="list-group">
            <li class="list-group-item" v-for="item in pagedEvidence" :key="item.id">
              {{ item.name }} - <strong>{{ item.status }}</strong>
            </li>
          </ul>
          <PaginationBar v-model="evidencePage" :total-items="evidence.length" :page-size="pageSize" />
        </div>
        <div class="col-md-6">
          <h6>QA Results</h6>
          <ul class="list-group">
            <li class="list-group-item" v-for="item in pagedQa" :key="item.id">
              {{ item.checklistItem?.itemText }} - <strong>{{ item.result }}</strong>
            </li>
          </ul>
          <PaginationBar v-model="qaPage" :total-items="qa.length" :page-size="pageSize" />
        </div>
      </div>
    </div>
  </div>
</template>
