<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import PaginationBar from "../../components/PaginationBar.vue";
import { API_BASE_URL, api } from "../../services/api";

const route = useRoute();
const row = ref(null);
const evidenceItems = ref([]);
const qaResults = ref([]);
const loading = ref(true);
const error = ref("");
const info = ref("");
const scheduleForm = reactive({ scheduledStart: "", scheduledEnd: "" });
const statusForm = reactive({ status: "In Progress" });
const uploadingEvidenceId = ref(null);
const evidencePage = ref(1);
const qaPage = ref(1);
const pageSize = 10;
const pagedEvidenceItems = computed(() => {
  const start = (evidencePage.value - 1) * pageSize;
  return evidenceItems.value.slice(start, start + pageSize);
});
const pagedQaResults = computed(() => {
  const start = (qaPage.value - 1) * pageSize;
  return qaResults.value.slice(start, start + pageSize);
});
const workOrderFlow = computed(() => {
  if (!row.value) return [];

  const scheduled = Boolean(row.value.scheduledStart && row.value.scheduledEnd);
  const completed = row.value.status === "Completed";
  const evidenceDone = ["Complete", "Not Required"].includes(row.value.evidenceGateStatus);
  const qaDone = ["Complete", "Not Required"].includes(row.value.qaGateStatus);
  const readyToClose = completed && evidenceDone && qaDone;

  return [
    { key: "created", label: "Created", meta: row.value.workOrderType?.name || "Work order", state: "complete" },
    { key: "schedule", label: "Schedule", meta: scheduled ? "Scheduled" : "Pending", state: scheduled ? "complete" : "active" },
    {
      key: "execution",
      label: "Execution",
      meta: row.value.status || "Not Started",
      state: completed ? "complete" : "active",
    },
    {
      key: "evidence",
      label: "Evidence Gate",
      meta: row.value.evidenceGateStatus || "Pending",
      state: evidenceDone ? "complete" : "blocked",
    },
    {
      key: "qa",
      label: "QA Gate",
      meta: row.value.qaGateStatus || "Pending",
      state: qaDone ? "complete" : "blocked",
    },
    {
      key: "completion",
      label: "Completion",
      meta: readyToClose ? "Ready" : "Blocked",
      state: readyToClose ? "complete" : "blocked",
    },
  ];
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    row.value = await api(`/workorders/${route.params.id}`);
    evidenceItems.value = await api(`/workorders/${route.params.id}/evidence`);
    qaResults.value = await api(`/workorders/${route.params.id}/qa`);
    evidencePage.value = 1;
    qaPage.value = 1;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function saveSchedule() {
  if (!scheduleForm.scheduledStart || !scheduleForm.scheduledEnd) {
    error.value = "Schedule start and end are required.";
    return;
  }
  if (new Date(scheduleForm.scheduledEnd) <= new Date(scheduleForm.scheduledStart)) {
    error.value = "Schedule end must be after start.";
    return;
  }
  await api(`/workorders/${route.params.id}/schedule`, {
    method: "PATCH",
    body: JSON.stringify(scheduleForm),
  });
  info.value = "Schedule saved.";
  await load();
}

async function saveStatus() {
  await api(`/workorders/${route.params.id}/status`, {
    method: "PATCH",
    body: JSON.stringify(statusForm),
  });
  info.value = "Status updated.";
  await load();
}

async function generateEvidence() {
  await api(`/workorders/${route.params.id}/evidence/generate`, { method: "POST" });
  await load();
}

async function generateQa() {
  await api(`/workorders/${route.params.id}/qa/generate`, { method: "POST" });
  await load();
}

async function markEvidenceApproved(id) {
  await api(`/evidence/items/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "Approved" }),
  });
  await load();
}

function getEvidenceUrl(filePath) {
  if (!filePath) return "";
  if (filePath.startsWith("http")) return filePath;
  return `${API_BASE_URL}${filePath}`;
}

async function uploadEvidence(item, event) {
  const file = event.target.files?.[0];
  if (!file) return;
  error.value = "";
  info.value = "";
  try {
    uploadingEvidenceId.value = item.id;
    const formData = new FormData();
    formData.append("file", file);
    await api(`/evidence/items/${item.id}/upload`, {
      method: "POST",
      body: formData,
    });
    info.value = "Evidence image uploaded.";
    await load();
  } catch (e) {
    error.value = e.message;
  } finally {
    uploadingEvidenceId.value = null;
    event.target.value = "";
  }
}

async function markQaPass(id) {
  await api(`/qa/results/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ result: "Pass" }),
  });
  await load();
}

onMounted(load);
</script>

