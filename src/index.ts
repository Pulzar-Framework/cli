export const cli = "pulzar-cli";
export const version = "0.1.0";

// CLI utilities and types
export interface CLIOptions {
  template?: string;
  database?: string;
  port?: string;
  watch?: boolean;
  edge?: boolean;
  output?: string;
  coverage?: boolean;
}

// Simple logger utility
export const logger = {
  info: (message: string) => console.log(`ℹ️  ${message}`),
  success: (message: string) => console.log(`✅ ${message}`),
  error: (message: string) => console.error(`❌ ${message}`),
  warning: (message: string) => console.warn(`⚠️  ${message}`),
};

// Export version info
export const getVersion = () => version;
export const getCLIName = () => cli;
