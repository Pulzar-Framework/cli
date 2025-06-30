import { logger } from "../../utils/logger";
import { writeFileIfAbsent } from "../../utils/file-utils";
import { join } from "path";

export interface DecoratorOptions {
  path: string;
  type: string;
}

export async function generateDecorator(
  name: string,
  options: DecoratorOptions
) {
  try {
    logger.info(`Generating decorator: ${name}`, { options });

    const decoratorName = `${name.charAt(0).toUpperCase() + name.slice(1)}`;
    const fileName = `${name.toLowerCase()}.decorator.ts`;
    const filePath = join(options.path, fileName);

    let decoratorContent = "";

    switch (options.type) {
      case "class":
        decoratorContent = generateClassDecorator(decoratorName);
        break;
      case "method":
        decoratorContent = generateMethodDecorator(decoratorName);
        break;
      case "property":
        decoratorContent = generatePropertyDecorator(decoratorName);
        break;
      case "parameter":
        decoratorContent = generateParameterDecorator(decoratorName);
        break;
      default:
        decoratorContent = generateClassDecorator(decoratorName);
    }

    await writeFileIfAbsent(filePath, decoratorContent);
    logger.info(`Decorator created: ${filePath}`);
    logger.info(`Decorator ${name} generated successfully`);
  } catch (error) {
    logger.error(`Failed to generate decorator: ${name}`, { error });
    process.exit(1);
  }
}

function generateClassDecorator(name: string): string {
  return `import "reflect-metadata";

/**
 * ${name} class decorator
 */
export function ${name}(options?: any): ClassDecorator {
  return function (target: any) {
    // TODO: Implement decorator logic
    Reflect.defineMetadata("${name.toLowerCase()}", options || {}, target);
    
    console.log(\`${name} decorator applied to class: \${target.name}\`);
    
    return target;
  };
}
`;
}

function generateMethodDecorator(name: string): string {
  return `import "reflect-metadata";

/**
 * ${name} method decorator
 */
export function ${name}(options?: any): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // TODO: Implement decorator logic
    Reflect.defineMetadata("${name.toLowerCase()}", options || {}, target, propertyKey);
    
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      console.log(\`${name} decorator: calling \${String(propertyKey)}\`);
      
      // Call original method
      const result = originalMethod.apply(this, args);
      
      return result;
    };
    
    return descriptor;
  };
}
`;
}

function generatePropertyDecorator(name: string): string {
  return `import "reflect-metadata";

/**
 * ${name} property decorator
 */
export function ${name}(options?: any): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // TODO: Implement decorator logic
    Reflect.defineMetadata("${name.toLowerCase()}", options || {}, target, propertyKey);
    
    console.log(\`${name} decorator applied to property: \${String(propertyKey)}\`);
  };
}
`;
}

function generateParameterDecorator(name: string): string {
  return `import "reflect-metadata";

/**
 * ${name} parameter decorator
 */
export function ${name}(options?: any): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // TODO: Implement decorator logic
    const existingParams = Reflect.getMetadata("${name.toLowerCase()}", target, propertyKey) || [];
    existingParams[parameterIndex] = options || {};
    Reflect.defineMetadata("${name.toLowerCase()}", existingParams, target, propertyKey);
    
    console.log(\`${name} decorator applied to parameter \${parameterIndex} of \${String(propertyKey)}\`);
  };
}
`;
}
