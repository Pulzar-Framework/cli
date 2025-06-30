import { logger } from "../../utils/logger";
import { writeFileIfAbsent } from "../../utils/file-utils";
import { join } from "path";

export interface MiddlewareOptions {
  path: string;
  type: string;
}

export async function generateMiddleware(
  name: string,
  options: MiddlewareOptions
) {
  try {
    logger.info(`Generating middleware: ${name}`, { options });

    const className = `${
      name.charAt(0).toUpperCase() + name.slice(1)
    }Middleware`;
    const fileName = `${name.toLowerCase()}.middleware.ts`;
    const filePath = join(options.path, fileName);

    let middlewareContent = "";

    switch (options.type) {
      case "auth":
        middlewareContent = generateAuthMiddleware(name, className);
        break;
      case "validation":
        middlewareContent = generateValidationMiddleware(name, className);
        break;
      case "logging":
        middlewareContent = generateLoggingMiddleware(name, className);
        break;
      default:
        middlewareContent = generateRequestMiddleware(name, className);
    }

    await writeFileIfAbsent(filePath, middlewareContent);
    logger.info(`Middleware created: ${filePath}`);
    logger.info(`Middleware ${name} generated successfully`);
  } catch (error) {
    logger.error(`Failed to generate middleware: ${name}`, { error });
    process.exit(1);
  }
}

function generateRequestMiddleware(name: string, className: string): string {
  return `import { Request, Response, NextFunction } from "express";
import { logger } from "@ignite/core";

export class ${className} {
  /**
   * ${className} middleware
   */
  static handle(req: Request, res: Response, next: NextFunction) {
    try {
      logger.debug("${className} middleware executing", {
        method: req.method,
        path: req.path,
        ip: req.ip
      });

      // TODO: Implement your middleware logic here
      
      next();
    } catch (error) {
      logger.error("${className} middleware error", { error });
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
}

export const ${name.toLowerCase()}Middleware = ${className}.handle;
`;
}

function generateAuthMiddleware(name: string, className: string): string {
  return `import { Request, Response, NextFunction } from "express";
import { logger } from "@ignite/core";

export class ${className} {
  /**
   * Authentication middleware
   */
  static handle(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Authorization header required"
        });
      }

      const token = authHeader.substring(7);
      
      // TODO: Implement token validation logic
      const user = validateToken(token);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token"
        });
      }

      // Attach user to request
      (req as any).user = user;
      
      next();
    } catch (error) {
      logger.error("${className} error", { error });
      res.status(500).json({
        success: false,
        message: "Authentication error"
      });
    }
  }
}

function validateToken(token: string): any {
  // TODO: Implement actual token validation
  // This could use JWT, session validation, etc.
  return { id: 1, email: "user@example.com" };
}

export const ${name.toLowerCase()}Middleware = ${className}.handle;
`;
}

function generateValidationMiddleware(name: string, className: string): string {
  return `import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "@ignite/core";

export class ${className} {
  /**
   * Validation middleware
   */
  static validate(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = schema.safeParse(req.body);
        
        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: result.error.errors
          });
        }

        // Replace request body with validated data
        req.body = result.data;
        
        next();
      } catch (error) {
        logger.error("${className} error", { error });
        res.status(500).json({
          success: false,
          message: "Validation error"
        });
      }
    };
  }
}

export const ${name.toLowerCase()}Middleware = ${className}.validate;
`;
}

function generateLoggingMiddleware(name: string, className: string): string {
  return `import { Request, Response, NextFunction } from "express";
import { logger } from "@ignite/core";

export class ${className} {
  /**
   * Request logging middleware
   */
  static handle(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    // Log incoming request
    logger.info("Incoming request", {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString()
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;
      
      logger.info("Request completed", {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: \`\${duration}ms\`,
        contentLength: res.get("Content-Length") || 0
      });
      
      originalEnd.call(this, chunk, encoding);
    };

    next();
  }
}

export const ${name.toLowerCase()}Middleware = ${className}.handle;
`;
}
