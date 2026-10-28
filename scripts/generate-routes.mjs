import { Generator, getConfig } from '@tanstack/router-generator';
const generator = new Generator({ config: getConfig(), root: process.cwd() });
await generator.run();
