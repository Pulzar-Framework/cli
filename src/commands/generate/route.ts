import { logger } from "../../utils/logger";

export interface RouteOptions {
  method: string;
  path: string;
}

export async function generateRoute(name: string, options: RouteOptions) {
  try {
    logger.info(`Generating route: ${name}`, { options });

    const routeFile = `${options.path}/${name}.${options.method}.ts`;

    // Route template for Fastify
    const routeTemplate = `import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// Request validation schemas
const ${name}ParamsSchema = z.object({
  id: z.string().optional(),
});

const ${name}BodySchema = z.object({
  // TODO: Define your request body fields
  name: z.string(),
  email: z.string().email(),
});

const ${name}QuerySchema = z.object({
  // TODO: Define your query parameters
  limit: z.number().int().positive().max(100).default(10),
  offset: z.number().int().min(0).default(0),
});

// Response schema
const ${name}ResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Route configuration for Fastify
export const route = {
  method: '${options.method.toUpperCase()}' as const,
  url: '/${name}${
      options.method === "get" && name.endsWith("s") ? "" : "/:id"
    }',
  schema: {
    summary: '${name} ${options.method}',
    description: '${name} ${options.method} endpoint',
    tags: ['${name}'],
    ${options.method !== "get" ? `params: ${name}ParamsSchema,` : ""}
    ${
      options.method === "post" ||
      options.method === "put" ||
      options.method === "patch"
        ? `body: ${name}BodySchema,`
        : ""
    }
    querystring: ${name}QuerySchema,
    response: {
      200: ${name}ResponseSchema,
      400: z.object({
        error: z.string(),
        details: z.array(z.object({
          field: z.string(),
          message: z.string(),
        })),
      }),
      404: z.object({
        error: z.string(),
      }),
      500: z.object({
        error: z.string(),
      }),
    },
  },
  handler: ${options.method}${name.charAt(0).toUpperCase() + name.slice(1)},
};

interface RequestType extends FastifyRequest {
  params: z.infer<typeof ${name}ParamsSchema>;
  body: z.infer<typeof ${name}BodySchema>;
  query: z.infer<typeof ${name}QuerySchema>;
}

export async function ${options.method}${
      name.charAt(0).toUpperCase() + name.slice(1)
    }(
  request: RequestType,
  reply: FastifyReply
) {
  try {
    // TODO: Implement your route logic here
    
    // Access validated data
    const { id } = request.params;
    const query = request.query;
    ${
      options.method === "post" ||
      options.method === "put" ||
      options.method === "patch"
        ? "const body = request.body;"
        : ""
    }
    
    // Example implementation
    const result = {
      id: id || crypto.randomUUID(),
      name: ${
        options.method === "post" ||
        options.method === "put" ||
        options.method === "patch"
          ? "body.name"
          : `'Example ${name}'`
      },
      email: ${
        options.method === "post" ||
        options.method === "put" ||
        options.method === "patch"
          ? "body.email"
          : `'example@example.com'`
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Return validated response
    return reply.code(200).send(result);
    
  } catch (error) {
    // Error handling is automatically done by Fastify error handler
    throw error;
  }
}
`;

    // Write file
    const fs = await import("fs/promises");
    await fs.writeFile(routeFile, routeTemplate);

    logger.info(`Route generated successfully at: ${routeFile}`);
  } catch (error) {
    logger.error("Failed to generate route", { error });
    process.exit(1);
  }
}
