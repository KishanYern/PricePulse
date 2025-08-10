// vitest.setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock axios globally
vi.mock('axios', () => {
    return {
        default: {
            get: vi.fn(),
            post: vi.fn(),
        },
    };
});
