<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../../services/api";

const router = useRouter();
const saving = ref(false);
const error = ref("");
const info = ref("");
const validationErrors = reactive({
  fullName: "",
  phone: "",
  email: "",
});
const leadSources = ref([]);
const leadChannels = ref([]);
const productOfferings = ref([]);
const fundingTypes = ref([]);
const form = reactive({
  sourceId: undefined,
  createdFromId: undefined,
  fullName: "",
  phone: "",
  email: "",
  interestedProductId: undefined,
  fundingTypeId: undefined,
  propertyAddressLine1: "",
  propertyCity: "",
  propertyPostcode: "",
  notes: "",
});

async function loadLookups() {
  const [sources, channels, products, fundings] = await Promise.all([
    api("/lookups/lead-sources"),
    api("/lookups/lead-channels"),
    api("/lookups/product-offerings"),
    api("/lookups/funding-types"),
  ]);
  leadSources.value = sources;
  leadChannels.value = channels;
  productOfferings.value = products;
  fundingTypes.value = fundings;
  form.sourceId = form.sourceId ?? leadSources.value[0]?.id;
  form.createdFromId = form.createdFromId ?? leadChannels.value[0]?.id;
  form.interestedProductId = form.interestedProductId ?? productOfferings.value[0]?.id;
  form.fundingTypeId = form.fundingTypeId ?? fundingTypes.value[0]?.id;
}

function resetForm() {
  form.fullName = "";
  form.phone = "";
  form.email = "";
  form.propertyAddressLine1 = "";
  form.propertyCity = "";
  form.propertyPostcode = "";
  form.notes = "";
}

function validateForm() {
  validationErrors.fullName = "";
  validationErrors.phone = "";
  validationErrors.email = "";

  if (!form.fullName.trim()) {
    validationErrors.fullName = "Customer name is required.";
  }
  if (!form.phone && !form.email) {
    validationErrors.phone = "Phone or email is required.";
    validationErrors.email = "Phone or email is required.";
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    validationErrors.email = "Enter a valid email address.";
  }
  if (form.phone && form.phone.length < 5) {
    validationErrors.phone = "Phone must be at least 5 digits.";
  }

  return !validationErrors.fullName && !validationErrors.phone && !validationErrors.email;
}

async function saveLead(next = "view") {
  error.value = "";
  info.value = "";
  if (!validateForm()) {
    error.value = "Please fix validation errors.";
    return;
  }
  saving.value = true;
  try {
    const lead = await api("/leads", {
      method: "POST",
      body: JSON.stringify(form),
    });
    info.value = `Lead #${lead.id} created.`;
    if (next === "view") {
      router.push(`/leads/${lead.id}`);
    } else {
      resetForm();
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}

onMounted(loadLookups);
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="page-title mb-3">
        <span class="page-title-icon"><i class="bi bi-person-plus"></i></span>
        <div>
          <h4 class="mb-0">Create Lead</h4>
          <small class="text-muted">Capture quickly, then qualify to Account + Contact + Property + Opportunity.</small>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="info" class="alert alert-success">{{ info }}</div>

      <div class="crm-section-title">Lead Details</div>
      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label">Lead Source</label>
          <select class="form-select" v-model.number="form.sourceId">
            <option v-for="item in leadSources" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Lead Channel</label>
          <select class="form-select" v-model.number="form.createdFromId">
            <option v-for="item in leadChannels" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Customer Name</label>
          <input class="form-control" :class="{ 'is-invalid': validationErrors.fullName }" v-model="form.fullName" />
          <div class="invalid-feedback">{{ validationErrors.fullName }}</div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Phone</label>
          <input class="form-control" :class="{ 'is-invalid': validationErrors.phone }" v-model="form.phone" />
          <div class="invalid-feedback">{{ validationErrors.phone }}</div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Email</label>
          <input class="form-control" :class="{ 'is-invalid': validationErrors.email }" v-model="form.email" type="email" />
          <div class="invalid-feedback">{{ validationErrors.email }}</div>
        </div>
        <div class="col-md-2">
          <label class="form-label">Product</label>
          <select class="form-select" v-model.number="form.interestedProductId">
            <option v-for="item in productOfferings" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Funding</label>
          <select class="form-select" v-model.number="form.fundingTypeId">
            <option v-for="item in fundingTypes" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Address Line 1</label>
          <input class="form-control" v-model="form.propertyAddressLine1" />
        </div>
        <div class="col-md-3">
          <label class="form-label">City</label>
          <input class="form-control" v-model="form.propertyCity" />
        </div>
        <div class="col-md-3">
          <label class="form-label">Postcode</label>
          <input class="form-control" v-model="form.propertyPostcode" />
        </div>
        <div class="col-12">
          <label class="form-label">Notes</label>
          <textarea class="form-control" rows="3" v-model="form.notes"></textarea>
        </div>
      </div>

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-primary" @click="saveLead('view')" :disabled="saving">Save & View Lead</button>
        <button class="btn btn-outline-primary" @click="saveLead('new')" :disabled="saving">
          Save & Create Another
        </button>
      </div>
    </div>
  </div>
</template>
