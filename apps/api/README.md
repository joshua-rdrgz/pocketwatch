# Pocketwatch API

This is the backend API server for Pocketwatch, built with Node.js and Express.js.

## Getting Started

### Development

```bash
pnpm run dev
```

This will start the server in development mode with tsx.

### Build

```bash
pnpm run build
```

### Production

```bash
pnpm run start
```

The server will run on port 3001 by default, or the port specified in the `PORT` environment variable.

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint
