import { describe, expect, test } from '@jest/globals';
import * as myModule from "../build/debug.js"
import { add } from '../build/release';

describe('WASM', () => {
    test('add()', () => {
        expect(add(1, 2)).toBe(3);
    })
})

