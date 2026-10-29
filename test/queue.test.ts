import { describe, expect, it } from 'vitest';

import { SerialQueue } from '../src/queue';

describe('SerialQueue', () => {
    it('runs operations in order and continues after a rejected operation', async () => {
        const queue = new SerialQueue();
        const order: string[] = [];
        const first = queue.run(async () => {
            order.push('first:start');
            await Promise.resolve();
            order.push('first:end');
            return 1;
        });
        const second = queue.run(async () => {
            order.push('second');
            throw new Error('expected');
        });
        const third = queue.run(async () => {
            order.push('third');
            return 3;
        });

        await expect(first).resolves.toBe(1);
        await expect(second).rejects.toThrow('expected');
        await expect(third).resolves.toBe(3);
        expect(order).toEqual(['first:start', 'first:end', 'second', 'third']);
    });
});
