import { logger } from "../../utils/logger";
import { writeFileIfAbsent } from "../../utils/file-utils";

export interface ConfigInitOptions {
  force: boolean;
}

export async function configInitCommand(options: ConfigInitOptions) {
  try {
    logger.info("Initializing configuration files...", { options });

    const configFiles = [
      {
        path: "ignite.config.ts",
        content: `import { defineConfig } from "@ignite/core";

export default defineConfig({
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || "localhost",
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/ignite_dev",
  },

  // Plugin configuration
  plugins: [
    // Add your plugins here
    // "@ignite/plugin-prisma",
    // "@ignite/plugin-redis",
  ],

  // OpenAPI configuration
  openapi: {
    title: "pulzar API",
    version: "1.0.0",
    description: "API documentation for pulzar application",
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: "json",
  },

  // Environment-specific overrides
  environments: {
    development: {
      logging: { level: "debug" },
    },
    production: {
      logging: { level: "warn" },
      cors: { origin: process.env.ALLOWED_ORIGINS?.split(",") },
    },
  },
});
`,
      },
      {
        path: ".env.example",
        content: `# Environment Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DATABASE_URL=postgresql://localhost:5432/ignite_dev

# Security
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here

# CORS
CORS_ORIGIN=http://localhost:3000

# Redis (if using)
REDIS_URL=redis://localhost:6379

# External APIs
# API_KEY=your-api-key-here

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true

# Email (if using)
# SMTP_HOST=localhost
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
`,
      },
      {
        path: "tsconfig.json",
        content: `{
  "extends": "@ignite/tsconfig/base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    },
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": [
    "src/**/*",
    "ignite.config.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
`,
      },
      {
        path: "vitest.config.ts",
        content: `import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "src/test/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
`,
      },
      {
        path: "Dockerfile",
        content: `FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ignite

# Copy built application
COPY --from=builder --chown=ignite:nodejs /app/dist ./dist
COPY --from=builder --chown=ignite:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ignite:nodejs /app/package.json ./package.json

USER ignite

EXPOSE 3000

ENV PORT 3000

CMD ["node", "dist/index.js"]
`,
      },
      {
        path: "docker-compose.yml",
        content: `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/ignite_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ignite_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
`,
      },
    ];

    for (const file of configFiles) {
      if (options.force) {
        await writeFileIfAbsent(file.path, file.content, true);
        logger.info(`Created/Updated: ${file.path}`);
      } else {
        await writeFileIfAbsent(file.path, file.content);
        logger.info(`Created: ${file.path}`);
      }
    }

    logger.info("Configuration files initialized successfully");
    logger.info("Next steps:");
    logger.info("1. Copy .env.example to .env and update values");
    logger.info("2. Review ignite.config.ts and customize as needed");
    logger.info("3. Run 'npm install' to install dependencies");
  } catch (error) {
    logger.error("Failed to initialize configuration", { error });
    process.exit(1);
  }
}
