import { describe, it, expect } from 'vitest'
import { toIDR, formatCurrency, formatNumberInput } from './utils'

describe('Unit Test: Helper Utils', () => {

    // 1. Tes logika matematika uang & format
    it('should format 100500 to IDR correctly', () => {
        expect(formatCurrency(100500).replace(/\u00a0/g, ' ')).toContain('Rp 100.500')
    })

    it('should sanitize floating point correctly (0.1 + 0.2 behavior)', () => {
        // 0.1 + 0.2 = 0.30000000000000004
        // toIDR(0.1 + 0.2) -> Math.round -> 0
        expect(toIDR(0.1 + 0.2)).toBe(0)

        // Test "strange decimal" scenario
        // 1000.1 + 2000.2 = 3000.299999999... -> 3000
        expect(toIDR(1000.1 + 2000.2)).toBe(3000)
    })

    it('should handle negative numbers in input formatter', () => {
        // formatNumberInput sanitizes non-digits, so -5000 becomes 5000
        expect(formatNumberInput('-5000')).toBe('5.000')
    })

    it('toIDR should return clean integer', () => {
        expect(toIDR('50000')).toBe(50000)
        expect(toIDR('50000.99')).toBe(50001) // Rounded
        expect(toIDR('abc')).toBe(0)
    })
})
