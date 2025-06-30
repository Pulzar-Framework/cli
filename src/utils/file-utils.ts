import { join } from "path";
import { promises as fs } from "fs";
import { dirname } from "path";

export interface ProjectOptions {
  template: string;
  skipPrompts: boolean;
}

export interface ProjectTemplate {
  name: string;
  description: string;
  files: TemplateFile[];
}

export interface TemplateFile {
  path: string;
  content: string;
  isDirectory: boolean;
}

export async function createProject(
  name: string,
  options: ProjectOptions
): Promise<void> {
  // In a real implementation, this would:
  // 1. Validate project name
  // 2. Check if directory exists
  // 3. Load template
  // 4. Copy files
  // 5. Update package.json
  // 6. Install dependencies

  console.log(`Creating project: ${name}`);
  console.log(`Template: ${options.template}`);
  console.log(`Skip prompts: ${options.skipPrompts}`);

  // Placeholder implementation
  return Promise.resolve();
}

export async function writeFileIfAbsent(
  filePath: string,
  content: string,
  force = false
): Promise<void> {
  try {
    // Check if file exists
    if (!force) {
      try {
        await fs.access(filePath);
        console.log(`File already exists, skipping: ${filePath}`);
        return;
      } catch {
        // File doesn't exist, proceed with creation
      }
    }

    // Ensure directory exists
    const dir = dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, content, "utf8");
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error}`);
  }
}

export function validateProjectName(name: string): boolean {
  // Basic validation
  return /^[a-z0-9-]+$/.test(name) && name.length > 0;
}

export function getProjectPath(name: string): string {
  return join(process.cwd(), name);
}

export function getTemplatePath(template: string): string {
  return join(__dirname, "..", "templates", template);
}
