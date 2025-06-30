import { logger } from "../../utils/logger";
import { writeFileIfAbsent } from "../../utils/file-utils";
import { join } from "path";

export interface InterceptorOptions {
  path: string;
}

export async function generateInterceptor(
  name: string,
  options: InterceptorOptions
) {
  try {
    logger.info(`Generating interceptor: ${name}`, { options });

    const className = `${
      name.charAt(0).toUpperCase() + name.slice(1)
    }Interceptor`;
    const fileName = `${name.toLowerCase()}.interceptor.ts`;
    const filePath = join(options.path, fileName);

    const interceptorContent = `import { Injectable } from "@ignite/core";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class ${className} {
  /**
   * Intercept incoming request
   */
  intercept(req: Request, res: Response, next: NextFunction): void {
    try {
      // Pre-processing
      this.beforeRequest(req);
      
      // Override response methods to intercept response
      this.interceptResponse(res);
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Interceptor error"
      });
    }
  }

  private beforeRequest(req: Request): void {
    // TODO: Implement pre-request logic
    console.log(\`Intercepting request: \${req.method} \${req.path}\`);
  }

  private interceptResponse(res: Response): void {
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // TODO: Implement response transformation
      const transformedBody = {
        ...body,
        timestamp: new Date().toISOString(),
        interceptedBy: "${className}"
      };
      
      return originalJson.call(this, transformedBody);
    };
  }
}

export const ${name.toLowerCase()}Interceptor = new ${className}();
`;

    await writeFileIfAbsent(filePath, interceptorContent);
    logger.info(`Interceptor created: ${filePath}`);
    logger.info(`Interceptor ${name} generated successfully`);
  } catch (error) {
    logger.error(`Failed to generate interceptor: ${name}`, { error });
    process.exit(1);
  }
}
