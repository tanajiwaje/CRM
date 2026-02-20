import AppLayout from "../layouts/AppLayout.vue";
import LoginPage from "../pages/LoginPage.vue";
import DashboardPage from "../pages/DashboardPage.vue";
import LeadCreatePage from "../pages/leads/LeadCreatePage.vue";
import LeadListPage from "../pages/leads/LeadListPage.vue";
import LeadDetailsPage from "../pages/leads/LeadDetailsPage.vue";
import LeadQualificationPage from "../pages/leads/LeadQualificationPage.vue";
import OpportunityListPage from "../pages/opportunities/OpportunityListPage.vue";
import OpportunityDetailsPage from "../pages/opportunities/OpportunityDetailsPage.vue";
import WorkOrderListPage from "../pages/workorders/WorkOrderListPage.vue";
import WorkOrderDetailsPage from "../pages/workorders/WorkOrderDetailsPage.vue";
import EvidenceQAPage from "../pages/workorders/EvidenceQAPage.vue";
import FinancePage from "../pages/opportunities/FinancePage.vue";
import CaseListPage from "../pages/cases/CaseListPage.vue";
import CaseDetailsPage from "../pages/cases/CaseDetailsPage.vue";
import AdminPage from "../pages/admin/AdminPage.vue";

export default [
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: { public: true },
  },
  {
    path: "/",
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "", name: "dashboard", component: DashboardPage, meta: { requiresRole: ["sales", "ops", "engineer", "admin"] } },
      { path: "leads/create", name: "lead-create", component: LeadCreatePage, meta: { requiresRole: ["sales", "ops", "admin"] } },
      { path: "leads", name: "lead-list", component: LeadListPage, meta: { requiresRole: ["sales", "ops", "admin"] } },
      { path: "leads/:id", name: "lead-details", component: LeadDetailsPage, meta: { requiresRole: ["sales", "ops", "admin"] } },
      { path: "leads/:id/qualification", name: "lead-qualification", component: LeadQualificationPage, meta: { requiresRole: ["sales", "ops", "admin"] } },
      { path: "opportunities", name: "opportunity-list", component: OpportunityListPage, meta: { requiresRole: ["sales", "ops", "engineer", "admin"] } },
      { path: "opportunities/:id", name: "opportunity-details", component: OpportunityDetailsPage, meta: { requiresRole: ["sales", "ops", "engineer", "admin"] } },
      { path: "workorders", name: "workorder-list", component: WorkOrderListPage, meta: { requiresRole: ["ops", "engineer", "admin"] } },
      { path: "workorders/:id", name: "workorder-details", component: WorkOrderDetailsPage, meta: { requiresRole: ["ops", "engineer", "admin"] } },
      { path: "evidence-qa", name: "evidence-qa", component: EvidenceQAPage, meta: { requiresRole: ["ops", "engineer", "admin"] } },
      { path: "finance", name: "finance", component: FinancePage, meta: { requiresRole: ["ops", "admin"] } },
      { path: "cases", name: "case-list", component: CaseListPage, meta: { requiresRole: ["ops", "admin"] } },
      { path: "cases/:id", name: "case-details", component: CaseDetailsPage, meta: { requiresRole: ["ops", "admin"] } },
      { path: "admin", name: "admin", component: AdminPage, meta: { requiresRole: "admin" } },
    ],
  },
];
