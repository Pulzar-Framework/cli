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
        "src/main.ts": this.getMainTemplate(context),
        "src/services/app.service.ts": this.getAppServiceTemplate(),
        "pulzar.config.ts": this.getPulzarConfigTemplate(context),
        "tsconfig.json": this.getTsConfigTemplate(),
        "tsconfig.build.json": this.getBuildTsConfigTemplate(),
        ".env.example": this.getEnvTemplate(context),
        "README.md": this.getReadmeTemplate(context),
      },
      dependencies: ["@pulzar/core", "zod", "dotenv", "reflect-metadata"],
      devDependencies: [
        "typescript",
        "@types/node",
        "tsx",
        "nodemon",
        "@biomejs/biome",
      ],
      scripts: {
        dev: "tsx watch src/main.ts",
        build: "tsc --project tsconfig.build.json",
        start: "node dist/main.js",
        test: "echo 'No tests specified'",
        lint: "biome check src/",
        "lint:fix": "biome check --apply src/",
        "type-check": "tsc --noEmit",
      },
    };
  }

  private getApiTemplate(context: TemplateContext): ProjectTemplate {
    const basic = this.getBasicTemplate(context);
    return {
      ...basic,
      name: "api",
      description: "REST API with authentication and DI",
      files: {
        ...basic.files,
        "src/services/user.service.ts": this.getUserServiceTemplate(),
        "src/services/auth.service.ts": this.getAuthServiceTemplate(),
        "src/guards/auth.guard.ts": this.getAuthGuardTemplate(),
        "src/modules/auth.module.ts": this.getAuthModuleTemplate(),
        "src/modules/user.module.ts": this.getUserModuleTemplate(),
        "src/routes/auth/login.post.ts": this.getLoginRouteTemplate(),
        "src/routes/auth/register.post.ts": this.getRegisterRouteTemplate(),
        "src/routes/users/index.get.ts": this.getUsersListRouteTemplate(),
        "src/routes/users/[id].get.ts": this.getUserByIdRouteTemplate(),
        "src/routes/users/[id].put.ts": this.getUpdateUserRouteTemplate(),
        "src/schemas/user.schema.ts": this.getUserSchemaTemplate(),
        "src/schemas/auth.schema.ts": this.getAuthSchemaTemplate(),
      },
      dependencies: [...basic.dependencies, "bcryptjs", "jsonwebtoken"],
      devDependencies: [
        ...basic.devDependencies,
        "@types/bcryptjs",
        "@types/jsonwebtoken",
      ],
    };
  }

  private getFullstackTemplate(context: TemplateContext): ProjectTemplate {
    const api = this.getApiTemplate(context);
    return {
      ...api,
      name: "fullstack",
      description: "Full-stack application with static file serving",
      files: {
        ...api.files,
        "public/index.html": this.getClientIndexTemplate(context),
        "public/style.css": this.getClientStyleTemplate(),
        "public/app.js": this.getClientAppTemplate(),
        "src/routes/static.get.ts": this.getStaticRouteTemplate(),
      },
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
        "src/services/event.service.ts": this.getEventServiceTemplate(),
        "src/events/user.events.ts": this.getUserEventsTemplate(),
        "src/routes/events/publish.post.ts":
          this.getPublishEventRouteTemplate(),
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
        "src/graphql/resolvers/user.resolver.ts":
          this.getGraphQLResolverTemplate(),
        "src/graphql/schema.ts": this.getGraphQLSchemaTemplate(),
        "src/services/graphql.service.ts": this.getGraphQLServiceTemplate(),
        "src/routes/graphql.post.ts": this.getGraphQLRouteTemplate(),
      },
      dependencies: [...basic.dependencies, "mercurius", "graphql"],
    };
  }

  // Template content generators - Updated to use Pulzar patterns
  private getMainTemplate(context: TemplateContext): string {
    return `import 'reflect-metadata';
import { createFastifyAdapter, defineConfig, logger } from '@pulzar/core';

async function bootstrap() {
  try {
    // Load configuration
    const config = defineConfig({
      app: {
        name: '${context.projectName}',
        version: '1.0.0',
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || 'localhost',
        env: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      },
      cors: {
        enabled: true,
        origin: '*',
        credentials: true,
      },
      compression: {
        enabled: true,
        level: 6,
      },
      security: {
        helmet: {
          enabled: true,
        },
        rateLimit: {
          enabled: true,
          windowMs: 15 * 60 * 1000,
          max: 100,
        },
      },
      logging: {
        level: 'info',
        format: 'json',
      },
      database: {},
      redis: {},
      jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: '24h',
      },
      openapi: {
        enabled: process.env.NODE_ENV !== 'production',
        path: '/docs',
        title: '${context.className} API',
        version: '1.0.0',
      },
      tracing: {
        enabled: false,
        serviceName: '${context.projectName}',
      },
    });

    // Create Fastify adapter
    const adapter = createFastifyAdapter({
      logger: true,
    });

    const app = adapter.getInstance();

    // Add custom routes
    app.get('/hello', async (request, reply) => {
      const name = (request.query as any)?.name || 'World';
      return {
        message: \`Hello, \${name}!\`,
        timestamp: new Date().toISOString(),
        query: { name },
      };
    });

    app.get('/api/info', async (request, reply) => {
      return {
        name: '${context.projectName}',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      };
    });

    // Start server
    await adapter.listen(config.app.port, config.app.host);
    
    logger.info(\`🚀 ${context.className} server running on http://\${config.app.host}:\${config.app.port}\`);
    logger.info(\`📖 API Documentation: http://\${config.app.host}:\${config.app.port}\${config.openapi.path}\`);
  } catch (error) {
    console.error('Bootstrap error:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
`;
  }

  private getHelloRouteTemplate(): string {
    return `import { z } from 'zod';

// Query schema
const QuerySchema = z.object({
  name: z.string().default('World'),
});

// Response schema
const ResponseSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
  query: z.object({
    name: z.string(),
  }),
});

export default async function helloRoute(request: any, reply: any) {
  try {
    const query = QuerySchema.parse(request.query);
    
    return {
      message: \`Hello, \${query.name}!\`,
      timestamp: new Date().toISOString(),
      query,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    throw error;
  }
}

// Route metadata for OpenAPI
export const schema = {
  querystring: QuerySchema,
  response: {
    200: ResponseSchema,
  },
};

export const summary = 'Hello World endpoint';
export const description = 'Returns a greeting message';
export const tags = ['General'];
`;
  }

  private getHealthRouteTemplate(): string {
    return `import { z } from 'zod';

// Response schema
const HealthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  uptime: z.number(),
  version: z.string(),
  environment: z.string(),
});

export default async function healthRoute(request: any, reply: any) {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };
}

// Route metadata for OpenAPI
export const schema = {
  response: {
    200: HealthResponseSchema,
  },
};

export const summary = 'Health check endpoint';
export const description = 'Returns service health status and metrics';
export const tags = ['Health'];
`;
  }

  private getAppServiceTemplate(): string {
    return `import { Injectable, logger } from '@pulzar/core';

@Injectable()
export class AppService {
  constructor() {
    logger.info('AppService initialized');
  }

  getAppInfo() {
    return {
      name: 'Pulzar Application',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  }

  async healthCheck() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    };
  }
}
`;
  }

  private getPulzarConfigTemplate(context: TemplateContext): string {
    return `import { defineConfig } from '@pulzar/core';

export default defineConfig({
  app: {
    name: '${context.projectName}',
    version: '1.0.0',
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    env: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  },
  cors: {
    enabled: true,
    origin: process.env.NODE_ENV === 'production' ? 'false' : '*',
    credentials: true,
  },
  compression: {
    enabled: true,
    level: 6,
  },
  security: {
    helmet: {
      enabled: true,
    },
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },
  logging: {
    level: 'info',
    format: 'json',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '24h',
  },
  openapi: {
    enabled: process.env.NODE_ENV !== 'production',
    path: '/docs',
    title: '${context.className} API',
    version: '1.0.0',
  },
  tracing: {
    enabled: process.env.OTEL_ENABLED === 'true',
    serviceName: '${context.projectName}',
  },
});
`;
  }

  private getTsConfigTemplate(): string {
    return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "pulzar.config.ts"],
  "exclude": ["node_modules", "dist"]
}
`;
  }

  private getBuildTsConfigTemplate(): string {
    return `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "moduleResolution": "node",
    "allowImportingTsExtensions": false,
    "noEmit": false,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
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

