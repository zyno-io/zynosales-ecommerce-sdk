import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire, register } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// The generator uses the classic TypeScript compiler API. Reuse the isolated
// compiler already owned by documentation tooling while SDK typechecking uses TS7.
const toolsRequire = createRequire(new URL('../tools/docs/package.json', import.meta.url));
const typescriptUrl = pathToFileURL(toolsRequire.resolve('typescript')).href;
register(new URL('./typescript-api-loader.mjs', import.meta.url), import.meta.url, { data: { typescriptUrl } });
const generator = await import('@zyno-io/openapi-client-codegen/generator');
await generator.generateConfiguredOpenapiClients();

// Keep generator output reproducible and free of whitespace-only lines.
async function normalizeGeneratedWhitespace(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            await normalizeGeneratedWhitespace(path);
        } else if (entry.name.endsWith('.ts')) {
            const source = await readFile(path, 'utf8');
            const normalized = source.replace(/[ \t]+$/gm, '');
            if (normalized !== source) await writeFile(path, normalized);
        }
    }
}
const configuredSource = await readFile(new URL('../openapi-specs.json', import.meta.url), 'utf8');
const configuredClients = JSON.parse(configuredSource);
for (const client of Object.values(configuredClients)) await normalizeGeneratedWhitespace(client.path);
