<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../../services/api";

const route = useRoute();
const router = useRouter();
const lead = ref(null);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const result = ref(null);

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

async function qualifyLead() {
  saving.value = true;
  error.value = "";
  try {
    result.value = await api(`/leads/${route.params.id}/qualify`, { method: "POST" });
    router.push(`/opportunities/${result.value.opportunity.id}`);
  } catch (e) {
    error.value = e.details?.error || e.message;
  } finally {
    saving.value = false;
  }
}

onMounted(loadLead);
</script>

<template>
  <div v-if="loading" class="text-muted">Loading qualification preview...</div>
  <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
  <div v-else-if="lead" class="card">
    <div class="card-body">
      <div class="page-title mb-3">
        <span class="page-title-icon"><i class="bi bi-diagram-3"></i></span>
        <div>
          <h4 class="mb-0">Lead Qualification</h4>
          <small class="text-muted">Review conversion preview before creating the opportunity container.</small>
        </div>
      </div>
      <div class="row g-2 mb-3">
        <div class="col-md-6"><strong>Lead:</strong> {{ lead.fullName || lead.companyName }}</div>
        <div class="col-md-6"><strong>Email / Phone:</strong> {{ lead.email || "-" }} / {{ lead.phone || "-" }}</div>
        <div class="col-md-6"><strong>Product:</strong> {{ lead.interestedProduct?.name || "Gas Boiler" }}</div>
        <div class="col-md-6"><strong>Funding:</strong> {{ lead.fundingType?.name || "Paying" }}</div>
        <div class="col-12"><strong>Property:</strong> {{ lead.propertyAddressLine1 || "No address captured" }}</div>
      </div>

      <div class="alert alert-info">
        This creates: <strong>Account + Contact + Property + Opportunity</strong> in one transaction.
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-primary" :disabled="saving" @click="qualifyLead">Qualify & Create Job</button>
        <button class="btn btn-outline-secondary" @click="$router.push(`/leads/${lead.id}`)">Back</button>
      </div>
    </div>
  </div>
</template>
