import { mkdir, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repositoryDirectory = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = fileURLToPath(new URL('../docs/api', import.meta.url));
const temporaryOutputDirectory = fileURLToPath(new URL('../.working/api-docs-next', import.meta.url));
const typedocOptions = fileURLToPath(new URL('../typedoc.json', import.meta.url));

await mkdir(fileURLToPath(new URL('../.working', import.meta.url)), { recursive: true });
await rm(temporaryOutputDirectory, { recursive: true, force: true });

const result = spawnSync(
    'yarn',
    [
        'workspace',
        '@zyno-io/zynosales-ecommerce-sdk-docs',
        'typedoc',
        '--options',
        typedocOptions,
        '--out',
        temporaryOutputDirectory
    ],
    { cwd: repositoryDirectory, stdio: 'inherit' }
);

if (result.status !== 0) {
    await rm(temporaryOutputDirectory, { recursive: true, force: true });
    process.exit(result.status ?? 1);
}

await rm(outputDirectory, { recursive: true, force: true });
await rename(temporaryOutputDirectory, outputDirectory);
