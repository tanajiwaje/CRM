const app = require("./app");
const prisma = require("./shared/db/prisma");

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`CRM backend listening on http://localhost:${port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
