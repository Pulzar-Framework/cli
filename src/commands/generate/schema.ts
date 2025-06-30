import { logger } from "../../utils/logger";

export interface SchemaOptions {
  path: string;
}

export async function generateSchema(name: string, options: SchemaOptions) {
  try {
    logger.info(`Generating schema: ${name}`, { options });

    const schemaFile = `${options.path}/${name}.schema.ts`;

    // Schema template
    const schemaTemplate = `import { z } from 'zod';

// Base ${name} schema
export const ${name}Schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Create ${name} schema (without id and timestamps)
export const Create${name}Schema = ${name}Schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Update ${name} schema (partial, without timestamps)
export const Update${name}Schema = Create${name}Schema.partial();

// ${name} list response schema
export const ${name}ListSchema = z.object({
  data: z.array(${name}Schema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number()
  })
});

// Type exports
export type ${name} = z.infer<typeof ${name}Schema>;
export type Create${name} = z.infer<typeof Create${name}Schema>;
export type Update${name} = z.infer<typeof Update${name}Schema>;
export type ${name}List = z.infer<typeof ${name}ListSchema>;

// Validation functions
export const validate${name} = (data: unknown): ${name} => {
  return ${name}Schema.parse(data);
};

export const validateCreate${name} = (data: unknown): Create${name} => {
  return Create${name}Schema.parse(data);
};

export const validateUpdate${name} = (data: unknown): Update${name} => {
  return Update${name}Schema.parse(data);
};

export const validate${name}List = (data: unknown): ${name}List => {
  return ${name}ListSchema.parse(data);
};
`;

    // Write file
    const fs = await import("fs/promises");
    await fs.writeFile(schemaFile, schemaTemplate);

    logger.info(`Schema generated successfully at: ${schemaFile}`);
  } catch (error) {
    logger.error("Failed to generate schema", { error });
    process.exit(1);
  }
}
