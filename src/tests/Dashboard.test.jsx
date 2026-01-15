import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Dashboard from '../pages/Dashboard'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// --- MOCK STORE ---
// We create a mini-implementation to simulate logic without Firebase
const mockStore = {
    user: { displayName: 'Tester', photoURL: null },
    loading: false,
    atmBalance: 100000,
    cashBalance: 50000,
    transactions: [],
    budgets: [],
    monthlyBudgetLimit: 5000000,
    // Actions match useWalletStore signatures
    addTransaction: vi.fn(async (tx) => {
        // Simulate success
        return { success: true }
    }),
    withdrawCash: vi.fn(),
    addExpense: vi.fn(),
    setBudget: vi.fn(),
    setBudgetLimit: vi.fn(),
    transferFunds: vi.fn(),
    editTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    addSubscription: vi.fn(),
    // Hooks
    subscribeTransactions: vi.fn(),
    subscribeBudgets: vi.fn(),
    subscribeGoals: vi.fn(),
    subscribeSubscriptions: vi.fn(),
    subscribeInvitations: vi.fn(),
    subscribeSettings: vi.fn(),
}

// Mock useWalletStore
vi.mock('@/stores/useWalletStore', () => ({
    default: (selector) => {
        // If selector is provided, select from mockStore
        if (selector) return selector(mockStore)
        return mockStore
    }
}))

// Mock other hooks
vi.mock('@/hooks/useVoiceInput', () => ({
    default: () => ({ isListening: false, transcript: '', startListening: vi.fn(), stopListening: vi.fn() })
}))

vi.mock('@/lib/geminiService', () => ({
    askFinancialAdvisor: vi.fn(),
    beautifyTransactionTitle: vi.fn()
}))

describe('Component Test: Transaction Form (Dashboard)', () => {

    beforeEach(() => {
        vi.clearAllMocks()
        mockStore.atmBalance = 100000
    })

    // 2. Component Test (Form)
    it('should handle negative input by sanitizing it', async () => {
        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        )

        // Open Modal (Catat Pengeluaran)
        const catatBtn = screen.getByText('Catat')
        fireEvent.click(catatBtn)

        // Find Input
        const input = screen.getByPlaceholderText('0')

        // Simulate user typing negative number '-5000'
        fireEvent.change(input, { target: { value: '-5000' } })

        // Check if value is sanitized (formatNumberInput logic strips non-digits)
        // So -5000 should become 5.000
        expect(input.value).toBe('5.000')

        // This proves the app prevents negative input at the UI level
    })

    it('should show error if submitting empty/zero amount', async () => {
        // Mock alert
        window.alert = vi.fn()

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        )

        const catatBtn = screen.getByText('Catat')
        fireEvent.click(catatBtn)

        // Submit without entering amount
        const saveBtn = screen.getByText('Simpan')
        fireEvent.click(saveBtn)

        // Expect alert
        expect(window.alert).toHaveBeenCalledWith('Nominal tidak valid')
    })
})

describe('Integration Test: Flow', () => {
    // 3. Integration Test (Flow)
    it('should update Total Saldo on manual Top Up', async () => {
        // To verify "Total Saldo berubah", we need our mockStore logic to actually update the state
        // or we manually update it in the mock implementation.

        // Strategy: We hijack the addTransaction mock to update the balance
        mockStore.addTransaction.mockImplementation(async (tx) => {
            if (tx.type === 'INCOME' && tx.target === 'ATM') {
                mockStore.atmBalance += tx.amount
            }
            return { success: true }
        })

        const { rerender } = render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        )

        // 1. Cek Saldo Awal (100.000 + 50.000 = 150.000)
        expect(screen.getByText('Rp 150.000')).toBeInTheDocument()

        // 2. Klik Isi Saldo
        fireEvent.click(screen.getByText('Isi Saldo'))

        // 3. Input 50000
        const input = screen.getByPlaceholderText('0')
        fireEvent.change(input, { target: { value: '50000' } })

        // 4. Pilih Target ATM (Default) & Source External
        // Ensure "ATM" is selected (Default).
        // Select Source "Bank Transfer" (external)
        const bankBtn = screen.getByText('Bank Transfer')
        fireEvent.click(bankBtn)

        // 5. Simpan
        const saveBtn = screen.getByText('Simpan')
        fireEvent.click(saveBtn)

        // 6. Wait for update
        await waitFor(() => {
            // New Total: 150k + 50k = 200k
            // Since Dashboard consumes the store directly, and we updated the mockStore object in place,
            // we need to trigger re-render or ensure the component reads the new value.
            // Zustand useStore(selector) usually subscribes. 
            // Our mock is simplistic: `default: (selector) => selector(mockStore)`.
            // In a real test we'd use `act` but let's see if re-render works.
        })

        // NOTE: Since our mock is a plain object and not a real subscriber system, 
        // Component WON'T re-render automatically. We need to Force Update or use a real store.
        // For this specific test requirement, showing that the FUNCTION was called with correct data 
        // is usually enough for "Action", but user asked "Cek apakah angka... berubah".
        // To achieve this with a simple mock, we force rerender.

        rerender(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        )

        // Assert
        expect(mockStore.addTransaction).toHaveBeenCalled()
        expect(mockStore.atmBalance).toBe(150000) // Logic correct
        expect(screen.getByText('Rp 200.000')).toBeInTheDocument()
    })
})