# Optional Features
OTEL_ENABLED=false
CORS_ORIGIN=*
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
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
    return `import { Module } from '@pulzar/core';
import { AuthService } from '../services/auth.service.js';

@Module({
  name: 'AuthModule',
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
`;
  }

  private getUserModuleTemplate(): string {
    return `import { Module } from '@pulzar/core';
import { UserService } from '../services/user.service.js';

@Module({
  name: 'UserModule',
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
`;
  }

  private getAuthServiceTemplate(): string {
    return `import { Injectable, logger } from '@pulzar/core';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor() {
    logger.info('AuthService initialized');
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: Record<string, any>): string {
    return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: '24h',
    });
  }

  verifyToken(token: string): Record<string, any> | null {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'secret') as Record<string, any>;
    } catch {
      return null;
    }
  }

  async login(email: string, password: string) {
    // TODO: Implement user lookup and password validation
    // This is a placeholder implementation
    if (email === 'admin@example.com' && password === 'password') {
      return {
        user: { id: 1, email, name: 'Admin User' },
        token: this.generateToken({ id: 1, email }),
      };
    }
    throw new Error('Invalid credentials');
  }

  async register(userData: { email: string; password: string; name: string }) {
    // TODO: Implement user creation
    // This is a placeholder implementation
    const hashedPassword = await this.hashPassword(userData.password);
    const user = {
      id: Date.now(),
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
    };
    
    return {
      user: { id: user.id, email: user.email, name: user.name },
      token: this.generateToken({ id: user.id, email: user.email }),
    };
  }
}
`;
  }

  private getUserServiceTemplate(): string {
    return `import { Injectable, logger } from '@pulzar/core';

@Injectable()
export class UserService {
  constructor() {
    logger.info('UserService initialized');
  }

  async findAll() {
    // TODO: Implement database query
    // This is a placeholder implementation
    return [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];
  }

  async findById(id: string) {
    // TODO: Implement database query
    // This is a placeholder implementation
    const users = await this.findAll();
    return users.find(user => user.id.toString() === id);
  }

  async create(userData: { name: string; email: string }) {
    // TODO: Implement database insertion
    // This is a placeholder implementation
    return {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString(),
    };
  }

  async update(id: string, userData: Partial<{ name: string; email: string }>) {
    // TODO: Implement database update
    // This is a placeholder implementation
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      ...user,
      ...userData,
      updatedAt: new Date().toISOString(),
    };
  }

  async delete(id: string) {
    // TODO: Implement database deletion
    // This is a placeholder implementation
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    return { success: true };
  }
}
`;
  }

  private getAuthGuardTemplate(): string {
    return `import { logger } from '@pulzar/core';
import jwt from 'jsonwebtoken';

export function authGuard(request: any, reply: any, done: any) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Authorization header required' });
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // Add user info to request
    request.user = decoded;
    done();
  } catch (error) {
    logger.error('Auth guard error:', error);
    return reply.code(401).send({ error: 'Invalid token' });
  }
}
`;
  }

  private getLoginRouteTemplate(): string {
    return `import { z } from 'zod';

// Request schema
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Response schema
const LoginResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
  }),
  token: z.string(),
});

export default async function loginRoute(request: any, reply: any) {
  const body = LoginSchema.parse(request.body);
  
  // TODO: Inject AuthService using DI
  // This is a placeholder implementation
  if (body.email === 'admin@example.com' && body.password === 'password') {
    return {
      user: { id: 1, email: body.email, name: 'Admin User' },
      token: 'mock-jwt-token-' + Date.now(),
    };
  }
  
  return reply.code(401).send({ error: 'Invalid credentials' });
}

// Route metadata for OpenAPI
export const schema = {
  summary: 'User login',
  description: 'Authenticate user and return JWT token',
  tags: ['Authentication'],
  body: LoginSchema,
  response: {
    200: LoginResponseSchema,
    401: z.object({ error: z.string() }),
  },
};
`;
  }

  private getRegisterRouteTemplate(): string {
    return `import { z } from 'zod';

// Request schema
const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

// Response schema
const RegisterResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
  }),
  token: z.string(),
});

export default async function registerRoute(request: any, reply: any) {
  const body = RegisterSchema.parse(request.body);
  
  // TODO: Inject AuthService using DI
  // This is a placeholder implementation
  const user = {
    id: Date.now(),
    email: body.email,
    name: body.name,
  };
  
  return {
    user,
    token: 'mock-jwt-token-' + Date.now(),
  };
}

// Route metadata for OpenAPI
export const schema = {
  summary: 'User registration',
  description: 'Register new user and return JWT token',
  tags: ['Authentication'],
  body: RegisterSchema,
  response: {
    201: RegisterResponseSchema,
    400: z.object({ error: z.string() }),
  },
};
`;
  }

  private getUsersListRouteTemplate(): string {
    return `import { z } from 'zod';

// Query schema
const QuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// Response schema
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string().optional(),
});

const UsersListResponseSchema = z.object({
  users: z.array(UserSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});

export default async function getUsersListRoute(request: any, reply: any) {
  const query = QuerySchema.parse(request.query);
  
  // TODO: Inject UserService using DI
  // This is a placeholder implementation
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date().toISOString() },
  ];
  
  return {
    users,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: users.length,
    },
  };
}

// Route metadata for OpenAPI
export const schema = {
  summary: 'List users',
  description: 'Get paginated list of users',
  tags: ['Users'],
  querystring: QuerySchema,
  response: {
    200: UsersListResponseSchema,
  },
};
`;
  }

  private getUserByIdRouteTemplate(): string {
    return `import { z } from 'zod';

// Params schema
const ParamsSchema = z.object({
  id: z.string(),
});

// Response schema
const UserResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export default async function getUserByIdRoute(request: any, reply: any) {
  const params = ParamsSchema.parse(request.params);
  
  // TODO: Inject UserService using DI
  // This is a placeholder implementation
  const user = {
    id: parseInt(params.id),
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date().toISOString(),
  };
  
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }
  
  return user;
}

// Route metadata for OpenAPI
export const schema = {
  summary: 'Get user by ID',
  description: 'Retrieve a specific user by their ID',
  tags: ['Users'],
  params: ParamsSchema,
  response: {
    200: UserResponseSchema,
    404: z.object({ error: z.string() }),
  },
};
`;
  }

  private getUserSchemaTemplate(): string {
    return `import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
  email: z.string().email(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
`;
  }

  private getAuthSchemaTemplate(): string {
    return `import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
  }),
  token: z.string(),
});

export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
`;
  }

  private getUpdateUserRouteTemplate(): string {
    return `import { z } from 'zod';

// Params schema
const ParamsSchema = z.object({
  id: z.string(),
});

// Body schema
const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

// Response schema
const UserResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  updatedAt: z.string(),
});

export default async function updateUserRoute(request: any, reply: any) {
  const params = ParamsSchema.parse(request.params);
  const body = UpdateUserSchema.parse(request.body);
  
  // TODO: Inject UserService using DI
  // This is a placeholder implementation
  const user = {
    id: parseInt(params.id),
    name: body.name || 'John Doe',
    email: body.email || 'john@example.com',
    updatedAt: new Date().toISOString(),
  };
  
  return user;
}

// Route metadata for OpenAPI
export const schema = {
  summary: 'Update user',
  description: 'Update user information',
  tags: ['Users'],
  params: ParamsSchema,
  body: UpdateUserSchema,
  response: {
    200: UserResponseSchema,
    404: z.object({ error: z.string() }),
  },
};
`;
  }

  private getClientStyleTemplate(): string {
    return `/* Basic styles for Pulzar app */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.api-section {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.api-section h3 {
  margin-top: 0;
  color: #007bff;
}

code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Consolas', monospace;
}

.btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
}

.btn:hover {
  background: #0056b3;
}

#result {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  white-space: pre-wrap;
}
`;
  }

  private getClientAppTemplate(): string {
    return `// Simple JavaScript for testing API endpoints
async function testEndpoint(url, method = 'GET', body = null) {
  const result = document.getElementById('result');
  result.textContent = 'Loading...';
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    result.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    result.textContent = 'Error: ' + error.message;
  }
}

// Test functions for different endpoints
function testHealth() {
  testEndpoint('/health');
}

function testHello() {
  const name = prompt('Enter your name:') || 'World';
  testEndpoint(\`/hello?name=\${encodeURIComponent(name)}\`);
}

function testUsers() {
  testEndpoint('/users');
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  console.log('Pulzar client app loaded');
});
`;
  }

  private getStaticRouteTemplate(): string {
    return `import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const ParamsSchema = z.object({
  '*': z.string().optional(),
});

export default async function staticRoute(request: any, reply: any) {
  const params = ParamsSchema.parse(request.params);
  const filePath = params['*'] || 'index.html';
  const fullPath = join(process.cwd(), 'public', filePath);
  
  if (!existsSync(fullPath)) {
    return reply.code(404).send({ error: 'File not found' });
  }
  
  try {
    const content = readFileSync(fullPath);
    const ext = extname(filePath);
    
    // Set appropriate content type
    const contentTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    reply.header('Content-Type', contentType);
    
    return content;
  } catch (error) {
    return reply.code(500).send({ error: 'Failed to read file' });
  }
}

// Route metadata for OpenAPI
export const schema = {
  summary: 'Serve static files',
  description: 'Serve static files from the public directory',
  tags: ['Static'],
  params: ParamsSchema,
};
`;
  }

  private getEventServiceTemplate(): string {
    return `import { Injectable } from '@pulzar/core';
import { logger } from '@pulzar/core';

@Injectable()
export class EventService {
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    logger.info('EventService initialized');
  }

  emit(eventName: string, data: any) {
    const listeners = this.listeners.get(eventName) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        logger.error(\`Error in event listener for \${eventName}:\`, error);
      }
    });
  }

  on(eventName: string, listener: Function) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
  }

  off(eventName: string, listener: Function) {
    const listeners = this.listeners.get(eventName) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  async publishEvent(eventName: string, payload: any) {
    // TODO: Implement external event publishing (Kafka, NATS, etc.)
    logger.info(\`Publishing event: \${eventName}\`, { payload });
    this.emit(eventName, payload);
  }
}
`;
  }

  private getPublishEventRouteTemplate(): string {
    return `import { z } from 'zod';

// Body schema
const PublishEventSchema = z.object({
  eventName: z.string(),
  payload: z.any(),
});

// Response schema
const PublishEventResponseSchema = z.object({
  success: z.boolean(),
  eventId: z.string(),
  timestamp: z.string(),
});

export default async function publishEventRoute(request: any, reply: any) {
  const body = PublishEventSchema.parse(request.body);
  
  // TODO: Inject EventService using DI
  // This is a placeholder implementation
  const eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Simulate event publishing
  console.log(\`Publishing event: \${body.eventName}\`, body.payload);
  
  return {
    success: true,
    eventId,
    timestamp: new Date().toISOString(),
  };
}

// Route metadata for OpenAPI
export const schema = {
  summary: 'Publish event',
  description: 'Publish an event to the event bus',
  tags: ['Events'],
  body: PublishEventSchema,
  response: {
    200: PublishEventResponseSchema,
  },
};
`;
  }

  private getClientIndexTemplate(context: TemplateContext): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${context.className} - Pulzar App</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="container">
    <h1>🚀 ${context.className}</h1>
    <p>Welcome to your Pulzar application!</p>
    
    <div class="api-section">
      <h3>🔍 Test API Endpoints</h3>
      <button class="btn" onclick="testHealth()">Health Check</button>
      <button class="btn" onclick="testHello()">Hello World</button>
      <button class="btn" onclick="testUsers()">Get Users</button>
    </div>
    
    <div id="result"></div>
    
    <div class="api-section">
      <h3>📖 API Documentation</h3>
      <p>Visit <code><a href="/docs" target="_blank">/docs</a></code> for interactive API documentation</p>
    </div>
  </div>
  
  <script src="/app.js"></script>
