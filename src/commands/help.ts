import { Command } from "commander";
import { logger } from "../utils/logger.js";

export const helpCommand = new Command("help")
  .description("Show help information")
  .action(() => {
    console.log(`
🚀 Pulzar CLI - Modern Node.js Framework

USAGE:
  pulzar <command> [options]

COMMANDS:
  Project Management:
    new <n>           Create a new Pulzar project
    init              Initialize Pulzar in existing project
    dev               Start development server with hot reload
    build             Build application for production

  Code Generation:
    generate          Generate code from templates:
      route           Generate a new route
      service         Generate a new service
      middleware      Generate a new middleware
      schema          Generate a new Zod schema
      module          Generate a new module
      controller      Generate a new controller
      guard           Generate a new guard
      interceptor     Generate a new interceptor
      pipe            Generate a new pipe
      decorator       Generate a new decorator
      websocket       Generate WebSocket gateway
      graphql         Generate GraphQL resolvers
      task            Generate a scheduled task
      event           Generate an event handler

  Database Operations:
    db migrate        Run database migrations
    db seed           Seed the database with initial data
    db studio         Open database management studio
    db generate       Generate Prisma client

  Testing & Quality:
    test              Run tests with Vitest
    lint              Lint and format code with Biome
    doctor            Run health checks and diagnostics

  Deployment:
    deploy            Deploy to various platforms:
      cloudflare      Deploy to Cloudflare Workers
      vercel          Deploy to Vercel Edge Functions
      deno            Deploy to Deno Deploy
      docker          Build and deploy Docker container

  Plugin Management:
    plugin            Manage plugins:
      add <name>      Install and configure a plugin
      remove <name>   Remove a plugin
      list            List installed plugins

  Maintenance:
    info              Show project and system information
    upgrade           Upgrade Pulzar packages and dependencies
    openapi           Generate OpenAPI documentation
    config            Manage configuration:
      init            Initialize configuration
      validate        Validate configuration
    monitor           Performance monitoring and analysis
    security          Security audit and analysis
    perf              Performance analysis and optimization

GLOBAL OPTIONS:
  -h, --help        Show help for command
  -V, --version     Show version number
  -v, --verbose     Enable verbose logging
  --silent          Suppress all output except errors

EXAMPLES:
  📦 pulzar new - Create a new Pulzar project
    pulzar new my-api
    pulzar new blog --template api --features auth,redis

  🔧 Development workflow:
    pulzar dev                    # Start development server
    pulzar generate route users   # Generate new route
    pulzar test                   # Run tests
    pulzar build                  # Build for production

  🚀 Deployment:
    pulzar deploy cloudflare      # Deploy to Cloudflare Workers
    pulzar deploy vercel          # Deploy to Vercel Edge Functions

  📊 Monitoring:
    pulzar doctor                 # Health check
    pulzar info                   # Project information
    pulzar perf analyze           # Performance analysis

TEMPLATES:
  basic                      Basic Pulzar application
  api                        REST API with database
  graphql                    GraphQL API
  microservice              Microservice template
  edge                      Edge-optimized application

DOCUMENTATION:
  📖 Documentation: https://docs.pulzar.dev
  🐛 Report issues: https://github.com/pulzar/pulzar/issues
  💬 Get help: https://discord.gg/pulzar
    `);
  });