<template>
  <div v-if="loading" class="text-muted">Loading work order...</div>
  <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
  <div v-else-if="row" class="row g-3">
    <div class="col-12">
      <div class="bpf-container">
        <div class="crm-section-title mb-2">Work Order Business Process Flow</div>
        <div class="bpf-track">
          <div
            v-for="step in workOrderFlow"
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
    <div class="col-12" v-if="info">
      <div class="alert alert-success mb-0">{{ info }}</div>
    </div>
    <div class="col-lg-4">
      <div class="card">
        <div class="card-body">
          <div class="page-title mb-3">
            <span class="page-title-icon"><i class="bi bi-wrench-adjustable"></i></span>
            <h5 class="mb-0">Work Order #{{ row.id }}</h5>
          </div>
          <p class="mb-1"><strong>Type:</strong> {{ row.workOrderType?.name }}</p>
          <p class="mb-1"><strong>Status:</strong> {{ row.status }}</p>
          <p class="mb-1"><strong>Evidence Gate:</strong> {{ row.evidenceGateStatus }}</p>
          <p class="mb-1"><strong>QA Gate:</strong> {{ row.qaGateStatus }}</p>
          <p class="mb-0"><strong>Opportunity:</strong> {{ row.opportunity?.opportunityName }}</p>
        </div>
      </div>

      <div class="card mt-3">
        <div class="card-body">
          <div class="crm-section-title">Scheduling</div>
          <h6>Schedule</h6>
          <input class="form-control mb-2" type="datetime-local" v-model="scheduleForm.scheduledStart" />
          <input class="form-control mb-2" type="datetime-local" v-model="scheduleForm.scheduledEnd" />
          <button class="btn btn-outline-primary btn-sm w-100" @click="saveSchedule">Save Schedule</button>
        </div>
      </div>

      <div class="card mt-3">
        <div class="card-body">
          <div class="crm-section-title">Progress</div>
          <h6>Status</h6>
          <select class="form-select mb-2" v-model="statusForm.status">
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <button class="btn btn-outline-dark btn-sm w-100" @click="saveStatus">Update Status</button>
        </div>
      </div>
    </div>

    <div class="col-lg-8">
      <div class="card mb-3">
        <div class="card-body">
          <div class="crm-section-title">Evidence Gate</div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Evidence Checklist</h6>
            <button class="btn btn-sm btn-outline-primary" @click="generateEvidence">Generate</button>
          </div>
          <p class="small text-muted mb-2">
            Upload real images per evidence line. You can upload multiple images by adding multiple evidence items/templates.
          </p>
          <table class="table table-sm">
            <thead><tr><th>Item</th><th>Status</th><th>Image</th><th></th></tr></thead>
            <tbody>
              <tr v-for="item in pagedEvidenceItems" :key="item.id">
                <td>
                  {{ item.name }}
                  <div>
                    <small class="text-muted">
                      {{ item.requirement?.mandatory ? "Required" : "Optional" }}
                    </small>
                  </div>
                </td>
                <td>{{ item.status }}</td>
                <td>
                  <div v-if="item.filePath" class="d-flex align-items-center gap-2">
                    <img :src="getEvidenceUrl(item.filePath)" alt="Evidence" style="width: 54px; height: 54px; object-fit: cover; border-radius: 8px; border: 1px solid #dbe3ef;" />
                    <a :href="getEvidenceUrl(item.filePath)" target="_blank" class="btn btn-sm btn-outline-secondary">View</a>
                  </div>
                  <div v-else class="small text-muted">No image uploaded</div>
                </td>
                <td class="text-end">
                  <label class="btn btn-sm btn-outline-primary me-2 mb-0">
                    {{ uploadingEvidenceId === item.id ? "Uploading..." : "Upload Image" }}
                    <input
                      type="file"
                      accept="image/*"
                      class="d-none"
                      :disabled="uploadingEvidenceId === item.id"
                      @change="uploadEvidence(item, $event)"
                    />
                  </label>
                  <button class="btn btn-sm btn-outline-success" @click="markEvidenceApproved(item.id)">Approve</button>
                </td>
              </tr>
            </tbody>
          </table>
          <PaginationBar v-model="evidencePage" :total-items="evidenceItems.length" :page-size="pageSize" />
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="crm-section-title">QA Gate</div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">QA Checklist</h6>
            <button class="btn btn-sm btn-outline-primary" @click="generateQa">Generate</button>
          </div>
          <table class="table table-sm">
            <thead><tr><th>Item</th><th>Result</th><th></th></tr></thead>
            <tbody>
              <tr v-for="item in pagedQaResults" :key="item.id">
                <td>{{ item.checklistItem?.itemText }}</td>
                <td>{{ item.result }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-success" @click="markQaPass(item.id)">Pass</button>
                </td>
              </tr>
            </tbody>
          </table>
          <PaginationBar v-model="qaPage" :total-items="qaResults.length" :page-size="pageSize" />
        </div>
      </div>
    </div>
  </div>
</template>
