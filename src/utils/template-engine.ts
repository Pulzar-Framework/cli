import { promises as fs } from "fs";
import { join, dirname } from "path";
import { logger } from "./logger.js";

export interface ProjectTemplate {
  name: string;
  description: string;
  files: Record<string, string>;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
  gitignore?: string;
}

export interface TemplateContext {
  projectName: string;
  className: string;
  description?: string;
  author?: string;
  database?: string;
  template?: string;
}

export class TemplateEngine {
  constructor() {}

  async createProject(
    projectName: string,
    template: string,
    options?: {
      database?: string;
      skipInstall?: boolean;
      description?: string;
      author?: string;
    }
  ): Promise<void> {
    const opts = options || {};
    const context: TemplateContext = {
      projectName,
      className: this.toPascalCase(projectName),
      description: opts.description || `A new Pulzar project`,
      author: opts.author || "Pulzar Developer",
      database: opts.database || "postgresql",
      template,
    };

    logger.info(`Creating new Pulzar project: ${projectName}`);
    logger.info(`Template: ${template}`);
    logger.info(`Database: ${context.database}`);

    // Get template
    const projectTemplate = this.getTemplate(template, context);

    // Create project directory
    await fs.mkdir(projectName, { recursive: true });

    // Generate files
    await this.generateFiles(projectName, projectTemplate, context);

    // Generate package.json
    await this.generatePackageJson(projectName, projectTemplate, context);

    // Generate .gitignore
    await this.generateGitignore(projectName, projectTemplate);

    // Initialize git
    await this.initializeGit(projectName);

    // Install dependencies
    if (!opts.skipInstall) {
      await this.installDependencies(projectName);
    }

    logger.success(`✅ Created ${projectName} successfully!`);
    logger.info(`📁 Navigate to: cd ${projectName}`);
    logger.info(`🚀 Start development: pulzar dev`);
  }

  private getTemplate(name: string, context: TemplateContext): ProjectTemplate {
    switch (name) {
      case "api":
        return this.getApiTemplate(context);
      case "fullstack":
        return this.getFullstackTemplate(context);
      case "microservice":
        return this.getMicroserviceTemplate(context);
      case "graphql":
        return this.getGraphQLTemplate(context);
      case "basic":
      default:
        return this.getBasicTemplate(context);
    }
  }

  private getBasicTemplate(context: TemplateContext): ProjectTemplate {
    return {
      name: "basic",
      description: "Basic Pulzar application",
      files: {
        "src/index.ts": this.getIndexTemplate(context),
        "src/app.ts": this.getAppTemplate(context),
        "src/config/index.ts": this.getConfigTemplate(context),
        "src/routes/ping.get.ts": this.getPingRouteTemplate(),
        "pulzar.config.ts": this.getPulzarConfigTemplate(context),
        "tsconfig.json": this.getTsConfigTemplate(),
        ".env.example": this.getEnvTemplate(context),
        "README.md": this.getReadmeTemplate(context),
      },
      dependencies: [
        "@pulzar/core",
        "fastify",
        "dotenv",
        "zod",
        "@fastify/cors",
        "@fastify/helmet",
        "@fastify/sensible",
      ],
      devDependencies: [
        "typescript",
        "@types/node",
        "tsx",
        "nodemon",
        "@biomejs/biome",
      ],
      scripts: {
        dev: "pulzar dev",
        build: "pulzar build",
        start: "node dist/index.js",
        test: "pulzar test",
        lint: "pulzar lint",
        "type-check": "tsc --noEmit",
      },
    };
  }

  private getApiTemplate(context: TemplateContext): ProjectTemplate {
    const basic = this.getBasicTemplate(context);
    return {
      ...basic,
      name: "api",
      description: "REST API with authentication",
      files: {
        ...basic.files,
        "src/modules/auth/auth.module.ts": this.getAuthModuleTemplate(),
        "src/modules/auth/auth.controller.ts": this.getAuthControllerTemplate(),
        "src/modules/auth/auth.service.ts": this.getAuthServiceTemplate(),
        "src/modules/users/user.module.ts": this.getUserModuleTemplate(),
        "src/modules/users/user.controller.ts":
          this.getUserControllerTemplate(),
        "src/modules/users/user.service.ts": this.getUserServiceTemplate(),
        "src/guards/auth.guard.ts": this.getAuthGuardTemplate(),
        "src/middleware/logging.middleware.ts":
          this.getLoggingMiddlewareTemplate(),
      },
      dependencies: [
        ...basic.dependencies,
        "@fastify/jwt",
        "@fastify/auth",
        "@fastify/session",
        "@fastify/swagger",
        "@fastify/swagger-ui",
        "bcrypt",
        "@types/bcrypt",
      ],
    };
  }

