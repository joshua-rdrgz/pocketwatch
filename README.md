# Model Metrics

A monorepo project for keeping track of your AI Training working hours and monitoring their trends over time.

## Project Structure

This project uses a monorepo architecture with Turborepo and pnpm workspaces:

- `apps/`
  - `web/`: Frontend web application (NextJS)
  - `api/`: Backend API service (NodeJS/ExpressJS)
  - `extension/`: Browser extension (ReactJS w/wrapping vanilla JS)
- `packages/`
  - `ui/`: Shared UI components (ShadCN/UI)
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

To run the development environment for all apps:

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
pnpm build --filter=web
```

## Running Production

To start the production versions of all apps:

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
