let typescriptUrl;

export function initialize(data) {
    typescriptUrl = data.typescriptUrl;
}

export async function resolve(specifier, context, nextResolve) {
    if (specifier === 'typescript') return { url: typescriptUrl, shortCircuit: true };
    const resolved = await nextResolve(specifier, context);
    return resolved;
}
