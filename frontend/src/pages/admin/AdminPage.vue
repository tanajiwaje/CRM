<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import PaginationBar from "../../components/PaginationBar.vue";
import { api } from "../../services/api";

const error = ref("");
const info = ref("");
const loading = ref(false);
const lookups = ref([]);
const selectedLookup = ref("lead-sources");
const lookupRows = ref([]);
const lookupNewName = ref("");
const evidenceRequirements = ref([]);
const qaChecklists = ref([]);
const lookupPage = ref(1);
const evidencePage = ref(1);
const qaPage = ref(1);
const pageSize = 10;

const evidenceForm = reactive({
  name: "",
  requiredCount: 1,
  mandatory: true,
  sortOrder: 0,
});

const qaForm = reactive({
  name: "",
  itemsText: "Safety check",
});
const pagedLookupRows = computed(() => {
  const start = (lookupPage.value - 1) * pageSize;
  return lookupRows.value.slice(start, start + pageSize);
});
const pagedEvidenceRequirements = computed(() => {
  const start = (evidencePage.value - 1) * pageSize;
  return evidenceRequirements.value.slice(start, start + pageSize);
});
const pagedQaChecklists = computed(() => {
  const start = (qaPage.value - 1) * pageSize;
  return qaChecklists.value.slice(start, start + pageSize);
});

lookups.value = [
  { key: "lead-sources", label: "Lead Sources" },
  { key: "funding-types", label: "Funding Types" },
  { key: "product-offerings", label: "Product Offerings" },
  { key: "assessment-paths", label: "Assessment Paths" },
  { key: "workorder-types", label: "Work Order Types" },
  { key: "statuses", label: "Status Master" },
];

async function loadLookups() {
  lookupRows.value = await api(`/admin/lookups/${selectedLookup.value}`);
  lookupPage.value = 1;
}

