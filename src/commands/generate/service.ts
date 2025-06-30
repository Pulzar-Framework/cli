import { logger } from "../../utils/logger";

export interface ServiceOptions {
  path: string;
}

export async function generateService(name: string, options: ServiceOptions) {
  try {
    logger.info(`Generating service: ${name}`, { options });

    const serviceFile = `${options.path}/${name}.service.ts`;
    const testFile = `${options.path}/${name}.service.test.ts`;

    // Service template
    const serviceTemplate = `import { Injectable } from '@ignite/core';

export interface ${name} {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Create${name}Data {
  name: string;
  email: string;
}

export interface Update${name}Data {
  name?: string;
  email?: string;
}

@Injectable()
export class ${name}Service {
  private ${name.toLowerCase()}s: ${name}[] = [];

  async findAll(): Promise<${name}[]> {
    // TODO: Implement database query
    return this.${name.toLowerCase()}s;
  }

  async findById(id: string): Promise<${name} | null> {
    // TODO: Implement database query
    return this.${name.toLowerCase()}s.find(item => item.id === id) || null;
  }

  async create(data: Create${name}Data): Promise<${name}> {
    // TODO: Implement database insert
    const new${name}: ${name} = {
      id: this.generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.${name.toLowerCase()}s.push(new${name});
    return new${name};
  }

  async update(id: string, data: Update${name}Data): Promise<${name} | null> {
    // TODO: Implement database update
    const index = this.${name.toLowerCase()}s.findIndex(item => item.id === id);
    
    if (index === -1) {
      return null;
    }

    this.${name.toLowerCase()}s[index] = {
      ...this.${name.toLowerCase()}s[index],
      ...data,
      updatedAt: new Date()
    };

    return this.${name.toLowerCase()}s[index];
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Implement database delete
    const index = this.${name.toLowerCase()}s.findIndex(item => item.id === id);
    
    if (index === -1) {
      return false;
    }

    this.${name.toLowerCase()}s.splice(index, 1);
    return true;
  }

  async findByEmail(email: string): Promise<${name} | null> {
    // TODO: Implement database query
    return this.${name.toLowerCase()}s.find(item => item.email === email) || null;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
`;

    // Test template
    const testTemplate = `import { describe, it, expect, beforeEach } from 'vitest';
import { ${name}Service, Create${name}Data } from './${name}.service';

describe('${name}Service', () => {
  let service: ${name}Service;

  beforeEach(() => {
    service = new ${name}Service();
  });

  describe('create', () => {
    it('should create a new ${name}', async () => {
      const data: Create${name}Data = {
        name: 'Test ${name}',
        email: 'test@example.com'
      };

      const result = await service.create(data);

      expect(result).toMatchObject({
        name: data.name,
        email: data.email
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('should find ${name} by id', async () => {
      const data: Create${name}Data = {
        name: 'Test ${name}',
        email: 'test@example.com'
      };

      const created = await service.create(data);
      const found = await service.findById(created.id);

      expect(found).toEqual(created);
    });

    it('should return null for non-existent id', async () => {
      const found = await service.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update ${name}', async () => {
      const data: Create${name}Data = {
        name: 'Test ${name}',
        email: 'test@example.com'
      };

      const created = await service.create(data);
      const updated = await service.update(created.id, { name: 'Updated ${name}' });

      expect(updated?.name).toBe('Updated ${name}');
      expect(updated?.email).toBe(data.email);
    });

    it('should return null for non-existent id', async () => {
      const updated = await service.update('non-existent', { name: 'Updated' });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete ${name}', async () => {
      const data: Create${name}Data = {
        name: 'Test ${name}',
        email: 'test@example.com'
      };

      const created = await service.create(data);
      const deleted = await service.delete(created.id);

      expect(deleted).toBe(true);

      const found = await service.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent id', async () => {
      const deleted = await service.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });
});
`;

    // Write files
    const fs = await import("fs/promises");
    await fs.writeFile(serviceFile, serviceTemplate);
    await fs.writeFile(testFile, testTemplate);

    logger.info(`Service generated successfully at: ${serviceFile}`);
    logger.info(`Test file generated at: ${testFile}`);
  } catch (error) {
    logger.error("Failed to generate service", { error });
    process.exit(1);
  }
}
