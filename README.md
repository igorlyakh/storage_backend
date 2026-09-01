<p align="right">🌐 <b>English</b> · <a href="README.he.md">עברית</a></p>

# 🗄️ Stock Assistant — Backend

<p align="center">
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-Proprietary-red" />
</p>

<p align="center"><b>Stock Assistant Backend</b> — a NestJS REST API running all the business logic of the order & inventory management system.</p>

---

## 📖 Table of Contents

- [About the project](#-about-the-project)
- [Architecture & modules](#️-architecture--modules)
- [Tech stack](#️-tech-stack)
- [Data model](#-data-model)
- [Security & authorization](#-security--authorization)
- [Environment variables](#️-environment-variables)
- [Local setup](#-local-setup)
- [Available scripts](#-available-scripts)
- [Deployment](#️-deployment)
- [Related project — Frontend](#-related-project--frontend)
- [License](#-license)

## 📋 About the project

This is the **API server** for **Stock Assistant** — an internal system for managing orders, inventory, warehouses and returns for a retail chain. It exposes a REST API consumed by the [Frontend](#-related-project--frontend) (React SPA), but can serve any HTTP client.

The project follows a **modular** architecture (NestJS Modules) — every business domain (orders, products, warehouses, returns...) is isolated in its own module with its own Controller, Service and DTOs.

## 🏗️ Architecture & modules

```
src/
├─ auth/          login, JWT + refresh token, Passport strategies
├─ users/         user & role management
├─ stores/        store management
├─ product/       product catalog, images, substitute products, low-stock detection
├─ warehouse/     stock movements, warehouse requests, write-offs
├─ warehouses/    warehouse entities and transfers between them
├─ orders/        the full order lifecycle (create → process → ship → complete)
├─ returns/       returns: creation, approval, driver pickup (QR), warehouse closing
├─ suppliers/     supplier management, scoped per admin
├─ brands/        brand management
├─ category/      product category management
├─ statistics/    statistical aggregation + Excel report export
├─ settings/      global system settings (singleton)
├─ guards/        role- and scope-based authorization guards
├─ decorators/    custom decorators (@Roles, @CurrentUser...)
├─ strategies/    JWT strategy for Passport
├─ prisma/        database connection service
├─ config/        configuration (e.g. upload paths)
└─ common/        shared helper functions across modules
```

There is also a dedicated handler in `api/` (`api/index.ts`) that wraps the Nest application as a single **serverless function** for deployment on Vercel.

## 🛠️ Tech stack

| Technology | Purpose |
|---|---|
| **NestJS 11** | Core framework, dependency injection, modular architecture |
| **Prisma 7** (with `@prisma/adapter-pg`) | ORM for PostgreSQL access |
| **PostgreSQL** (hosted on **Supabase**) | Primary database |
| **Passport + @nestjs/jwt** | User authentication with JWT access/refresh tokens |
| **bcryptjs** | Password hashing |
| **class-validator / class-transformer** | DTO validation and transformation |
| **exceljs** | Excel report generation for statistics |
| **Multer** | File uploads (product images) |
| **@nestjs/serve-static** | Serving static files (images, and optionally the built frontend) |
| **cookie-parser** | Refresh token cookie handling |

## 🗃️ Data model

The full schema is defined in `prisma/schema.prisma`. Core entities:

`User` · `Store` · `Product` (with brands, category and substitute product) · `Warehouse` + `WarehouseStock` · `Order` + `OrderItem` · `WarehouseRequest` + `WarehouseRequestItem` · `Return` + `ReturnItem` · `Supplier` · `Brand` · `Categories` · `AppSettings` (a single global settings row)

User roles (`Role`): `STORE` · `WAREHOUSE` · `ADMIN` · `DRIVER`

> Schema changes are synced to the database with `prisma db push` (no classic migration history); changes that require data backfills go through idempotent SQL scripts under `prisma/manual-migrations`.

## 🔐 Security & authorization

- **JWT** short-lived access tokens plus a refresh token in an HTTP-only cookie
- **Role guards** (`@Roles(...)`) on every sensitive endpoint, combined with `AuthGuard('jwt')`
- **Admin scopes** (`adminScopes`) — an ADMIN only sees and manages the categories assigned to them
- Passwords hashed with **bcryptjs**; other sensitive fields are encrypted with a key from `ENCRYPTION_KEY`
- **CORS** configured with `credentials: true` to support cookies across separate frontend/backend domains

## ⚙️ Environment variables

Define a `.env` file at the project root (see the existing `.env` for the expected shape — no real values are committed to Git):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `JWT_SECRET` | Signing key for JWT tokens |
| `ENCRYPTION_KEY` | Key used to encrypt sensitive fields |
| `PORT` | Server port (defaults to `3001` in development) |

## 🚀 Local setup

**Prerequisites:** Node.js 18+, Yarn, access to a PostgreSQL database.

```bash
git clone https://github.com/igorlyakh/storage_backend.git
cd storage_backend
yarn install
npx prisma db push
yarn start:dev
```

The server runs on `http://localhost:3001` with the global prefix `/api` (i.e. `http://localhost:3001/api/...`).

## 📜 Available scripts

| Command | Description |
|---|---|
| `yarn start:dev` | Run in development mode with watch mode |
| `yarn build` | Compile to `dist/` |
| `yarn start:prod` | Run the compiled build |
| `yarn test` | Run unit tests (Jest) |
| `yarn test:e2e` | Run end-to-end tests |
| `yarn lint` | Lint the code with ESLint |

## ☁️ Deployment

Two deployment modes are supported:

1. **Vercel (serverless)** — the default. `api/index.ts` wraps the Nest application as a single Express handler, and `vercel.json` routes every request to it. The separately deployed frontend points at this API URL.
2. **A regular Node server (VPS, etc.)** — running `dist/main.js`, where `ServeStaticModule` is configured to also serve the `uploads` folder and, optionally, the built frontend files directly from the same server.

The database is hosted on **Supabase** (managed PostgreSQL).

> ⚠️ **Technical note for Vercel deployment:** product images are currently written to the local disk (`fs.writeFile`) and served via `ServeStaticModule`. Vercel's serverless environment does not guarantee file persistence between invocations — for reliable product image storage on Vercel, move this to an external storage service (e.g. Vercel Blob or Supabase Storage).

## 🔗 Related project — Frontend

The user interface (React + Vite) lives in a separate repository: **[storage_frontend](https://github.com/igorlyakh/storage_frontend)**.

## 📄 License

This project is **proprietary** and all rights are reserved. It may not be copied, distributed, or used without prior express written permission. See [LICENSE](LICENSE) for details.
