<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { clearSession, getUser } from "../services/auth";

const router = useRouter();
const user = getUser();
const role = computed(() => user?.role || "");
const isAdmin = computed(() => role.value === "admin");
const sidebarOpen = ref(false);
const canUseSales = computed(() => ["sales", "ops", "admin"].includes(role.value));
const canUseOps = computed(() => ["ops", "admin"].includes(role.value));
const canUseEngineer = computed(() => ["engineer", "ops", "admin"].includes(role.value));
const roleLabel = computed(() => {
  const map = {
    admin: "Admin",
    ops: "Operations",
    sales: "Sales",
    engineer: "Engineer",
  };
  return map[role.value] || "User";
});

const menuItems = computed(() => {
  const items = [];
  if (canUseSales.value) {
    items.push({ to: "/leads", label: "Leads", icon: "bi-person-vcard" });
  }
  if (["sales", "ops", "engineer", "admin"].includes(role.value)) {
    items.push({ to: "/opportunities", label: "Opportunities", icon: "bi-briefcase" });
  }
  if (canUseEngineer.value) {
    items.push({ to: "/workorders", label: "Work Orders", icon: "bi-tools" });
    items.push({ to: "/evidence-qa", label: "Evidence / QA", icon: "bi-patch-check" });
  }
  if (canUseOps.value) {
    items.push({ to: "/finance", label: "Payments / Invoices", icon: "bi-credit-card" });
    items.push({ to: "/cases", label: "Cases", icon: "bi-exclamation-octagon" });
  }
  return items;
});

function logout() {
  clearSession();
  router.push("/login");
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar() {
  sidebarOpen.value = false;
}

function handleResize() {
  if (window.innerWidth > 1100) {
    sidebarOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <div class="crm-shell">
    <aside class="sidebar p-3" :class="{ 'mobile-open': sidebarOpen }">
      <div class="brand mb-4 pb-3 border-bottom border-secondary-subtle">
        <h4 class="mb-1">PowerFlow Ops Suite</h4>
        <small class="text-muted d-block">PowerFlow Ops Suite</small>
        <span class="badge rounded-pill mt-2 px-3 py-2">{{ roleLabel }}</span>
      </div>
      <RouterLink v-if="canUseSales" class="btn btn-primary btn-sm mb-3 w-100" to="/leads/create" @click="closeSidebar">
        <i class="bi bi-plus-circle me-2"></i>Create Lead
      </RouterLink>
      <nav class="nav flex-column gap-1">
        <RouterLink class="nav-link crm-link" to="/" active-class="crm-link-inactive" exact-active-class="router-link-active" @click="closeSidebar">
          <i class="bi bi-speedometer2 me-2"></i>Dashboard
        </RouterLink>
        <RouterLink
          v-for="item in menuItems"
          :key="item.to"
          class="nav-link crm-link"
          :to="item.to"
          @click="closeSidebar"
        >
          <i class="bi me-2" :class="item.icon"></i>{{ item.label }}
        </RouterLink>
        <RouterLink v-if="isAdmin" class="nav-link crm-link" to="/admin" @click="closeSidebar">
          <i class="bi bi-gear me-2"></i>Admin
        </RouterLink>
      </nav>
    </aside>
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="closeSidebar"></div>

    <main class="content">
      <header class="topbar d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-sm btn-outline-secondary d-xl-none" @click="toggleSidebar">
            <i class="bi bi-list"></i>
          </button>
          <div>
          <h5 class="mb-0">PowerFlow Operations Platform</h5>
          <small class="text-muted">Leads to close with clear gates, blockers, and next actions.</small>
          </div>
        </div>
        <div class="d-flex gap-3 align-items-center">
          <div class="input-group input-group-sm d-none d-md-flex" style="width: 280px">
            <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
            <input class="form-control" type="text" placeholder="Search customer, opportunity, postcode" />
          </div>
          <div class="badge text-bg-light border px-3 py-2">
            <i class="bi bi-person-circle me-2"></i>{{ user?.name || "User" }} - {{ roleLabel }}
          </div>
          <button class="btn btn-sm btn-outline-danger" @click="logout">Logout</button>
        </div>
      </header>

      <section class="p-4">
        <RouterView />
      </section>
    </main>
  </div>
</template>
