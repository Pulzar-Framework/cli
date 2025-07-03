import { logger } from "../../utils/logger";

export interface RouteOptions {
  method: string;
  path: string;
}

async function writeFileIfAbsent(filePath: string, content: string) {
  const { dirname } = await import("path");
  const { mkdir, writeFile, access } = await import("fs/promises");

  try {
    await access(filePath);
    logger.warn(`File already exists, skipping: ${filePath}`);
  } catch {
    // File doesn't exist, create it
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
  }
}

export async function generateRoute(name: string, options: RouteOptions) {
  try {
    logger.info(`Generating route: ${name}`, { options });

    const routeFile = `${options.path}/${name}.${options.method}.ts`;

    // Route template for Pulzar framework
    const routeTemplate = `import { z } from 'zod';

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

// Route handler function
export default async function ${name}Route(request: any, reply: any) {
  try {
    // Parse and validate request data
    ${options.method !== "get" ? `const params = ${name}ParamsSchema.parse(request.params);` : ""}
    ${
      options.method === "post" ||
      options.method === "put" ||
      options.method === "patch"
        ? `const body = ${name}BodySchema.parse(request.body);`
        : ""
    }
    const query = ${name}QuerySchema.parse(request.query);

    // TODO: Implement your business logic here
    // You can inject services using DI in the future
    
    ${
      options.method === "post"
        ? `// Create new resource
    const newResource = {
      id: Date.now().toString(),
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return reply.code(201).send(newResource);`
        : options.method === "get" && name.endsWith("s")
          ? `// List resources
    const resources = [
      {
        id: "1",
        name: "Example Resource",
        email: "example@example.com",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    return {
      data: resources,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: resources.length,
      },
    };`
          : options.method === "get"
            ? `// Get single resource
    const resource = {
      id: params?.id || "1",
      name: "Example Resource",
      email: "example@example.com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return resource;`
            : options.method === "put" || options.method === "patch"
              ? `// Update resource
    const updatedResource = {
      id: params.id,
      name: body.name,
      email: body.email,
      createdAt: "2023-01-01T00:00:00.000Z", // Keep original
      updatedAt: new Date().toISOString(),
    };
    
    return updatedResource;`
              : options.method === "delete"
                ? `// Delete resource
    // TODO: Implement delete logic
    
    return reply.code(204).send();`
                : `// TODO: Implement ${options.method} logic
    return { message: "${name} ${options.method} endpoint" };`
    }
  } catch (error) {
    // Validation errors are automatically handled by Zod
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    // Other errors
    logger.error(\`Error in ${name} route:\`, error);
    return reply.code(500).send({
      error: 'Internal server error',
    });
  }
}

// Route metadata for OpenAPI documentation
export const schema = {
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
    ${options.method === "post" ? "201" : "200"}: ${name}ResponseSchema,
    400: z.object({
      error: z.string(),
      details: z.array(z.object({
        field: z.string(),
        message: z.string(),
      })),
    }),
    ${
      options.method !== "delete"
        ? `404: z.object({
      error: z.string(),
    }),`
        : ""
    }
    500: z.object({
      error: z.string(),
    }),
  },
};
`;

    await writeFileIfAbsent(routeFile, routeTemplate);
    logger.success(`✅ Route created: ${routeFile}`);
  } catch (error) {
    logger.error("Failed to generate route", { error });
    throw error;
  }
}
