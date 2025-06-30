export interface TemplateContext {
  [key: string]: any;
}

export interface TemplateOptions {
  delimiter?: string;
  escape?: string;
}

export class TemplateEngine {
  private delimiter: string;
  private escape: string;

  constructor(options: TemplateOptions = {}) {
    this.delimiter = options.delimiter || "{{}}";
    this.escape = options.escape || "\\";
  }

  /**
   * Render a template with the given context
   */
  render(template: string, context: TemplateContext): string {
    const [startDelim, endDelim] = this.parseDelimiter();

    return template.replace(
      new RegExp(
        `${this.escape}?${startDelim}([^${endDelim}]+)${endDelim}`,
        "g"
      ),
      (match, expression) => {
        if (match.startsWith(this.escape)) {
          return match.slice(1); // Return literal
        }

        return this.evaluateExpression(expression.trim(), context);
      }
    );
  }

  /**
   * Parse delimiter into start and end parts
   */
  private parseDelimiter(): [string, string] {
    const mid = Math.floor(this.delimiter.length / 2);
    return [this.delimiter.slice(0, mid), this.delimiter.slice(mid)];
  }

  /**
   * Evaluate an expression in the context
   */
  private evaluateExpression(
    expression: string,
    context: TemplateContext
  ): string {
    // Handle simple variable access
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expression)) {
      return this.getValue(context, expression) || "";
    }

    // Handle property access (e.g., user.name)
    if (
      /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(expression)
    ) {
      return this.getValue(context, expression) || "";
    }

    // Handle conditional expressions
    if (expression.includes("?")) {
      return this.evaluateConditional(expression, context);
    }

    // Handle function calls
    if (expression.includes("(")) {
      return this.evaluateFunction(expression, context);
    }

    return "";
  }

  /**
   * Get a value from context using dot notation
   */
  private getValue(context: TemplateContext, path: string): any {
    return path.split(".").reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : undefined;
    }, context);
  }

  /**
   * Evaluate conditional expressions (e.g., condition ? value1 : value2)
   */
  private evaluateConditional(
    expression: string,
    context: TemplateContext
  ): string {
    const parts = expression.split("?");
    if (parts.length !== 2) return "";

    const condition = parts[0].trim();
    const choices = parts[1].split(":");

    if (choices.length !== 2) return "";

    const trueValue = choices[0].trim();
    const falseValue = choices[1].trim();

    const conditionValue = this.evaluateCondition(condition, context);
    return conditionValue ? trueValue : falseValue;
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(
    condition: string,
    context: TemplateContext
  ): boolean {
    // Handle simple truthy checks
    const value = this.getValue(context, condition);

    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.length > 0;
    if (typeof value === "number") return value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return value !== null;

    return false;
  }

  /**
   * Evaluate function calls (e.g., toLowerCase(name))
   */
  private evaluateFunction(
    expression: string,
    context: TemplateContext
  ): string {
    const match = expression.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/);
    if (!match) return "";

    const [, funcName, argsStr] = match;
    const args = argsStr.split(",").map((arg) => arg.trim());

    const func = this.getBuiltinFunction(funcName);
    if (!func) return "";

    const resolvedArgs = args.map((arg) => this.getValue(context, arg));
    return func(...resolvedArgs);
  }

  /**
   * Get built-in functions
   */
  private getBuiltinFunction(
    name: string
  ): ((...args: any[]) => string) | null {
    const functions: Record<string, (...args: any[]) => string> = {
      toLowerCase: (str: string) => String(str).toLowerCase(),
      toUpperCase: (str: string) => String(str).toUpperCase(),
      capitalize: (str: string) =>
        String(str).charAt(0).toUpperCase() +
        String(str).slice(1).toLowerCase(),
      camelCase: (str: string) =>
        str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")),
      kebabCase: (str: string) =>
        str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(),
      snakeCase: (str: string) =>
        str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase(),
      pluralize: (str: string) =>
        str.endsWith("y") ? str.slice(0, -1) + "ies" : str + "s",
      singularize: (str: string) =>
        str.endsWith("ies") ? str.slice(0, -3) + "y" : str.replace(/s$/, ""),
      join: (...args: any[]) => args.join(""),
      concat: (...args: any[]) => args.join(""),
    };

    return functions[name] || null;
  }

  /**
   * Check if a template has any variables
   */
  hasVariables(template: string): boolean {
    const [startDelim, endDelim] = this.parseDelimiter();
    const regex = new RegExp(
      `${this.escape}?${startDelim}[^${endDelim}]+${endDelim}`
    );
    return regex.test(template);
  }

  /**
   * Extract all variables from a template
   */
  extractVariables(template: string): string[] {
    const [startDelim, endDelim] = this.parseDelimiter();
    const regex = new RegExp(
      `${this.escape}?${startDelim}([^${endDelim}]+)${endDelim}`,
      "g"
    );
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      if (!match[0].startsWith(this.escape)) {
        variables.push(match[1].trim());
      }
    }

    return [...new Set(variables)];
  }
}

// Create default instance
export const templateEngine = new TemplateEngine();

// Convenience functions
export function renderTemplate(
  template: string,
  context: TemplateContext
): string {
  return templateEngine.render(template, context);
}

export function hasTemplateVariables(template: string): boolean {
  return templateEngine.hasVariables(template);
}

export function extractTemplateVariables(template: string): string[] {
  return templateEngine.extractVariables(template);
}
