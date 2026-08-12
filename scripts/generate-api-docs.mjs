import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const outputDirectory = fileURLToPath(new URL('../docs/api', import.meta.url));
const typedocBinary = fileURLToPath(new URL('../node_modules/.bin/typedoc', import.meta.url));

await rm(outputDirectory, { recursive: true, force: true });

const result = spawnSync(typedocBinary, ['--options', 'typedoc.json'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
