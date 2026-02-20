const bcrypt = require("bcryptjs");

const rawUsers = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@crm.local",
    password: "Admin@123",
    role: "admin",
  },
  {
    id: 2,
    name: "Ops User",
    email: "ops@crm.local",
    password: "Ops@123",
    role: "ops",
  },
  {
    id: 3,
    name: "Sales User",
    email: "sales@crm.local",
    password: "Sales@123",
    role: "sales",
  },
  {
    id: 4,
    name: "Engineer User",
    email: "engineer@crm.local",
    password: "Engineer@123",
    role: "engineer",
  },
];

const users = rawUsers.map((user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  passwordHash: bcrypt.hashSync(user.password, 10),
}));

module.exports = users;
