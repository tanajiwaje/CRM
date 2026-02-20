const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const users = require("../../shared/auth/users");
const validate = require("../../shared/middleware/validate");
const { JWT_SECRET, requireAuth } = require("../../shared/middleware/auth");

const router = express.Router();

router.post(
  "/login",
  validate(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }),
  ),
  async (req, res) => {
    const { email, password } = req.body;
    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "12h" },
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  },
);

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
