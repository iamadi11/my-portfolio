import { describe, expect, it } from 'vitest';

import { experiment } from './api-experiment';

describe('API semantic experiments', () => {
    it('repeated PUT preserves one resource; this API’s POST creates each time', () => {
        for (let n = 1; n <= 5; n++) {
            expect(experiment('rest', 'PUT', n).count).toBe(1);
            expect(experiment('rest', 'POST', n).count).toBe(n);
            expect(experiment('rest', 'POST', n).answer).toBe(n > 1 ? 'Several notes' : 'One note');
        }
    });
    it('a deadline distinguishes an on-time reply from excess waiting', () => {
        expect(experiment('rpc', '2', 1).failed).toBe(false);
        expect(experiment('rpc', '2', 3).failed).toBe(true);
        expect(experiment('rpc', '4', 3).failed).toBe(false);
    });
    it('field selection and nested resolver work differ', () => {
        expect(experiment('graphql', 'name', 5).value).toBe('name only');
        expect(experiment('graphql', 'nested', 5).count).toBe(5);
    });
    it('transport choice follows communication direction', () => {
        expect(experiment('realtime', 'feed', 1).answer).toBe('SSE');
        expect(experiment('realtime', 'both', 1).answer).toBe('WebSocket');
    });
});
