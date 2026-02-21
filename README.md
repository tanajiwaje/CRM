# CRM (Lead-to-Cash Demo)

A full-stack CRM demo that covers the flow:

`Lead -> Qualification -> Opportunity -> Quote -> Work Order -> Evidence/QA -> Payment/Invoice -> Case`

## Tech Stack

- Frontend: Vue 3, Vue Router, Vite, Bootstrap
- Backend: Node.js, Express
- Database: SQLite (Prisma ORM)
- Auth: JWT Bearer token with role-based access
- File uploads: Multer, served from `/uploads`

## Project Structure

- `frontend/` - Vue web app
- `backend/` - Express API + Prisma + SQLite
- `TECHNICAL_DOCUMENTATION.txt` - detailed developer notes
- `USER_MANUAL.txt` - user-level flow and role guide

## Roles and Demo Login

- Admin: `admin@crm.local` / `Admin@123`
- Ops: `ops@crm.local` / `Ops@123`
- Sales: `sales@crm.local` / `Sales@123`
- Engineer: `engineer@crm.local` / `Engineer@123`

## Local Setup

### 1) Backend

```powershell
cd backend
npm.cmd install
npm.cmd run prisma:generate
```

Create `backend/.env`:

```env
DATABASE_URL="file:./crm.db"
JWT_SECRET="change-this-secret"
```

Then seed and run:

```powershell
npm.cmd run db:seed
npm.cmd run dev
```

Backend runs on `http://localhost:4000`.

### 2) Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend runs on `http://localhost:5173`.

## API Routing in Dev

- Frontend calls `/api/*`
- Vite proxy rewrites to backend `http://localhost:4000/*`
- Config location: `frontend/vite.config.js`

## Main Backend Route Groups

- `/health` (public)
- `/auth` (public login)
- `/lookups`
- `/leads`
- `/customers`
- `/opportunities`
- quotes/workorders/evidence/qa/payments/invoices mounted from root
- `/cases`
- `/admin`

Most routes are protected by auth + role checks in `backend/src/app.js`.

## Useful Commands

Backend (`backend/package.json`):

- `npm.cmd run dev` - start API with nodemon
- `npm.cmd run start` - start API
- `npm.cmd run db:seed` - reset/seed demo data
- `npm.cmd run prisma:studio` - open Prisma Studio
- `npm.cmd run test:process` - run process scenario test script

Frontend (`frontend/package.json`):

- `npm.cmd run dev` - start Vite dev server
- `npm.cmd run build` - production build
- `npm.cmd run preview` - preview build

## Notes

- Demo users are in code (`backend/src/shared/auth/users.js`), not DB-backed.
- Uploaded files are served by backend static route `/uploads`.
- If PowerShell blocks `npm`, use `npm.cmd`.

## License

Internal/demo project. Add your preferred license before public release.

