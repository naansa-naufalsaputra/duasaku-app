import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

export function formatNumberInput(value) {
    if (!value) return ''
    const raw = value.toString().replace(/\D/g, '')
    return new Intl.NumberFormat('id-ID').format(raw)
}

export function toIDR(amount) {
    // Helper to sanitize financial inputs
    // 1. Convert to Number
    // 2. Round to avoid floating point drift
    // 3. Ensure no negatives where strict (though this might be context specific)
    const val = Number(amount)
    if (isNaN(val)) return 0
    return Math.round(val)
}
