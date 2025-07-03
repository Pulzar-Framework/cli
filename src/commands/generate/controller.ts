import { logger } from "../../utils/logger";
import { writeFileIfAbsent } from "../../utils/file-utils";
import { join } from "path";

export interface ControllerOptions {
  path: string;
  withRoutes: boolean;
}

export async function generateController(
  name: string,
  options: ControllerOptions
) {
  try {
    logger.info(`Generating controller: ${name}`, { options });

    const className = `${
      name.charAt(0).toUpperCase() + name.slice(1)
    }Controller`;
    const fileName = `${name.toLowerCase()}.controller.ts`;
    const filePath = join(options.path, fileName);

    const controllerTemplate = `import { Injectable } from '@pulzar/core';
import { logger } from '@pulzar/core';
import { z } from 'zod';

// Validation schemas
const Get${className}QuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

const ${className}ParamsSchema = z.object({
  id: z.string().uuid(),
});

const Create${className}Schema = z.object({
  // TODO: Define your entity fields
  name: z.string().min(1),
  description: z.string().optional(),
});

const Update${className}Schema = z.object({
  // TODO: Define your entity fields
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const ${className}ResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

@Injectable()
export class ${className}Service {
  constructor() {
    logger.info('${className}Service initialized');
  }

  async findMany(query: z.infer<typeof Get${className}QuerySchema>) {
    // TODO: Implement database query
    logger.info('Finding ${className.toLowerCase()}s', { query });
    
    // Mock data for now
    const items = [
      {
        id: '1',
        name: 'Example ${className}',
        description: 'This is an example ${className.toLowerCase()}',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return {
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: items.length,
      },
    };
  }

  async findById(id: string) {
    // TODO: Implement database query
    logger.info('Finding ${className.toLowerCase()} by ID', { id });
    
    if (!id) {
      throw new Error('${className} not found');
    }

    return {
      id,
      name: 'Example ${className}',
      description: 'This is an example ${className.toLowerCase()}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async create(data: z.infer<typeof Create${className}Schema>) {
    // TODO: Implement database creation
    logger.info('Creating ${className.toLowerCase()}', { data });
    
    const newItem = {
      id: crypto.randomUUID(),
      ...data,
      description: data.description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newItem;
  }

  async update(id: string, data: z.infer<typeof Update${className}Schema>) {
    // TODO: Implement database update
    logger.info('Updating ${className.toLowerCase()}', { id, data });
    
    const existing = await this.findById(id);
    
    return {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }

  async delete(id: string) {
    // TODO: Implement database deletion
    logger.info('Deleting ${className.toLowerCase()}', { id });
    
    await this.findById(id); // Ensure it exists
    
    return { success: true };
  }
}

export {
  Get${className}QuerySchema,
  ${className}ParamsSchema,
  Create${className}Schema,
  Update${className}Schema,
  ${className}ResponseSchema,
};
`;

    await writeFileIfAbsent(filePath, controllerTemplate);
    logger.info(`Controller created: ${filePath}`);

    if (options.withRoutes) {
      await generateRoutes(name, options.path);
    }

    logger.info(`Controller ${name} generated successfully`);
  } catch (error) {
    logger.error(`Failed to generate controller: ${name}`, { error });
    process.exit(1);
  }
}

async function generateRoutes(name: string, basePath: string) {
  const routesPath = join(basePath, "..", "routes", name.toLowerCase());

  const routes = [
    {
      file: `${name.toLowerCase()}.get.ts`,
      content: `import { ${
        name.charAt(0).toUpperCase() + name.slice(1)
      }Controller } from "../controllers/${name.toLowerCase()}.controller";

export default {
  path: "/${name.toLowerCase()}",
  method: "GET",
  handler: ${
    name.charAt(0).toUpperCase() + name.slice(1)
  }Controller.prototype.getAll,
  middleware: [],
  schema: {
    tags: ["${name}"],
    summary: "Get all ${name}s",
    responses: {
      200: {
        description: "List of ${name}s",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                data: { type: "array" },
                message: { type: "string" }
              }
            }
          }
        }
      }
    }
  }
};
`,
    },
    {
      file: `${name.toLowerCase()}.post.ts`,
      content: `import { ${
        name.charAt(0).toUpperCase() + name.slice(1)
      }Controller } from "../controllers/${name.toLowerCase()}.controller";

export default {
  path: "/${name.toLowerCase()}",
  method: "POST",
  handler: ${
    name.charAt(0).toUpperCase() + name.slice(1)
  }Controller.prototype.create,
  middleware: [],
  schema: {
    tags: ["${name}"],
    summary: "Create new ${name}",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" }
            },
            required: ["name"]
          }
        }
      }
    },
    responses: {
      201: {
        description: "${name} created successfully"
      }
    }
  }
};
`,
    },
  ];

  for (const route of routes) {
    const routeFilePath = join(routesPath, route.file);
    await writeFileIfAbsent(routeFilePath, route.content);
    logger.info(`Route created: ${routeFilePath}`);
  }
}
