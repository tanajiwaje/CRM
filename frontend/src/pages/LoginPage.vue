<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../services/api";
import { setSession } from "../services/auth";

const router = useRouter();
const loading = ref(false);
const error = ref("");
const form = reactive({
  email: "admin@crm.local",
  password: "Admin@123",
});

async function login() {
  loading.value = true;
  error.value = "";
  try {
    const response = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setSession(response.token, response.user);
    router.push("/");
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <header class="public-header border-bottom">
      <nav class="navbar navbar-expand-lg container py-3">
        <a class="navbar-brand fw-bold text-primary" href="#">PowerFlow Ops Suite</a>
        <div class="ms-auto d-flex gap-2">
          <a class="btn btn-outline-primary btn-sm" href="#contact">Contact</a>
          <a class="btn btn-primary btn-sm" href="#login-panel">Login</a>
        </div>
      </nav>
    </header>

    <main>
      <section class="public-hero py-5">
        <div class="container">
          <div class="row g-4 align-items-stretch">
            <div class="col-lg-7">
              <div class="public-hero-card h-100">
                <span class="badge text-bg-primary mb-3">Automation-first Platform</span>
                <h1 class="mb-3">Lead to Install to Close</h1>
                <p class="text-muted mb-4">
                  One process-driven platform for Sales, Ops, Engineers, and Admin. Built for lean delivery with
                  evidence, QA, payment, and invoice controls.
                </p>
                <div class="row g-3 mb-4">
                  <div class="col-sm-6">
                    <div class="border rounded-3 p-3 h-100">
                      <h6 class="mb-1">Products</h6>
                      <small class="text-muted">Gas Boilers, Heat Pumps, Solar PV, Battery Storage, EV Charging.</small>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="border rounded-3 p-3 h-100">
                      <h6 class="mb-1">Model</h6>
                      <small class="text-muted">No stock module, field delivery focused, controlled closure gates.</small>
                    </div>
                  </div>
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <span class="status-chip">Lead Capture</span>
                  <span class="status-chip">Qualification</span>
                  <span class="status-chip">Quote / Survey</span>
                  <span class="status-chip">Work Orders</span>
                  <span class="status-chip">Evidence + QA</span>
                  <span class="status-chip">Payment + Invoice</span>
                  <span class="status-chip">Close</span>
                </div>
              </div>
            </div>

            <div class="col-lg-5">
              <div id="login-panel" class="card h-100">
                <div class="card-body p-4">
                  <h4 class="mb-2">Sign In</h4>
                  <p class="text-muted mb-3">Use your role-based account to continue.</p>
                  <div v-if="error" class="alert alert-danger">{{ error }}</div>
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input class="form-control" type="email" v-model="form.email" />
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input class="form-control" type="password" v-model="form.password" />
                  </div>
                  <button class="btn btn-primary w-100" :disabled="loading" @click="login">
                    {{ loading ? "Signing in..." : "Sign In" }}
                  </button>
                  <div class="small text-muted mt-4">
                    <strong>Demo Credentials</strong><br />
                    Admin: <code>admin@crm.local / Admin@123</code><br />
                    Ops: <code>ops@crm.local / Ops@123</code><br />
                    Sales: <code>sales@crm.local / Sales@123</code><br />
                    Engineer: <code>engineer@crm.local / Engineer@123</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="container pb-4">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="card h-100">
              <div class="card-body">
                <h6><i class="bi bi-person-vcard me-2 text-primary"></i>Sales</h6>
                <p class="mb-0 text-muted small">Capture leads, dedupe, qualify, create and accept quotes.</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100">
              <div class="card-body">
                <h6><i class="bi bi-tools me-2 text-success"></i>Field Service</h6>
                <p class="mb-0 text-muted small">Create and track survey/install work orders with evidence and QA.</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100">
              <div class="card-body">
                <h6><i class="bi bi-credit-card me-2 text-warning"></i>Finance</h6>
                <p class="mb-0 text-muted small">Request payments, store Xero invoice reference, and close cleanly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer id="contact" class="public-footer mt-4">
      <div class="container py-4">
        <div class="row g-3 align-items-center">
          <div class="col-md-8">
            <h6 class="mb-1 text-white">PowerFlow Ops Suite</h6>
            <small class="text-white-50">
              Heating & renewable energy delivery platform. Contact: info@fullpowerinstallations.com
            </small>
          </div>
          <div class="col-md-4 text-md-end">
            <small class="text-white-50">PowerFlow Ops Suite - learning application</small>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
