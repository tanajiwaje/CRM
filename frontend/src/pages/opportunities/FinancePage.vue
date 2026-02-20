<script setup>
import { computed, reactive, ref } from "vue";
import PaginationBar from "../../components/PaginationBar.vue";
import { api } from "../../services/api";

const info = ref("");
const error = ref("");
const paymentRequests = ref([]);
const paymentPage = ref(1);
const pageSize = 10;
const pagedPaymentRequests = computed(() => {
  const start = (paymentPage.value - 1) * pageSize;
  return paymentRequests.value.slice(start, start + pageSize);
});
const form = reactive({
  opportunityId: "",
  amountRequested: 0,
  paymentLinkUrl: "",
  xeroInvoiceNumber: "",
  xeroInvoiceId: "",
  xeroStatus: "Draft",
});

async function loadPaymentRequests() {
  if (!form.opportunityId) return;
  paymentRequests.value = await api(`/opportunities/${form.opportunityId}/payment-requests`);
  paymentPage.value = 1;
}

async function createPaymentRequest() {
  info.value = "";
  error.value = "";
  try {
    await api(`/opportunities/${form.opportunityId}/payment-requests`, {
      method: "POST",
      body: JSON.stringify({
        amountRequested: Number(form.amountRequested),
        paymentLinkUrl: form.paymentLinkUrl,
      }),
    });
    info.value = "Payment request created.";
    await loadPaymentRequests();
  } catch (e) {
    error.value = e.message;
  }
}

async function saveInvoiceReference() {
  info.value = "";
  error.value = "";
  try {
    await api(`/opportunities/${form.opportunityId}/invoice`, {
      method: "PATCH",
      body: JSON.stringify({
        xeroInvoiceId: form.xeroInvoiceId,
        xeroInvoiceNumber: form.xeroInvoiceNumber,
        xeroStatus: form.xeroStatus,
      }),
    });
    info.value = "Invoice reference updated.";
  } catch (e) {
    error.value = e.message;
  }
}

async function updatePaymentStatus(item, paymentStatus) {
  error.value = "";
  info.value = "";
  try {
    await api(`/payment-requests/${item.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        paymentStatus,
        paidOn: paymentStatus === "Paid" ? new Date().toISOString() : undefined,
      }),
    });
    info.value = `Payment request #${item.id} updated to ${paymentStatus}.`;
    await loadPaymentRequests();
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div class="page-title mb-3">
        <span class="page-title-icon"><i class="bi bi-credit-card-2-front"></i></span>
        <div>
          <h4 class="mb-0">Payments & Invoice Tracking</h4>
          <small class="text-muted">Lean financial tracking with Xero references.</small>
        </div>
      </div>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="info" class="alert alert-success">{{ info }}</div>

      <div class="crm-section-title">Target Opportunity</div>
      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label">Opportunity ID</label>
          <input class="form-control" v-model="form.opportunityId" />
        </div>
        <div class="col-md-3 d-flex align-items-end">
          <button class="btn btn-outline-secondary w-100" @click="loadPaymentRequests">Load Payment Entries</button>
        </div>
      </div>

      <hr />
      <div class="crm-section-title">Payment Request</div>
      <h6>Payment Request</h6>
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label">Amount</label>
          <input class="form-control" type="number" v-model="form.amountRequested" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Payment Link URL</label>
          <input class="form-control" v-model="form.paymentLinkUrl" />
        </div>
        <div class="col-md-3">
          <button class="btn btn-primary w-100" @click="createPaymentRequest">Create Payment Request</button>
        </div>
      </div>

      <div class="table-responsive mt-3" v-if="paymentRequests.length">
        <table class="table table-sm align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Payment URL</th>
              <th>Status</th>
              <th>Paid On</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pagedPaymentRequests" :key="item.id">
              <td>#{{ item.id }}</td>
              <td>{{ item.amountRequested }}</td>
              <td>
                <a v-if="item.paymentLinkUrl" :href="item.paymentLinkUrl" target="_blank">Open Link</a>
                <span v-else>-</span>
              </td>
              <td><span class="status-chip">{{ item.paymentStatus }}</span></td>
              <td>{{ item.paidOn ? new Date(item.paidOn).toLocaleString() : "-" }}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-success me-1" @click="updatePaymentStatus(item, 'Paid')">Mark Paid</button>
                <button class="btn btn-sm btn-outline-danger" @click="updatePaymentStatus(item, 'Failed')">Mark Failed</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar v-model="paymentPage" :total-items="paymentRequests.length" :page-size="pageSize" />

      <hr />
      <div class="crm-section-title">Invoice Sync Reference</div>
      <h6>Invoice Reference (Xero)</h6>
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label">Invoice Number</label>
          <input class="form-control" v-model="form.xeroInvoiceNumber" />
        </div>
        <div class="col-md-3">
          <label class="form-label">Invoice ID</label>
          <input class="form-control" v-model="form.xeroInvoiceId" />
        </div>
        <div class="col-md-3">
          <label class="form-label">Status</label>
          <input class="form-control" v-model="form.xeroStatus" />
        </div>
        <div class="col-md-3">
          <button class="btn btn-outline-dark w-100" @click="saveInvoiceReference">Save Invoice Ref</button>
        </div>
      </div>
    </div>
  </div>
</template>