  private getFullstackTemplate(context: TemplateContext): ProjectTemplate {
    const api = this.getApiTemplate(context);
    return {
      ...api,
      name: "fullstack",
      description: "Full-stack application with frontend",
      files: {
        ...api.files,
        "client/package.json": this.getClientPackageJsonTemplate(context),
        "client/index.html": this.getClientIndexTemplate(context),
        "client/src/main.ts": this.getClientMainTemplate(),
        "client/vite.config.ts": this.getViteConfigTemplate(),
      },
      dependencies: [...api.dependencies, "@fastify/static"],
    };
  }

  private getMicroserviceTemplate(context: TemplateContext): ProjectTemplate {
    const basic = this.getBasicTemplate(context);
    return {
      ...basic,
      name: "microservice",
      description: "Microservice with events and observability",
      files: {
        ...basic.files,
        "src/events/user.events.ts": this.getUserEventsTemplate(),
        "src/services/event.service.ts": this.getEventServiceTemplate(),
        "src/middleware/tracing.middleware.ts":
          this.getTracingMiddlewareTemplate(),
        "docker-compose.yml": this.getDockerComposeTemplate(context),
        Dockerfile: this.getDockerfileTemplate(),
      },
      dependencies: [
        ...basic.dependencies,
        "@opentelemetry/api",
        "@opentelemetry/sdk-node",
        "@opentelemetry/auto-instrumentations-node",
        "kafkajs",
        "nats",
      ],
    };
  }

  private getGraphQLTemplate(context: TemplateContext): ProjectTemplate {
    const basic = this.getBasicTemplate(context);
    return {
      ...basic,
      name: "graphql",
      description: "GraphQL API with type-safe resolvers",
      files: {
        ...basic.files,
        "src/graphql/schema.ts": this.getGraphQLSchemaTemplate(),
        "src/graphql/resolvers/user.resolver.ts":
          this.getGraphQLResolverTemplate(),
        "src/graphql/types/user.types.ts": this.getGraphQLTypesTemplate(),
      },
      dependencies: [
        ...basic.dependencies,
        "mercurius",
        "graphql",
        "@graphql-tools/schema",
        "@graphql-tools/merge",
      ],
    };
  }

  // Template content generators
  private getIndexTemplate(context: TemplateContext): string {
    return `import { app } from './app.js';
import { config } from './config/index.js';

const start = async () => {
  try {
    const address = await app.listen({
      port: config.port,
      host: config.host
    });
    
    console.log(\`🚀 ${context.className} server running at \${address}\`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
`;
  }

  private getAppTemplate(context: TemplateContext): string {
    return `import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';

export const app = Fastify({
  logger: true
});

// Register plugins
await app.register(cors);
await app.register(helmet);
await app.register(sensible);

// Register routes
app.get('/ping', async (request, reply) => {
  return { message: 'pong', timestamp: new Date().toISOString() };
});

app.get('/health', async (request, reply) => {
  return { 
    status: 'healthy',
    service: '${context.projectName}',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };
});
`;
  }

  private getConfigTemplate(context: TemplateContext): string {
    return `import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
    type: '${context.database}' as const
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  }
};
`;
  }

  private getPingRouteTemplate(): string {
    return `export default async function pingRoute(fastify: any) {
  fastify.get('/ping', async (request: any, reply: any) => {
    return { 
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });
}
`;
  }

  private getPulzarConfigTemplate(context: TemplateContext): string {
    return `import { defineConfig } from '@pulzar/core';

export default defineConfig({
  entry: 'src/index.ts',
  port: 3000,
  host: 'localhost',
  database: '${context.database}',
  build: {
    outDir: 'dist',
    minify: false,
    bundle: true
  },
  dev: {
    watch: true,
    hotReload: true
  }
});
`;
  }

  private getTsConfigTemplate(): string {
    return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;
  }

  private getEnvTemplate(context: TemplateContext): string {
    return `# Application
PORT=3000
HOST=localhost
NODE_ENV=development

# Database
DATABASE_URL=${context.database}://username:password@localhost:5432/${context.projectName}

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Development
DEBUG=pulzar:*
`;
  }

  private getReadmeTemplate(context: TemplateContext): string {
    return `# ${context.className}

${context.description}

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## 📋 Available Commands

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm start\` - Start production server
- \`npm test\` - Run tests
- \`npm run lint\` - Lint code

## 🛠️ Development

This project was created with Pulzar CLI.

- Framework: [Pulzar](https://pulzar.dev)
- Runtime: Node.js
- Language: TypeScript
- Database: ${context.database}

## 📚 Documentation

- [Pulzar Documentation](https://pulzar.dev/docs)
- [API Reference](https://pulzar.dev/api)

## 📄 License

MIT
`;
  }

