import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap";
import App from "./App.vue";
import routes from "./router";
import { hasRole, isAuthenticated } from "./services/auth";
import "./style.css";

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.public) {
    if (isAuthenticated()) {
      next("/");
      return;
    }
    next();
    return;
  }

  if (to.meta.requiresAuth && !isAuthenticated()) {
    next("/login");
    return;
  }

  if (to.meta.requiresRole && !hasRole(to.meta.requiresRole)) {
    next("/");
    return;
  }

  next();
});

createApp(App).use(router).mount("#app");
