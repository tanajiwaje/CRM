const TOKEN_KEY = "crm_token";
const USER_KEY = "crm_user";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function isAuthenticated() {
  return Boolean(getToken());
}

function hasRole(role) {
  const user = getUser();
  if (!user) return false;
  if (Array.isArray(role)) return role.includes(user.role);
  return user.role === role;
}

export { getToken, getUser, setSession, clearSession, isAuthenticated, hasRole };
