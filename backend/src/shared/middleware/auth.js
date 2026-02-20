const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "crm-dev-secret";

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

function requireRole(roles) {
  const allow = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!allow.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role." });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  requireAuth,
  requireRole,
};
