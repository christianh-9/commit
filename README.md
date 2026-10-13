# Commit

## Frontend

Mobile-first React app in `frontend/` (Vite, TypeScript, Tailwind, shadcn/ui, TanStack Query).

Run the API first (`uv run fastapi dev app/main.py`, port 8000), then:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. To use it from your phone, open the `Network:` URL Vite prints (same Wi-Fi). In development, Vite proxies `/api/*` to `http://localhost:8000` with the `/api` prefix removed, so there is no CORS setup.

| Command | What it does |
| --- | --- |
| `npm run gen:api` | Regenerates `src/api/schema.d.ts` from the running API's `/openapi.json` |
| `npm test` | Runs the unit tests (heatmap filling, 422 error mapping, set grouping) |
| `npm run build` | Type-checks and builds to `dist/` |
| `npm run lint` | Lints with oxlint |

Re-run `npm run gen:api` after changing backend schemas; type errors then show where the frontend needs updating.

The production build still calls `/api`, so serve `dist/` behind a reverse proxy that forwards `/api` to the backend.
