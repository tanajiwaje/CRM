# Frontend (Vue + Vite)

## Run

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend URL: `http://localhost:5173`

## API Config

- Default API base: `/api`
- Defined in `src/services/api.js`
- Vite proxy maps `/api/*` to `http://localhost:4000/*` in `vite.config.js`

## Key Files

- `src/main.js` - app bootstrap
- `src/router/index.js` - route map + role metadata
- `src/pages/*` - feature pages (leads, opportunities, work orders, finance, cases, admin)
- `src/services/api.js` - API client + auth header handling

