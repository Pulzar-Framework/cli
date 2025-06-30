import { logger } from "../../utils/logger";
import { writeFileIfAbsent } from "../../utils/file-utils";
import { join } from "path";

export interface PipeOptions {
  path: string;
}

export async function generatePipe(name: string, options: PipeOptions) {
  try {
    logger.info(`Generating pipe: ${name}`, { options });

    const className = `${name.charAt(0).toUpperCase() + name.slice(1)}Pipe`;
    const fileName = `${name.toLowerCase()}.pipe.ts`;
    const filePath = join(options.path, fileName);

    const pipeContent = `import { Injectable } from "@ignite/core";

@Injectable()
export class ${className} {
  /**
   * Transform data
   */
  transform(value: any, ...args: any[]): any {
    try {
      // TODO: Implement transformation logic
      return this.transformValue(value, args);
    } catch (error) {
      throw new Error(\`${className} transformation failed: \${error.message}\`);
    }
  }

  private transformValue(value: any, args: any[]): any {
    // TODO: Implement your transformation logic here
    return value;
  }
}

export const ${name.toLowerCase()}Pipe = new ${className}();
`;

    await writeFileIfAbsent(filePath, pipeContent);
    logger.info(`Pipe created: ${filePath}`);
    logger.info(`Pipe ${name} generated successfully`);
  } catch (error) {
    logger.error(`Failed to generate pipe: ${name}`, { error });
    process.exit(1);
  }
}