</body>
</html>
`;
  }

  private getUserEventsTemplate(): string {
    return `import { Injectable, logger } from '@pulzar/core';

export interface UserEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  userId: string;
  data: Record<string, any>;
  timestamp: string;
}

@Injectable()
export class UserEventHandler {
  constructor() {
    logger.info('UserEventHandler initialized');
  }

  async handleUserCreated(event: UserEvent) {
    logger.info('User created event', { event });
    // TODO: Implement user creation event handling
    // e.g., send welcome email, create user profile, etc.
  }

  async handleUserUpdated(event: UserEvent) {
    logger.info('User updated event', { event });
    // TODO: Implement user update event handling
  }

  async handleUserDeleted(event: UserEvent) {
    logger.info('User deleted event', { event });
    // TODO: Implement user deletion event handling
  }
}
`;
  }

  private getTracingMiddlewareTemplate(): string {
    return `import { logger } from '@pulzar/core';

export interface TracingOptions {
  serviceName?: string;
  enableMetrics?: boolean;
  enableTracing?: boolean;
}

export function createTracingMiddleware(options: TracingOptions = {}) {
  const config = {
    serviceName: options.serviceName || 'pulzar-service',
    enableMetrics: options.enableMetrics ?? true,
    enableTracing: options.enableTracing ?? true,
  };

  return {
    preHandler: async (request: any, reply: any) => {
      const startTime = process.hrtime.bigint();
      
      // Add request ID
      const requestId = \`req_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
      request.requestId = requestId;
      
      // Add tracing headers
      reply.header('X-Request-ID', requestId);
      reply.header('X-Service-Name', config.serviceName);
      
      logger.info('Request started', {
        requestId,
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
      });

      // Store start time for duration calculation
      request.startTime = startTime;
    },

    onSend: async (request: any, reply: any, payload: any) => {
      if (request.startTime) {
        const duration = Number(process.hrtime.bigint() - request.startTime) / 1e6; // Convert to milliseconds
        
        logger.info('Request completed', {
          requestId: request.requestId,
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
          duration: \`\${duration.toFixed(2)}ms\`,
        });
      }
      
      return payload;
    },
  };
}
`;
  }

  private getDockerComposeTemplate(context: TemplateContext): string {
    return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://postgres:password@db:5432/${context.projectName}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=production-secret-change-me
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${context.projectName}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
`;
  }

  private getDockerfileTemplate(): string {
    return `# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S pulzar -u 1001

# Copy built application
COPY --from=builder --chown=pulzar:nodejs /app/dist ./dist
COPY --from=builder --chown=pulzar:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=pulzar:nodejs /app/package*.json ./

# Set user
USER pulzar

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/main.js"]
`;
  }

  private getGraphQLSchemaTemplate(): string {
    return `import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLList, GraphQLID, GraphQLNonNull } from 'graphql';
import { logger } from '@pulzar/core';

// User Type
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: GraphQLString },
  },
});

