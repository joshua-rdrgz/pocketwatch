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

## Setup

1. Install dependencies:

```bash
pnpm install
```

## Development

To run the development environment for all apps (only available for /api and /web):

```bash
pnpm dev
```

To run a specific app or package:

```bash
pnpm dev --filter=web
```

## Building

Build all apps and packages:

```bash
pnpm build
```

Build a specific app or package:

```bash
pnpm build --filter=extension
```

## Running Production

To start the production versions of all apps (only available for /api and /web):

```bash
pnpm start
```

To start a specific app:

```bash
pnpm start --filter=web
```

## Code Quality

- **Linting**: Run `pnpm lint` to lint all code
- **Type Checking**: Run `pnpm check-types` to verify TypeScript types
- **Formatting**: Run `pnpm format` to format code with Prettier

## Project Management

This project uses Turborepo for task orchestration and caching. See `turbo.json` for task configurations.