  // Additional template methods would go here...
  private getAuthModuleTemplate(): string {
    return `// Auth module implementation`;
  }

  private getAuthControllerTemplate(): string {
    return `// Auth controller implementation`;
  }

  private getAuthServiceTemplate(): string {
    return `// Auth service implementation`;
  }

  private getUserModuleTemplate(): string {
    return `// User module implementation`;
  }

  private getUserControllerTemplate(): string {
    return `// User controller implementation`;
  }

  private getUserServiceTemplate(): string {
    return `// User service implementation`;
  }

  private getAuthGuardTemplate(): string {
    return `// Auth guard implementation`;
  }

  private getLoggingMiddlewareTemplate(): string {
    return `// Logging middleware implementation`;
  }

  private getClientPackageJsonTemplate(context: TemplateContext): string {
    return `// Client package.json`;
  }

  private getClientIndexTemplate(context: TemplateContext): string {
    return `// Client index.html`;
  }

  private getClientMainTemplate(): string {
    return `// Client main.ts`;
  }

  private getViteConfigTemplate(): string {
    return `// Vite config`;
  }

  private getUserEventsTemplate(): string {
    return `// User events`;
  }

  private getEventServiceTemplate(): string {
    return `// Event service`;
  }

  private getTracingMiddlewareTemplate(): string {
    return `// Tracing middleware`;
  }

  private getDockerComposeTemplate(context: TemplateContext): string {
    return `// Docker compose`;
  }

  private getDockerfileTemplate(): string {
    return `// Dockerfile`;
  }

  private getGraphQLSchemaTemplate(): string {
    return `// GraphQL schema`;
  }

  private getGraphQLResolverTemplate(): string {
    return `// GraphQL resolver`;
  }

  private getGraphQLTypesTemplate(): string {
    return `// GraphQL types`;
  }

  private async generateFiles(
    projectDir: string,
    template: ProjectTemplate,
    context: TemplateContext
  ): Promise<void> {
    for (const [filePath, content] of Object.entries(template.files)) {
      const fullPath = join(projectDir, filePath);
      const dir = dirname(fullPath);

      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content);
    }
  }

  private async generatePackageJson(
    projectDir: string,
    template: ProjectTemplate,
    context: TemplateContext
  ): Promise<void> {
    const packageJson = {
      name: context.projectName,
      version: "1.0.0",
      description: context.description,
      type: "module",
      main: "dist/index.js",
      scripts: template.scripts,
      dependencies: this.arrayToObject(template.dependencies),
      devDependencies: this.arrayToObject(template.devDependencies),
      keywords: ["pulzar", "nodejs", "typescript", "fastify"],
      author: context.author,
      license: "MIT",
    };

    await fs.writeFile(
      join(projectDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );
  }

  private async generateGitignore(
    projectDir: string,
    template: ProjectTemplate
  ): Promise<void> {
    const gitignore =
      template.gitignore ||
      `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Cache
.turbo/
.cache/

# Logs
logs/
*.log
`;

    await fs.writeFile(join(projectDir, ".gitignore"), gitignore.trim());
  }

  private async initializeGit(projectDir: string): Promise<void> {
    try {
      const { spawn } = await import("child_process");
      await new Promise((resolve, reject) => {
        const git = spawn("git", ["init"], {
          cwd: projectDir,
          stdio: "ignore",
        });
        git.on("close", resolve);
        git.on("error", reject);
      });
    } catch (error) {
      logger.warn("Failed to initialize git repository", { error });
    }
  }

  private async installDependencies(projectDir: string): Promise<void> {
    try {
      logger.info("Installing dependencies...");
      const { spawn } = await import("child_process");

      await new Promise((resolve, reject) => {
        const npm = spawn("npm", ["install"], {
          cwd: projectDir,
          stdio: "inherit",
        });
        npm.on("close", (code) => {
          if (code === 0) resolve(undefined);
          else reject(new Error(`npm install failed with code ${code}`));
        });
        npm.on("error", reject);
      });

      logger.success("Dependencies installed successfully!");
    } catch (error) {
      logger.error("Failed to install dependencies", { error });
      logger.info("You can install them manually with: npm install");
    }
  }

  private arrayToObject(arr: string[]): Record<string, string> {
    return arr.reduce(
      (obj, dep) => {
        obj[dep] = "^1.0.0"; // Default version, should be more specific
        return obj;
      },
      {} as Record<string, string>
    );
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  }
}

// Create default instance
export const templateEngine = new TemplateEngine();
