# Pocketwatch

Pocketwatch is a time-tracking software that deeply explores how you spend your working time. It breaks your sessions down by general work, focused work, breaks, and extended breaks to measure how efficient you are in your working hours. Efficiency in work hours leads to less work hours, and a healthier lifestyle!

## Project Structure

This project uses a monorepo architecture with Turborepo and pnpm workspaces:

- `apps/`
  - `web/`: Frontend web application (NextJS)
  - `api/`: Backend API service (NodeJS/ExpressJS)
  - `extension/`: Browser extension (ReactJS w/wrapping vanilla JS)
- `packages/`
  - `ui/`: Shared UI components (ShadCN/UI)
  - `shared/`: Shared TypeScript types, DB (Drizzle) schemas, etc.
  - `eslint-config/`: Shared ESLint configuration
  - `typescript-config/`: Shared TypeScript configuration

## Prerequisites

- Node.js (version 18 or higher)
- pnpm (version 9.0.0)
- Docker and Docker Compose (for PostgreSQL database)

## Setup

Install dependencies:

```bash
pnpm install
```

Then follow these steps:

1. **Generate BetterAuth Secret Key**
   - Follow the [BetterAuth installation guide](https://www.better-auth.com/docs/installation) to generate a secure secret key

2. **Generate Google Credentials**
   - Follow the [BetterAuth Google authentication guide](https://www.better-auth.com/docs/authentication/google) to:
     - Create a Google Cloud Project
     - Set up OAuth 2.0 credentials
     - Configure the redirect URI: `http://localhost:3001/api/auth/callback/google`

3. **Load Database**
   ```bash
   # Using Makefile:
   make pw-pg-up
   
   # Or using Docker Compose:
   docker-compose up -d postgres
   ```
   
   This starts:
   - PostgreSQL server on `localhost:5432`
   - Default credentials: `postgres/mypassword`
   - Database name: `postgres`
   
   Optional: Start pgAdmin for database management:
   ```bash
   docker-compose up -d pgadmin
   ```
   Access pgAdmin at `http://localhost:8080` (admin@admin.com / admin)

4. **Create Environment Files**

   Create `.env` in `apps/api/`:
   ```bash
   MY_API_BETTER_AUTH_SECRET=
   MY_API_BETTER_AUTH_URL=
   MY_API_DATABASE_URL=
   MY_API_GOOGLE_CLIENT_ID=
   MY_API_GOOGLE_CLIENT_SECRET=
   ```

   Create `.env` in `apps/extension/src/react/`:
   ```bash
   VITE_API_BASE_URL=
   ```

5. **Build Extension + Load into Chrome**
   ```bash
   pnpm build --filter=extension
   ```
   - Open Chrome → Extensions → Developer mode → Load unpacked
   - Select the built extension folder

6. **Copy Extension ID and Update Trusted Origins**
   - Copy the extension ID from `chrome://extensions/`
   - Edit `apps/api/src/lib/auth.ts` and replace:
   ```typescript
   trustedOrigins: ['chrome-extension://YOUR_EXTENSION_ID_HERE'],
   ```

7. **Run Database Migration**
   ```bash
   cd apps/api
   pnpm drizzle-kit migrate
   ```

8. **Load API in Dev Mode**
   ```bash
   pnpm dev --filter=api
   ```

The API should start on `http://localhost:3001` and connect to the database successfully.

## Available Commands

This project uses Turborepo for task orchestration and caching. See `turbo.json` for task configurations.

### Development

Run development environment for all apps:

```bash
pnpm dev
```

Run a specific app or package:

```bash
pnpm dev --filter=web
pnpm dev --filter=api
```

### Building

Build all apps and packages:

```bash
pnpm build
```

Build a specific app or package:

```bash
pnpm build --filter=extension
pnpm build --filter=web
```

### Production

Start production versions of all apps:

```bash
pnpm start
```

Start a specific app:

```bash
pnpm start --filter=web
pnpm start --filter=api
```

### Code Quality

- **Linting**: `pnpm lint` - Lint all code
- **Type Checking**: `pnpm check-types` - Verify TypeScript types  
- **Formatting**: `pnpm format` - Format code with Prettier
- **Testing**: `pnpm test` - Run all tests
