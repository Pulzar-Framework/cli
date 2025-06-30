import { logger } from "../../utils/logger";
import { writeFileIfAbsent } from "../../utils/file-utils";
import { join } from "path";

export interface GuardOptions {
  path: string;
  type: string;
}

export async function generateGuard(name: string, options: GuardOptions) {
  try {
    logger.info(`Generating guard: ${name}`, { options });

    const className = `${name.charAt(0).toUpperCase() + name.slice(1)}Guard`;
    const fileName = `${name.toLowerCase()}.guard.ts`;
    const filePath = join(options.path, fileName);

    const guardContent = `import { Injectable } from "@ignite/core";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class ${className} {
  /**
   * Guard implementation
   */
  canActivate(req: Request, res: Response, next: NextFunction): boolean {
    try {
      // TODO: Implement guard logic
      const isAllowed = this.checkAccess(req);
      
      if (!isAllowed) {
        res.status(403).json({
          success: false,
          message: "Access denied"
        });
        return false;
      }
      
      return true;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Guard error"
      });
      return false;
    }
  }

  private checkAccess(req: Request): boolean {
    // TODO: Implement access check logic
    return true;
  }
}

export const ${name.toLowerCase()}Guard = new ${className}();
`;

    await writeFileIfAbsent(filePath, guardContent);
    logger.info(`Guard created: ${filePath}`);
    logger.info(`Guard ${name} generated successfully`);
  } catch (error) {
    logger.error(`Failed to generate guard: ${name}`, { error });
    process.exit(1);
  }
}
