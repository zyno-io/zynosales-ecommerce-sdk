/** Serializes stateful storefront operations while keeping failures local to one operation. */
export class SerialQueue {
    private tail: Promise<void> = Promise.resolve();

    public run<T>(operation: () => Promise<T>): Promise<T> {
        const result = this.tail.then(operation, operation);
        this.tail = result.then(() => undefined, () => undefined);
        return result;
    }
}
