# Commit

A workout tracker built for your phone. You log what you lift, pick how many days a week you want to train, and the app keeps a weekly streak and a GitHub-style heatmap of the past year.

**[Live site](https://commit-gyu0.onrender.com/)**

## Features

- Email and password accounts, plus Sign in with Google. A Google account with a verified email links to an existing account that uses the same address.
- Logging a workout: pick a date, choose exercises from a searchable list grouped by muscle group, and add sets with reps and an optional weight.
- A weekly streak. A week (Monday to Sunday, in your own timezone) counts when you train on at least your target number of days, and the streak is the number of weeks in a row you hit it.
- A heatmap of the past 365 days, shaded by how many workouts you logged each day.
- Workout history with expandable cards, where sets are grouped by exercise, and delete with a confirmation step.
- Settings for your name, weekly target and timezone.

## Stack

| Part | Built with |
| --- | --- |
| API | FastAPI, async SQLAlchemy 2 with asyncpg, Alembic, Pydantic settings, PyJWT, pwdlib (Argon2), Authlib for Google OAuth |
| Frontend | Vite, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router, React Hook Form with Zod, react-activity-calendar |
| API client | Types generated from the FastAPI OpenAPI schema with openapi-typescript, called through openapi-fetch |
| Database | PostgreSQL 16 (Docker locally, Neon in production) |
| Hosting | Render (static site and web service) |

## How it fits together

The browser only ever talks to the frontend's own address. Requests to `/api/*` are passed to the API with the `/api` prefix removed: by the Vite dev server locally, and by a rewrite rule on the Render static site in production. Because of that there is no CORS setup, and the session cookie used during Google sign-in stays on one domain.

```
browser ──> frontend (Vite dev server / Render static site)
               └── /api/* ──> FastAPI ──> Postgres
```

Login returns a JWT, which the frontend keeps in localStorage and sends as a bearer token. Any 401 response clears it and sends you to the login page. Google sign-in goes through the API: Google redirects back to `/api/auth/google/callback`, the API finds or creates the user, and then it redirects to `/auth/callback#token=...`. The token travels in the URL fragment so it never reaches a server log, and the page removes it from the address bar as soon as it has stored it.

## Running it locally

You need Docker, [uv](https://docs.astral.sh/uv/), and Node 20.19 or newer.

```sh
cp .env.example .env            # then fill in the secrets (see below)
docker compose up -d            # Postgres on localhost:5432
uv sync
uv run alembic upgrade head     # creates the tables and the exercise list
uv run fastapi dev app/main.py  # API on http://localhost:8000
```

In a second terminal:

```sh
cd frontend
npm install
npm run dev                     # app on http://localhost:5173
```

To try it on your phone, open the `Network:` address Vite prints while the phone is on the same Wi-Fi network.

### Environment variables

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Must start with `postgresql+asyncpg://`. Locally: `postgresql+asyncpg://commit:commit@localhost:5432/commit` |
| `JWT_SECRET` | Signs login tokens. Generate one with `openssl rand -hex 32` |
| `SESSION_SECRET` | Signs the short-lived cookie used during Google sign-in. Generate it the same way |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | From an OAuth client of type "Web application" in Google Cloud |
| `GOOGLE_REDIRECT_URL` | Defaults to `http://localhost:5173/api/auth/google/callback` |
| `FRONTEND_URL` | Defaults to `http://localhost:5173` |

For Google sign-in to work locally, add `http://localhost:5173/api/auth/google/callback` to the OAuth client's authorized redirect URIs. While the Google app is in testing mode, only accounts listed as test users can sign in.

### Regenerating API types

After changing a schema in the API, run this with the API running:

```sh
cd frontend && npm run gen:api
```

It rewrites `frontend/src/api/schema.d.ts`, and the type checker then points out anywhere the frontend needs updating.

## Tests and checks

The API tests run against a separate `commit_test` database on the same Docker Postgres. Create it once:

```sh
docker exec commit-db createdb -U commit commit_test
```

Then:

```sh
uv run pytest                 # streak rules and Google account linking
uv run ruff check app tests
uv run mypy app
```

```sh
cd frontend
npm test                      # heatmap filling, 422 error mapping, set grouping
npm run lint
npm run build                 # type-checks and builds to dist/
```

## API

| Method | Path | |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Form fields `username` (email) and `password`; returns a token |
| `GET` | `/auth/google/login` | Start Google sign-in (a browser redirect) |
| `GET` | `/auth/google/callback` | Where Google sends the user back |
| `GET`, `PATCH` | `/users/me` | Read or update the current user |
| `GET` | `/exercises` | All exercises, ordered by muscle group |
| `GET`, `POST` | `/workouts` | List workouts (newest first) or log one |
| `GET`, `DELETE` | `/workouts/{id}` | Read or delete one workout |
| `GET` | `/stats/streak` | Current and best streak, days trained this week |
| `GET` | `/stats/heatmap` | Workout counts per day for the past year |
| `GET` | `/health` | Checks that the database answers |

With the API running, interactive docs are at http://localhost:8000/docs.

## Deployment

Production runs as two Render services in Oregon and a Neon database in AWS us-west-2.

**Database (Neon).** Use the direct connection string, not the pooled one, since the pooler breaks asyncpg's prepared statements. Change the prefix to `postgresql+asyncpg://` and replace the query string with `?ssl=require`. Apply migrations from your machine by pointing `DATABASE_URL` at Neon for that one command:

```sh
DATABASE_URL='postgresql+asyncpg://...?ssl=require' uv run alembic upgrade head
```

**API (Render web service).** Root directory left empty.

- Build: `pip install uv && uv sync --frozen --no-dev`
- Start: `uv run --no-dev uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`
- Environment: the variables above, with production secrets, and `FRONTEND_URL` and `GOOGLE_REDIRECT_URL` pointing at the live site.

**Frontend (Render static site).** Root directory `frontend`, build `npm ci && npm run build`, publish directory `dist`, and `NODE_VERSION=24`. Two rewrite rules, in this order:

| Source | Destination |
| --- | --- |
| `/api/*` | `https://<api-service>.onrender.com/*` |
| `/*` | `/index.html` |

**Google.** Production uses its own OAuth client, with `https://commit-gyu0.onrender.com/api/auth/google/callback` as the redirect URI.

The API runs on Render's free tier, which sleeps after 15 minutes without requests. An UptimeRobot monitor on `/api/docs` every 5 minutes keeps it awake. That page doesn't touch the database, so Neon can still scale to zero when nobody is using the app.

