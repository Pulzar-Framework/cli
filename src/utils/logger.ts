export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LoggerOptions {
  level: LogLevel;
  enableColors: boolean;
}

export class Logger {
  private options: LoggerOptions;

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      level: LogLevel.INFO,
      enableColors: true,
      ...options,
    };
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  success(message: string): void {
    console.log(`✓ ${message}`);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): void {
    if (level > this.options.level) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";

    const output = `[${timestamp}] ${levelName}: ${message}${contextStr}`;
    console.log(output);
  }

  setLevel(level: LogLevel): void {
    this.options.level = level;
  }
}

// Default logger instance
export const logger = new Logger();

// Factory function
export function createLogger(options?: Partial<LoggerOptions>): Logger {
  return new Logger(options);
}
