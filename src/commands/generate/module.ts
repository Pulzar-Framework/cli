import { logger } from "../../utils/logger";
import { writeFileIfAbsent } from "../../utils/file-utils";

export interface ModuleOptions {
  path: string;
}

export async function generateModule(name: string, options: ModuleOptions) {
  try {
    logger.info(`Generating module: ${name}`, { options });

    const modulePath = `${options.path}/${name}`;
    const moduleFile = `${modulePath}/index.ts`;
    const serviceFile = `${modulePath}/${name}.service.ts`;
    const controllerFile = `${modulePath}/${name}.controller.ts`;

    // Module template
    const moduleTemplate = `import { Module } from '@ignite/core';
import { ${name}Service } from './${name}.service';
import { ${name}Controller } from './${name}.controller';

@Module({
  name: '${name}',
  providers: [${name}Service],
  controllers: [${name}Controller],
  exports: [${name}Service]
})
export class ${name}Module {}
`;

    // Service template
    const serviceTemplate = `import { Injectable } from '@ignite/core';

@Injectable()
export class ${name}Service {
  async findAll() {
    // TODO: Implement findAll
    return [];
  }

  async findById(id: string) {
    // TODO: Implement findById
    return null;
  }

  async create(data: any) {
    // TODO: Implement create
    return data;
  }

  async update(id: string, data: any) {
    // TODO: Implement update
    return data;
  }

  async delete(id: string) {
    // TODO: Implement delete
    return true;
  }
}
`;

    // Controller template
    const controllerTemplate = `import { Request, Response } from 'express';
import { Inject } from '@ignite/core';
import { ${name}Service } from './${name}.service';

export class ${name}Controller {
  constructor(
    @Inject() private ${name.toLowerCase()}Service: ${name}Service
  ) {}

  async findAll(req: Request, res: Response) {
    const items = await this.${name.toLowerCase()}Service.findAll();
    res.json(items);
  }

  async findById(req: Request, res: Response) {
    const { id } = req.params;
    const item = await this.${name.toLowerCase()}Service.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json(item);
  }

  async create(req: Request, res: Response) {
    const item = await this.${name.toLowerCase()}Service.create(req.body);
    res.status(201).json(item);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const item = await this.${name.toLowerCase()}Service.update(id, req.body);
    res.json(item);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await this.${name.toLowerCase()}Service.delete(id);
    res.status(204).send();
  }
}
`;

    // Write files
    await writeFileIfAbsent(moduleFile, moduleTemplate);
    await writeFileIfAbsent(serviceFile, serviceTemplate);
    await writeFileIfAbsent(controllerFile, controllerTemplate);

    logger.info(`Module generated successfully at: ${modulePath}`);
  } catch (error) {
    logger.error("Failed to generate module", { error });
    process.exit(1);
  }
}