// Root Query
const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    hello: {
      type: GraphQLString,
      args: {
        name: { type: GraphQLString },
      },
      resolve: (parent, args) => {
        const name = args.name || 'World';
        return \`Hello, \${name}!\`;
      },
    },
    
    users: {
      type: new GraphQLList(UserType),
      resolve: async () => {
        // TODO: Fetch from database
        logger.info('Fetching users from GraphQL');
        return [
          { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date().toISOString() },
        ];
      },
    },

    user: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args) => {
        // TODO: Fetch from database
        logger.info('Fetching user by ID', { id: args.id });
        return {
          id: args.id,
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
        };
      },
    },
  },
});

// Root Mutation
const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser: {
      type: UserType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        // TODO: Save to database
        logger.info('Creating user', args);
        return {
          id: Date.now().toString(),
          name: args.name,
          email: args.email,
          createdAt: new Date().toISOString(),
        };
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
`;
  }

  private getGraphQLResolverTemplate(): string {
    return `import { Injectable, logger } from '@pulzar/core';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

@Injectable()
export class UserResolver {
  constructor() {
    logger.info('UserResolver initialized');
  }

  // Query resolvers
  async getUsers(): Promise<User[]> {
    logger.info('Resolving users query');
    
    // TODO: Fetch from database
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async getUserById(id: string): Promise<User | null> {
    logger.info('Resolving user by ID', { id });
    
    // TODO: Fetch from database
    if (id === '1') {
      return {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date().toISOString(),
      };
    }
    
    return null;
  }

  // Mutation resolvers
  async createUser(input: { name: string; email: string }): Promise<User> {
    logger.info('Creating user', input);
    
    // TODO: Save to database
    const user: User = {
      id: Date.now().toString(),
      name: input.name,
      email: input.email,
      createdAt: new Date().toISOString(),
    };
    
    return user;
  }

  async updateUser(id: string, input: Partial<{ name: string; email: string }>): Promise<User | null> {
    logger.info('Updating user', { id, input });
    
    // TODO: Update in database
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      return null;
    }
    
    return {
      ...existingUser,
      ...input,
    };
  }

  async deleteUser(id: string): Promise<boolean> {
    logger.info('Deleting user', { id });
    
    // TODO: Delete from database
    const user = await this.getUserById(id);
    return !!user;
  }
}
`;
  }

  private getGraphQLServiceTemplate(): string {
    return `import { Injectable } from '@pulzar/core';
import { logger } from '@pulzar/core';

@Injectable()
export class GraphQLService {
  constructor() {
    logger.info('GraphQLService initialized');
  }

  async executeQuery(query: string, variables?: any) {
    // TODO: Implement GraphQL query execution
    logger.info('Executing GraphQL query', { query, variables });
    return { data: null };
  }

  getSchema() {
    // TODO: Return GraphQL schema
    return \`
      type Query {
        hello: String
      }
    \`;
  }
}
`;
  }

  private getGraphQLRouteTemplate(): string {
    return `import { z } from 'zod';

// Body schema for GraphQL requests
const GraphQLRequestSchema = z.object({
  query: z.string(),
  variables: z.record(z.any()).optional(),
  operationName: z.string().optional(),
});

export default async function graphqlRoute(request: any, reply: any) {
  const body = GraphQLRequestSchema.parse(request.body);
  
  // TODO: Inject GraphQLService using DI and execute query
  // This is a placeholder implementation
  return {
    data: {
      hello: "Hello from GraphQL!"
    }
  };
}

// Route metadata for OpenAPI
export const schema = {
  summary: 'GraphQL endpoint',
  description: 'Execute GraphQL queries and mutations',
  tags: ['GraphQL'],
  body: GraphQLRequestSchema,
  response: {
    200: z.object({
      data: z.any(),
      errors: z.array(z.any()).optional(),
    }),
  },
};
`;
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
        obj[dep] = "latest";
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
