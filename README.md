# 🚀 Pulzar CLI

<div align="center">

[![npm version](https://badge.fury.io/js/@pulzar%2Fcli.svg)](https://badge.fury.io/js/@pulzar%2Fcli)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Downloads](https://img.shields.io/npm/dm/@pulzar/cli.svg)](https://www.npmjs.com/package/@pulzar/cli)

**The ultimate command-line interface for Pulzar framework**

_Build modern Node.js applications with zero-reflection DI, GraphQL, WebSockets, events, and edge runtime support_

[Quick Start](#-quick-start) • [Commands](#-commands) • [Examples](#-examples) • [Documentation](https://pulzar.dev)

</div>

---

## ✨ Features

- 🚀 **Project Scaffolding** - Create new Pulzar projects with predefined templates
- 🔧 **Development Server** - Hot-reload enabled development environment
- 📦 **Smart Building** - Production builds with edge runtime support
- 🧪 **Testing Suite** - Integrated testing with coverage reports
- 🛠️ **Code Generation** - Scaffold controllers, services, modules, and more
- 🔍 **Health Diagnostics** - Comprehensive project health checks
- 🎯 **Zero-Reflection DI** - Advanced dependency injection container building
- 📊 **Performance Analysis** - Built-in performance profiling tools
- 🔒 **Security Auditing** - Automated security vulnerability scanning
- 🐋 **Docker Integration** - Container building and deployment tools
- 🔌 **Plugin Management** - Install and manage Pulzar plugins
- 📝 **OpenAPI Generation** - Automatic API documentation generation
- 🗄️ **Database Tools** - Migration, seeding, and studio commands
- 📈 **Monitoring** - Application performance monitoring
- 🎨 **Code Linting** - Integrated Biome linting and formatting

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @pulzar/cli
# or
yarn global add @pulzar/cli
# or
pnpm add -g @pulzar/cli
```

### Project Installation

```bash
npm install --save-dev @pulzar/cli
# or
yarn add -D @pulzar/cli
# or
pnpm add -D @pulzar/cli
```

## 🚀 Quick Start

```bash
# Create a new Pulzar project
pulzar new my-app

# Navigate to project
cd my-app

# Start development server
pulzar dev

# Build for production
pulzar build

# Run health checks
pulzar doctor
```

## 📋 Commands

### 🔨 Project Management

#### `pulzar new <name>`

Create a new Pulzar project with advanced scaffolding.

```bash
pulzar new my-api                    # Basic API project
pulzar new my-app --template fullstack  # Full-stack application
pulzar new my-service --database mongodb # With MongoDB
```

**Options:**

- `-t, --template <template>` - Project template (api, fullstack, microservice)
- `--database <db>` - Database type (postgresql, mysql, mongodb, sqlite)
- `--skip-install` - Skip dependency installation

---

### 🔧 Development

#### `pulzar dev`

Start the development server with hot-reload and advanced debugging.

```bash
pulzar dev                          # Start on localhost:3000
pulzar dev --port 8080             # Custom port
pulzar dev --host 0.0.0.0          # Bind to all interfaces
```

**Options:**

- `-p, --port <port>` - Port number (default: 3000)
- `-h, --host <host>` - Host address (default: localhost)
- `--watch` - Enable file watching (default: true)
- `--debug` - Enable debug mode

---

### 📦 Building

#### `pulzar build`

Build your application for production with optimizations.

```bash
pulzar build                        # Standard build
pulzar build --edge                 # Edge runtime build
pulzar build --minify              # Minified build
pulzar build --out dist-prod       # Custom output directory
```

**Options:**

- `--edge` - Build for edge runtime (Cloudflare Workers, Vercel Edge)
- `--minify` - Minify output for smaller bundle size
- `-o, --out <dir>` - Output directory (default: dist)
- `--analyze` - Analyze bundle size

#### `pulzar build-di`

Build zero-reflection dependency injection container from source code.

```bash
pulzar build-di                     # Build DI container
pulzar build-di --watch            # Watch mode
pulzar build-di --source-dir lib   # Custom source directory
```

**Options:**

- `-s, --source-dir <dir>` - Source directory (default: src)
- `-o, --output-file <file>` - Output file for container
- `-w, --watch` - Watch for changes and rebuild
- `--no-validate` - Skip validation

---

### 🧪 Testing

#### `pulzar test`

Run your test suite with coverage and reporting.

```bash
pulzar test                         # Run all tests
pulzar test --coverage             # With coverage report
pulzar test --watch                # Watch mode
pulzar test --ui                   # Interactive UI
```

**Options:**

- `--coverage` - Generate coverage report
- `--watch` - Watch mode for development
- `--ui` - Launch interactive test UI
- `--reporter <type>` - Test reporter (json, html, verbose)

---

### 🛠️ Code Generation

#### `pulzar generate <type> <name>`

Generate boilerplate code for various components.

```bash
# Controllers and Routes
pulzar generate controller UserController
pulzar generate route auth/login

# Services and Modules
pulzar generate service UserService
pulzar generate module AuthModule

# GraphQL Components
pulzar generate graphql UserResolver
pulzar generate schema User

# Real-time Features
pulzar generate websocket ChatGateway
pulzar generate event UserCreatedEvent

# Middleware and Guards
pulzar generate middleware AuthMiddleware
pulzar generate guard AdminGuard
pulzar generate interceptor LoggingInterceptor
pulzar generate pipe ValidationPipe

# Background Processing
pulzar generate task EmailTask
pulzar generate decorator CacheResult
```

**Available Types:**

- `controller` - REST API controllers
- `service` - Business logic services
- `module` - Feature modules
- `route` - API routes
- `graphql` - GraphQL resolvers
- `schema` - Data schemas
- `websocket` - WebSocket gateways
- `event` - Event handlers
- `task` - Background tasks
- `middleware` - HTTP middleware
- `guard` - Authentication guards
- `interceptor` - Request interceptors
- `pipe` - Data transformation pipes
- `decorator` - Custom decorators

---

### 🔍 Diagnostics & Health

#### `pulzar doctor`

Comprehensive health check and diagnostics for your project.

```bash
pulzar doctor                       # Full health check
pulzar doctor --fix                # Auto-fix issues
pulzar doctor --config            # Check configuration only
pulzar doctor --deps              # Check dependencies only
pulzar doctor --security          # Security audit only
```

**Options:**

- `--fix` - Automatically fix detected issues
- `--verbose` - Detailed output
- `--config` - Check configuration files
- `--deps` - Check dependencies
- `--types` - Check TypeScript setup
- `--lint` - Check code quality
- `--security` - Security vulnerability scan
- `--performance` - Performance analysis

#### `pulzar info`

Display project and environment information.

```bash
pulzar info                         # Project information
pulzar info --system              # System information
pulzar info --dependencies        # Dependency tree
```

---

### 🎨 Code Quality

#### `pulzar lint`

Lint and format your code using Biome.

```bash
pulzar lint                         # Lint all files
pulzar lint --fix                  # Auto-fix issues
pulzar lint src/controllers/      # Lint specific directory
```

**Options:**

- `--fix` - Automatically fix linting issues
- `--check` - Check without fixing
- `--format` - Format code only

---

### 🔒 Security

#### `pulzar security audit`

Run security audit and vulnerability scanning.

```bash
pulzar security audit              # Security audit
pulzar security audit --fix       # Auto-fix vulnerabilities
pulzar security audit --report    # Generate security report
```

---

### 📊 Performance

#### `pulzar perf analyze`

Analyze application performance and bottlenecks.

```bash
pulzar perf analyze                 # Performance analysis
pulzar perf analyze --profile      # CPU profiling
pulzar perf analyze --memory       # Memory analysis
```

---

### 🐋 Docker Operations

#### `pulzar docker build`

Build Docker containers for your application.

```bash
pulzar docker build                # Build container
pulzar docker build --tag my-app  # Custom tag
pulzar docker run                  # Run container
```

---

### 🔌 Plugin Management

#### `pulzar plugin <action>`

Manage Pulzar plugins and extensions.

```bash
pulzar plugin add @pulzar/redis    # Install plugin
pulzar plugin list                 # List installed plugins
pulzar plugin remove redis         # Remove plugin
```

---

### 🗄️ Database Operations

#### `pulzar db <action>`

Database management and migrations.

```bash
pulzar db migrate                   # Run migrations
pulzar db seed                     # Seed database
pulzar db studio                   # Launch database studio
```

---

### 📝 API Documentation

#### `pulzar openapi`

Generate and serve OpenAPI documentation.

```bash
pulzar openapi generate            # Generate OpenAPI spec
pulzar openapi serve              # Serve documentation
```

---

### 📈 Monitoring

#### `pulzar monitor`

Application monitoring and observability.

```bash
pulzar monitor start               # Start monitoring
pulzar monitor status             # Check status
```

---

### 🚀 Deployment

#### `pulzar deploy`

Deploy your application to various platforms.

```bash
pulzar deploy                      # Deploy to configured platform
pulzar deploy --platform vercel   # Deploy to Vercel
pulzar deploy --platform cloudflare # Deploy to Cloudflare
```

---

### 📈 Events Management

#### `pulzar events <action>`

Manage event bus and messaging.

```bash
pulzar events publish <event>      # Publish event
pulzar events status              # Event bus status
pulzar events dlq                 # Manage dead letter queue
```

---

### ⬆️ Maintenance

#### `pulzar upgrade`

Upgrade Pulzar and dependencies to latest versions.

```bash
pulzar upgrade                     # Upgrade Pulzar
pulzar upgrade --all              # Upgrade all dependencies
pulzar upgrade --interactive      # Interactive upgrade
```

## 💡 Examples

### Creating a Complete API

```bash
# Create new project
pulzar new todo-api --template api --database postgresql

# Navigate and start development
cd todo-api
pulzar dev

# Generate API components
pulzar generate controller TodoController
pulzar generate service TodoService
pulzar generate module TodoModule

# Add authentication
pulzar generate guard AuthGuard
pulzar generate middleware JwtMiddleware

# Add real-time features
pulzar generate websocket TodoGateway
pulzar generate event TodoCreatedEvent

# Build for production
pulzar build --minify

# Run health check
pulzar doctor --fix
```

### GraphQL API Development

```bash
# Create GraphQL project
pulzar new graphql-api --template graphql

# Generate GraphQL components
pulzar generate graphql UserResolver
pulzar generate schema User
pulzar generate schema Post

# Start development with GraphQL playground
pulzar dev --graphql

# Generate API documentation
pulzar openapi generate
```

### Microservice Development

```bash
# Create microservice
pulzar new user-service --template microservice

# Add event-driven features
pulzar generate event UserRegisteredEvent
pulzar generate event UserUpdatedEvent

# Add background processing
pulzar generate task EmailNotificationTask
pulzar generate task DataSyncTask

# Deploy to production
pulzar build --edge
pulzar deploy --platform cloudflare
```

## 🔧 Configuration

### CLI Configuration

Create a `.pulzarrc.json` file in your project root:

```json
{
  "defaultTemplate": "api",
  "defaultDatabase": "postgresql",
  "codeGeneration": {
    "typescript": true,
    "decorators": true,
    "validation": true
  },
  "build": {
    "minify": true,
    "sourceMap": true,
    "target": "es2022"
  },
  "dev": {
    "port": 3000,
    "host": "localhost",
    "watch": true,
    "hotReload": true
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/pulzar-framework/pulzar/blob/main/CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/pulzar-framework/pulzar.git
cd pulzar

# Install dependencies
npm install

# Build CLI
npm run build

# Link for development
npm link

# Test CLI
pulzar --help
```

## 📚 Documentation

- [📖 Documentation](https://pulzar.dev)
- [🚀 Quick Start Guide](https://pulzar.dev/getting-started)
- [📘 API Reference](https://pulzar.dev/api-reference)
- [💼 Examples](https://pulzar.dev/examples)
- [🔌 Plugins](https://pulzar.dev/plugins)

## 🆘 Support & Community

- [💬 Discord Community](https://discord.gg/pulzar)
- [📧 Email Support](mailto:support@pulzar.dev)
- [🐛 Bug Reports](https://github.com/pulzar-framework/pulzar/issues)
- [💡 Feature Requests](https://github.com/pulzar-framework/pulzar/discussions)

## 📄 License

MIT © [Pulzar Team](https://github.com/pulzar-framework)

---

<div align="center">
<strong>Built with ❤️ by the Pulzar community</strong><br>
<sub>Making Node.js development faster, better, and more enjoyable</sub>
</div>
