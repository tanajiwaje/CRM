# Backend (Express + Prisma)

## Run

```powershell
cd backend
npm.cmd install
npm.cmd run prisma:generate
```

Create `.env`:

```env
DATABASE_URL="file:./crm.db"
JWT_SECRET="change-this-secret"
```

Then:

```powershell
npm.cmd run db:seed
npm.cmd run dev
```

API default URL: `http://localhost:4000`

## Key Files

- `src/server.js` - server startup
- `src/app.js` - middleware + route mounting + role guards
- `prisma/schema.prisma` - data model
- `prisma/seed.js` - demo seed data
- `src/shared/auth/users.js` - demo users

