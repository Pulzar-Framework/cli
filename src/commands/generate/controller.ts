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

    const controllerContent = `import { Injectable, Inject } from "@ignite/core";
import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

// Validation schemas
const ${className.slice(0, -10)}ParamsSchema = z.object({
  id: z.string().uuid(),
});

const Create${className.slice(0, -10)}Schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  description: z.string().max(500).optional(),
});

const Update${className.slice(0, -10)}Schema = Create${className.slice(
      0,
      -10
    )}Schema.partial();

const ${className.slice(0, -10)}ResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

@Injectable()
export class ${className} {
  // TODO: Inject your services here
  // constructor(@Inject(${className.slice(
    0,
    -10
  )}Service) private ${name}Service: ${className.slice(0, -10)}Service) {}

  /**
   * Get all ${name}s
   */
  async getAll(
    request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>,
    reply: FastifyReply
  ) {
    try {
      const { page = 1, limit = 10 } = request.query;
      
      // TODO: Implement get all ${name}s logic
      // const ${name}s = await this.${name}Service.findAll({ page, limit });
      const ${name}s = [];
      
      return reply.code(200).send({
        success: true,
        data: ${name}s,
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        message: "${className} retrieved successfully",
      });
    } catch (error) {
      throw error; // Let Fastify error handler deal with it
    }
  }

  /**
   * Get ${name} by ID
   */
  async getById(
    request: FastifyRequest<{ Params: z.infer<typeof ${className.slice(
      0,
      -10
    )}ParamsSchema> }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      
      // TODO: Implement get ${name} by ID logic
      // const ${name} = await this.${name}Service.findById(id);
      const ${name} = { 
        id, 
        name: "Sample ${name}",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (!${name}) {
        return reply.code(404).send({
          success: false,
          message: "${className} not found",
        });
      }

      return reply.code(200).send({
        success: true,
        data: ${name},
        message: "${className} retrieved successfully",
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new ${name}
   */
  async create(
    request: FastifyRequest<{ Body: z.infer<typeof Create${className.slice(
      0,
      -10
    )}Schema> }>,
    reply: FastifyReply
  ) {
    try {
      const ${name}Data = request.body;
      
      // TODO: Implement create ${name} logic
      // const new${className.slice(
        0,
        -10
      )} = await this.${name}Service.create(${name}Data);
      const new${className.slice(0, -10)} = { 
        id: crypto.randomUUID(), 
        ...${name}Data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return reply.code(201).send({
        success: true,
        data: new${className.slice(0, -10)},
        message: "${className} created successfully",
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update ${name}
   */
  async update(
    request: FastifyRequest<{ 
      Params: z.infer<typeof ${className.slice(0, -10)}ParamsSchema>;
      Body: z.infer<typeof Update${className.slice(0, -10)}Schema>;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      // TODO: Implement update ${name} logic
      // const updated${className.slice(
        0,
        -10
      )} = await this.${name}Service.update(id, updateData);
      const updated${className.slice(0, -10)} = { 
        id, 
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      
      if (!updated${className.slice(0, -10)}) {
        return reply.code(404).send({
          success: false,
          message: "${className} not found",
        });
      }
      
      return reply.code(200).send({
        success: true,
        data: updated${className.slice(0, -10)},
        message: "${className} updated successfully",
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete ${name}
   */
  async delete(
    request: FastifyRequest<{ Params: z.infer<typeof ${className.slice(
      0,
      -10
    )}ParamsSchema> }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      
      // TODO: Implement delete ${name} logic
      // const deleted = await this.${name}Service.delete(id);
      const deleted = true;
      
      if (!deleted) {
        return reply.code(404).send({
          success: false,
          message: "${className} not found",
        });
      }
      
      return reply.code(200).send({
        success: true,
        message: "${className} deleted successfully",
      });
    } catch (error) {
      throw error;
    }
  }
}
`;

    await writeFileIfAbsent(filePath, controllerContent);
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