async function loadAdminData() {
  loading.value = true;
  error.value = "";
  try {
    await loadLookups();
    evidenceRequirements.value = await api("/admin/evidence-requirements");
    qaChecklists.value = await api("/admin/qa-checklists");
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function createLookup() {
  info.value = "";
  error.value = "";
  try {
    if (selectedLookup.value === "statuses") {
      const [category, key, label] = lookupNewName.value.split("|").map((x) => x?.trim());
      await api(`/admin/lookups/${selectedLookup.value}`, {
        method: "POST",
        body: JSON.stringify({ category, key, label }),
      });
    } else {
      await api(`/admin/lookups/${selectedLookup.value}`, {
        method: "POST",
        body: JSON.stringify({ name: lookupNewName.value }),
      });
    }
    lookupNewName.value = "";
    await loadLookups();
    info.value = "Lookup value created.";
  } catch (e) {
    error.value = e.message;
  }
}

async function toggleLookup(row) {
  await api(`/admin/lookups/${selectedLookup.value}/${row.id}`, {
    method: "PATCH",
    body: JSON.stringify({ isActive: !row.isActive }),
  });
  await loadLookups();
}

async function createEvidenceRequirement() {
  await api("/admin/evidence-requirements", {
    method: "POST",
    body: JSON.stringify(evidenceForm),
  });
  evidenceForm.name = "";
  evidenceRequirements.value = await api("/admin/evidence-requirements");
  evidencePage.value = 1;
}

async function createQaChecklist() {
  const items = qaForm.itemsText
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((itemText, index) => ({ itemText, sortOrder: index, mandatory: true }));

  await api("/admin/qa-checklists", {
    method: "POST",
    body: JSON.stringify({
      name: qaForm.name,
      items,
    }),
  });
  qaForm.name = "";
  qaChecklists.value = await api("/admin/qa-checklists");
  qaPage.value = 1;
}

onMounted(loadAdminData);
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="page-title mb-2">
        <span class="page-title-icon"><i class="bi bi-gear"></i></span>
        <h4 class="mb-0">Admin - Master Data & Templates</h4>
      </div>
      <p class="text-muted">Manage lookups, evidence requirements, QA templates, and operational controls.</p>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="info" class="alert alert-success">{{ info }}</div>
      <div v-if="loading" class="text-muted">Loading admin data...</div>

      <div class="border rounded p-3 mb-3">
        <div class="crm-section-title">Master Data Governance & Business Rules</div>
        <ul class="mb-0">
          <li>Business-changeable values must be managed here (not hard-coded in UI logic).</li>
          <li>Deactivate values instead of deleting to keep reporting and audit consistency.</li>
          <li>Process gates rely on evidence requirements and QA templates configured here.</li>
          <li>Any new product/funding flow should start with master data updates.</li>
        </ul>
      </div>

      <div v-if="!loading" class="row g-3">
        <div class="col-lg-5">
          <div class="border rounded p-3 h-100">
            <div class="crm-section-title">Master Data</div>
            <h6>Master Data CRUD</h6>
            <select class="form-select mb-2" v-model="selectedLookup" @change="loadLookups">
              <option v-for="item in lookups" :key="item.key" :value="item.key">{{ item.label }}</option>
            </select>
            <div class="input-group mb-2">
              <input
                class="form-control"
                v-model="lookupNewName"
                :placeholder="selectedLookup === 'statuses' ? 'category|key|label' : 'name'"
              />
              <button class="btn btn-primary" @click="createLookup">Add</button>
            </div>
            <div class="table-responsive" style="max-height: 280px">
              <table class="table table-sm">
                <thead><tr><th>ID</th><th>Value</th><th>Active</th><th></th></tr></thead>
                <tbody>
                  <tr v-for="row in pagedLookupRows" :key="row.id">
                    <td>{{ row.id }}</td>
                    <td>{{ row.label || row.name || row.key }}</td>
                    <td>{{ row.isActive ? "Yes" : "No" }}</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-secondary" @click="toggleLookup(row)">
                        {{ row.isActive ? "Disable" : "Enable" }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <PaginationBar v-model="lookupPage" :total-items="lookupRows.length" :page-size="pageSize" />
          </div>
        </div>

        <div class="col-lg-7">
          <div class="border rounded p-3 mb-3">
            <div class="crm-section-title">Evidence Templates</div>
            <h6>Evidence Requirement Templates</h6>
            <div class="row g-2 mb-2">
              <div class="col-md-4"><input class="form-control" placeholder="Name" v-model="evidenceForm.name" /></div>
              <div class="col-md-2"><input class="form-control" type="number" min="1" v-model.number="evidenceForm.requiredCount" /></div>
              <div class="col-md-2"><input class="form-control" type="number" min="0" v-model.number="evidenceForm.sortOrder" /></div>
              <div class="col-md-2 form-check mt-2 ms-2">
                <input id="mandatory" class="form-check-input" type="checkbox" v-model="evidenceForm.mandatory" />
                <label class="form-check-label" for="mandatory">Mandatory</label>
              </div>
              <div class="col-md-2"><button class="btn btn-outline-primary w-100" @click="createEvidenceRequirement">Add</button></div>
            </div>
            <ul class="list-group">
              <li class="list-group-item" v-for="item in pagedEvidenceRequirements" :key="item.id">
                {{ item.name }} (count {{ item.requiredCount }}, mandatory {{ item.mandatory ? "Yes" : "No" }})
              </li>
            </ul>
            <PaginationBar v-model="evidencePage" :total-items="evidenceRequirements.length" :page-size="pageSize" />
          </div>

          <div class="border rounded p-3">
            <div class="crm-section-title">QA Templates</div>
            <h6>QA Checklist Templates</h6>
            <div class="row g-2 mb-2">
              <div class="col-md-4"><input class="form-control" placeholder="Checklist name" v-model="qaForm.name" /></div>
              <div class="col-md-6"><textarea class="form-control" rows="2" placeholder="Checklist lines (one per line)" v-model="qaForm.itemsText"></textarea></div>
              <div class="col-md-2"><button class="btn btn-outline-dark w-100" @click="createQaChecklist">Add</button></div>
            </div>
            <ul class="list-group">
              <li class="list-group-item" v-for="item in pagedQaChecklists" :key="item.id">
                {{ item.name }} - {{ item.items?.length || 0 }} items
              </li>
            </ul>
            <PaginationBar v-model="qaPage" :total-items="qaChecklists.length" :page-size="pageSize" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
