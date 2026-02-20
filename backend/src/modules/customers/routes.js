const express = require("express");
const prisma = require("../../shared/db/prisma");
const asyncHandler = require("../../shared/utils/async-handler");

const router = express.Router();

router.get(
  "/accounts",
  asyncHandler(async (req, res) => {
    const data = await prisma.account.findMany({
      include: {
        contacts: true,
        properties: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(data);
  }),
);

router.get(
  "/accounts/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const account = await prisma.account.findUnique({
      where: { id },
      include: { contacts: true, properties: true, opportunities: true, cases: true },
    });
    if (!account) return res.status(404).json({ error: "Account not found" });
    res.json(account);
  }),
);

router.get(
  "/contacts",
  asyncHandler(async (req, res) => {
    const contacts = await prisma.contact.findMany({
      include: { account: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(contacts);
  }),
);

router.get(
  "/properties",
  asyncHandler(async (req, res) => {
    const properties = await prisma.property.findMany({
      include: { account: true, primaryContact: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(properties);
  }),
);

module.exports = router;
