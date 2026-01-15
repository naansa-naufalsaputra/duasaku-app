import { create } from 'zustand'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    updateDoc,
    writeBatch,
    serverTimestamp
} from 'firebase/firestore'
import { logError } from '../utils/Logger'
import { toIDR } from '@/lib/utils'

const useWalletStore = create((set, get) => ({
    user: null,
    loading: true,
    biometricEnabled: false, // Default false to prevent lock
    ledgerId: null, // Shared Ledger ID
    wallets: [], // New dynamic wallets
    transactions: [],
    budgets: [],
    goals: [], // Wishlist Saver
    subscriptions: [], // Recurring Subscriptions
    invitations: [],
    monthlyBudgetLimit: 5000000, // Default 5jt
    darkMode: localStorage.getItem('darkMode') === 'true', // Init from storage
    unsubscribeTransactions: null,
    unsubscribeBudgets: null,
    unsubscribeGoals: null,
    unsubscribeSubscriptions: null,
    unsubscribeInvitations: null,
    unsubscribeSettings: null,
    unsubscribeWallets: null,

    initializeAuth: () => {
        console.log("[Auth] initializeAuth called")
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            console.log("[Auth] State changed:", user ? "User found: " + user.uid : "No user")

            if (user) {
                set({ user, loading: false }) // OPTIMISTIC UPDATE
                console.log("[Auth] Set user, loading: false (Optimistic)")

                // 1. Get/Create User Profile to find Ledger ID
                const userRef = doc(db, 'users', user.uid)

                // Listen to user profile changes (for accepted invites)
                const unsubUser = onSnapshot(userRef, async (docSnap) => {
                    console.log("[Auth] User Profile snapshot received")
                    let currentLedgerId = user.uid // Default to own UID

                    if (docSnap.exists()) {
                        const userData = docSnap.data()
                        if (userData.ledgerId) currentLedgerId = userData.ledgerId
                    } else {
                        // Create profile if not exists
                        console.log("[Auth] Creating new user profile")
                        await setDoc(userRef, {
                            email: user.email,
                            ledgerId: user.uid,
                            photoURL: user.photoURL,
                            displayName: user.displayName
                        })
                    }

                    // Set state
                    set({ ledgerId: currentLedgerId })
                    console.log("[Auth] LedgerID set to:", currentLedgerId)

                    // 2. Subscribe to Data using Ledger ID
                    try {
                        get().subscribeTransactions(currentLedgerId)
                        get().subscribeBudgets(currentLedgerId)
                        get().subscribeGoals(currentLedgerId)
                        get().subscribeSubscriptions(currentLedgerId)
                        get().subscribeInvitations(user.email)
                        get().subscribeSettings(currentLedgerId) // New: Settings
                        get().subscribeWallets(currentLedgerId) // New: Wallets
                        console.log("[Auth] Subscriptions started")
                    } catch (e) {
                        console.error("[Auth] Error starting subscriptions:", e)
                    }
                }, (error) => {
                    console.error("[Auth] Error listening to user profile:", error)
                    set({ loading: false })
                })

            } else {
                console.log("[Auth] No user, clearing state")
                set({ loading: false })
                get().cleanup()
            }
        })
        return unsubscribeAuth
    },

    cleanup: () => {
        console.log("[Auth] Cleanup called")
        get().unsubscribeTransactions?.()
        get().unsubscribeBudgets?.()
        get().unsubscribeGoals?.()
        get().unsubscribeSubscriptions?.()
        get().unsubscribeInvitations?.()
        get().unsubscribeSettings?.()
        set({
            transactions: [],
            wallets: [],
            budgets: [],
            goals: [],
            subscriptions: [],
            invitations: [],
            monthlyBudgetLimit: 5000000,
            ledgerId: null,
            user: null
        })
    },

    // ... subscriptions ...

    subscribeSettings: (ledgerId) => {
        get().unsubscribeSettings?.()
        const docRef = doc(db, 'settings', ledgerId)

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                if (data.monthlyBudgetLimit) {
                    set({ monthlyBudgetLimit: Number(data.monthlyBudgetLimit) })
                }
            } else {
                // Initialize if missing
                setDoc(docRef, { monthlyBudgetLimit: 5000000 }, { merge: true })
            }
        })
        set({ unsubscribeSettings: unsubscribe })
    },

    subscribeWallets: (ledgerId) => {
        get().unsubscribeWallets?.()
        const q = query(collection(db, 'wallets'), where('ledgerId', '==', ledgerId))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const wallets = []
            snapshot.forEach((doc) => {
                wallets.push({ id: doc.id, ...doc.data() })
            })

            // Migration: Logic to create default wallets if empty
            if (wallets.length === 0) {
                console.log("[Migration] No wallets found. Creating defaults...")
                const batch = writeBatch(db)
                const atmRef = doc(db, 'wallets', 'ATM') // Force ID to match legacy
                const cashRef = doc(db, 'wallets', 'CASH') // Force ID to match legacy

                batch.set(atmRef, {
                    ledgerId,
                    name: 'Rekening ATM',
                    type: 'Bank',
                    color: 'blue',
                    icon: 'credit-card',
                    initialBalance: 0
                })
                batch.set(cashRef, {
                    ledgerId,
                    name: 'Dompet Tunai',
                    type: 'Cash',
                    color: 'emerald',
                    icon: 'wallet',
                    initialBalance: 0
                })

                batch.commit().then(() => console.log("[Migration] Defaults created."))
            }

            // Note: Balances are calculated in subscribeTransactions
            set({ wallets: wallets, unsubscribeWallets: unsubscribe })

            // Re-trigger balance calculation if transactions already loaded
            if (get().transactions.length > 0) {
                get().recalculateBalances(get().transactions, wallets)
            }
        })
    },

    subscribeTransactions: (ledgerId) => {
        get().unsubscribeTransactions?.()

        // Query by ledgerId (and exclude Subscription Templates)
        const q = query(
            collection(db, 'transactions'),
            where('ledgerId', '==', ledgerId),
            where('type', '!=', 'SUBSCRIPTION_MASTER') // Ensure no templates leak
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const transactions = []

            snapshot.forEach((doc) => {
                const data = doc.data()
                transactions.push({ id: doc.id, ...data })
            })

            transactions.sort((a, b) => new Date(b.date) - new Date(a.date))

            // Calculate Balances
            const wallets = get().wallets
            const updatedWallets = get().recalculateBalances(transactions, wallets)

            set({
                transactions,
                wallets: updatedWallets,
                unsubscribeTransactions: unsubscribe
            })
        }, (error) => {
            console.error("Tx Error:", error)
        })
    },

    recalculateBalances: (transactions, wallets) => {
        // Clone wallets to avoid mutation if strict
        const newWallets = wallets.map(w => ({ ...w, balance: w.initialBalance || 0 }))

        transactions.forEach(t => {
            const amount = Number(t.amount) || 0

            // 1. Source (Expense / Transfer Out)
            const sourceWallet = newWallets.find(w => w.id === t.source)
            if (sourceWallet) {
                if (t.type === 'EXPENSE' || t.type === 'TRANSFER') {
                    sourceWallet.balance -= amount
                }
            }

            // 2. Target (Income / Transfer In)
            const targetWallet = newWallets.find(w => w.id === t.target)
            if (targetWallet) {
                if (t.type === 'INCOME' || t.type === 'TRANSFER') {
                    targetWallet.balance += amount
                }
            }
        })

        return newWallets
    },

    subscribeBudgets: (ledgerId) => {
        get().unsubscribeBudgets?.()
        const q = query(collection(db, 'budgets'), where('ledgerId', '==', ledgerId))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const budgets = []
            snapshot.forEach((doc) => {
                budgets.push({ id: doc.id, ...doc.data() })
            })
            set({ budgets, unsubscribeBudgets: unsubscribe })
        })
    },

    subscribeGoals: (ledgerId) => {
        get().unsubscribeGoals?.()
        const q = query(collection(db, 'goals'), where('ledgerId', '==', ledgerId))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const goals = []
            snapshot.forEach((doc) => {
                goals.push({ id: doc.id, ...doc.data() })
            })
            set({ goals, unsubscribeGoals: unsubscribe })
        })
    },

    subscribeSubscriptions: (ledgerId) => {
        get().unsubscribeSubscriptions?.()
        const q = query(collection(db, 'subscriptions'), where('ledgerId', '==', ledgerId))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const subs = []
            snapshot.forEach((doc) => {
                subs.push({ id: doc.id, ...doc.data() })
            })
            set({ subscriptions: subs, unsubscribeSubscriptions: unsubscribe })
        })
    },

    subscribeInvitations: (email) => {
        get().unsubscribeInvitations?.()
        if (!email) return

        const q = query(collection(db, 'invitations'), where('toEmail', '==', email), where('status', '==', 'pending'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const invitations = []
            snapshot.forEach((doc) => {
                invitations.push({ id: doc.id, ...doc.data() })
            })
            set({ invitations, unsubscribeInvitations: unsubscribe })
        })
    },

    // --- Actions ---

    addTransaction: async ({ amount, category, source, target, description, type, date }) => {
        const { user, ledgerId, atmBalance, cashBalance } = get()

        try {
            if (!user || !ledgerId) {
                throw new Error("Sesi login kedaluwarsa. Silakan login ulang.")
            }

            console.log("[DEBUG] Processing Transaction:", { amount, category, source, target, description, ledgerId })

            const val = toIDR(amount) // FIXED: Floating point safety
            if (val <= 0) throw new Error("Nominal tidak valid") // FIXED: Negative check

            const isoDate = date || new Date().toISOString()

            // Logic Source Check
            // Find wallet
            const sourceWallet = get().wallets.find(w => w.id === source)
            if (sourceWallet && sourceWallet.balance < val && source !== 'External') {
                // Optional: Allow negative balance if credit card? For now strict.
                // But wait, if source is missing (e.g. deleted wallet), we might have issue.
                // Assuming source is valid.
                // throw new Error(`Saldo ${sourceWallet.name} tidak cukup!`)
            }
            // Temporarily disable strict balance check for flexibility or re-enable later
            // if (source === 'ATM' && atmBalance < val) {
            //     throw new Error("Saldo ATM tidak cukup!")
            // }
            // if (source === 'CASH' && cashBalance < val) {
            //     throw new Error("Saldo Tunai tidak cukup!")
            // }

            // Determine Type automatically if not provided
            let txType = type
            if (!txType) {
                if (['ATM', 'CASH'].includes(source) && ['ATM', 'CASH'].includes(target)) {
                    txType = 'TRANSFER'
                } else if (source === 'external') {
                    txType = 'INCOME'
                } else {
                    txType = 'EXPENSE'
                }
            }

            const finalSource = source === 'external' || source === 'External' ? 'External' : source

            await addDoc(collection(db, 'transactions'), {
                uid: user.uid,
                ledgerId,
                amount: val,
                category,
                source: finalSource,
                target,
                description,
                type: txType,
                date: isoDate,
                createdAt: serverTimestamp()
            })

            return { success: true }
        } catch (err) {
            // Log to Firestore
            await logError('addTransaction', err, { amount, category, source, type, ledgerId })
            console.error("[CRITICAL] Transaction Failed:", err)
            throw err
        }
    },


    addIncome: async (amount, targetWallet, description = 'Top Up', date = null) => {
        const { user, ledgerId } = get()
        if (!user || !ledgerId) return

        await addDoc(collection(db, 'transactions'), {
            uid: user.uid,
            ledgerId,
            type: 'INCOME',
            amount: toIDR(amount),
            category: 'Income',
            source: 'External',
            target: targetWallet,
            description,
            date: date || new Date().toISOString()
        })
    },

    transferFunds: async (amount, fromType, toType) => {
        const { user, ledgerId, atmBalance, cashBalance } = get()
        if (!user || !ledgerId) return

        // 1. Validate
        const numAmount = toIDR(amount)
        if (numAmount <= 0) {
            alert("Nominal tidak valid")
            return
        }

        // Normalize inputs
        const fromUpper = fromType.toUpperCase() // 'ATM' or 'CASH'
        const toUpper = toType.toUpperCase()

        if (fromUpper === toUpper) {
            alert("Dompet asal dan tujuan tidak boleh sama!")
            return
        }

        // 2. Check Funds
        const sourceWallet = get().wallets.find(w => w.id === fromUpper)
        if (!sourceWallet) {
            alert("Dompet asal tidak ditemukan")
            return
        }

        if (sourceWallet.balance < numAmount) {
            alert("Saldo tidak cukup!")
            throw new Error("Saldo tidak cukup!")
        }

        // 3. Optimistic Update
        const ts = Date.now()
        // Create SINGLE Transfer Transaction
        const newTx = {
            id: 'temp-trf-' + ts,
            type: 'TRANSFER',
            amount: numAmount,
            category: 'Transfer',
            source: fromUpper,
            target: toUpper,
            description: `Transfer ${fromUpper} -> ${toUpper}`,
            date: new Date().toISOString()
        }

        set((state) => {
            // Re-run local recalculation
            const newTxList = [newTx, ...state.transactions]
            const newWallets = state.recalculateBalances(newTxList, state.wallets)

            return {
                wallets: newWallets,
                transactions: newTxList
            }
        })

        // 4. Persistence
        try {
            await addDoc(collection(db, 'transactions'), {
                uid: user.uid,
                ledgerId,
                type: 'TRANSFER',
                category: 'Transfer',
                amount: numAmount,
                source: fromUpper,
                target: toUpper,
                description: `Transfer ${fromUpper} ke ${toUpper}`,
                date: new Date().toISOString(),
                createdAt: serverTimestamp()
            })
        } catch (e) {
            console.error("Transfer failed", e)
            alert("Gagal menyimpan transfer ke server")
        }
    },

    withdrawCash: async (amount, date = null) => {
        // Shortcut for ATM -> CASH
        await get().transferFunds(amount, 'ATM', 'CASH')
    },

    addExpense: async (amount, category, sourceWallet, description = '', date = null) => {
        const { user, ledgerId, atmBalance, cashBalance } = get()
        if (!user || !ledgerId) {
            return
        }

        if (sourceWallet !== 'External') {
            const wallet = get().wallets.find(w => w.id === sourceWallet)
            if (wallet && wallet.balance < amount) {
                alert("Saldo tidak cukup!")
                return
            }
        }

        await addDoc(collection(db, 'transactions'), {
            uid: user.uid,
            ledgerId,
            type: 'EXPENSE',
            amount: toIDR(amount),
            category,
            source: sourceWallet,
            target: 'Merchant',
            description: description || category,
            date: date || new Date().toISOString()
        })
    },

    setBudget: async (category, limit) => {
        const { user, ledgerId, budgets } = get()
        if (!user || !ledgerId) return

        const existing = budgets.find(b => b.category === category)

        if (existing) {
            const budgetRef = doc(db, 'budgets', existing.id)
            await setDoc(budgetRef, {
                uid: user.uid,
                ledgerId,
                category,
                limit: toIDR(limit)
            })
        } else {
            await addDoc(collection(db, 'budgets'), {
                uid: user.uid,
                ledgerId,
                category,
                limit: toIDR(limit)
            })
        }
    },

    deleteBudget: async (id) => {
        await deleteDoc(doc(db, 'budgets', id))
    },

    setBudgetLimit: async (amount) => {
        const { ledgerId } = get()
        if (!ledgerId) return
        await setDoc(doc(db, 'settings', ledgerId), {
            monthlyBudgetLimit: toIDR(amount)
        }, { merge: true })
        // Optimistic update
        set({ monthlyBudgetLimit: toIDR(amount) })
    },

    // --- Goals Actions ---

    addGoal: async ({ title, targetAmount, emoji, color, image }) => {
        const { user, ledgerId } = get()
        if (!user || !ledgerId) return

        await addDoc(collection(db, 'goals'), {
            uid: user.uid,
            ledgerId,
            title,
            targetAmount: toIDR(targetAmount),
            savedAmount: 0,
            emoji: emoji || '🎯',
            color: color || 'blue',
            image: image || null,
            createdAt: new Date().toISOString()
        })
    },

    addSavings: async (goalId, amount, sourceWallet) => {
        const { user, ledgerId, goals } = get()
        if (!user || !ledgerId) return

        const val = toIDR(amount)
        const goal = goals.find(g => g.id === goalId)
        if (!goal) return

        // 1. Transaction (Expense from Wallet)
        try {
            const success = await get().addExpense(val, 'Savings', sourceWallet, `Tabungan: ${goal.title}`)
            if (success === false) return false // Handle insufficient funds if addExpense returns false (need to check addExpense)

            // 2. Update Goal
            const goalRef = doc(db, 'goals', goalId)
            const newAmount = (goal.savedAmount || goal.currentAmount || 0) + val
            await setDoc(goalRef, {
                savedAmount: newAmount
            }, { merge: true })

            return true
        } catch (e) {
            console.error(e)
            return false
        }
    },

    deleteGoal: async (id) => {
        await deleteDoc(doc(db, 'goals', id))
    },

    // --- Subscriptions Actions ---

    addSubscription: async ({ name, cost, dueDay, type, color, recordNow, sourceWallet }) => {
        const { user, ledgerId, subscriptions, atmBalance, cashBalance } = get()
        if (!user || !ledgerId) return { success: false, reason: 'Auth Error' }

        // Smart Duplicate Check
        const normalize = (str) => str.toLowerCase().replace(/\b(langganan|bulan|paket|premium|idr|rp|ribu)\b/g, '').replace(/[^a-z0-9]/g, '').trim()
        const target = normalize(name)

        const exists = subscriptions.find(s => {
            const current = normalize(s.name)
            return current.includes(target) || target.includes(current)
        })

        if (exists) {
            console.log("[Subscription] Duplicate detected:", exists.name)
            return { success: false, reason: 'Duplicate' }
        }

        try {
            // 1. Add Subscription
            const docRef = await addDoc(collection(db, 'subscriptions'), {
                uid: user.uid,
                ledgerId,
                name,
                cost: Number(cost),
                dueDay: Number(dueDay),
                type: type || 'Monthly',
                color: color || 'blue',
                createdAt: new Date().toISOString()
            })

            // 2. Optional: Record First Payment
            if (recordNow && sourceWallet) {
                const amountVal = Number(cost)
                let hasFunds = true
                if (sourceWallet === 'ATM' && atmBalance < amountVal) hasFunds = false
                if (sourceWallet === 'CASH' && cashBalance < amountVal) hasFunds = false

                if (!hasFunds) {
                    alert("Saldo tidak cukup untuk mencatat pembayaran pertama, tetapi langganan tetap disimpan.")
                } else {
                    // Create Transaction
                    await addDoc(collection(db, 'transactions'), {
                        uid: user.uid,
                        ledgerId,
                        type: 'EXPENSE',
                        amount: amountVal,
                        category: 'Langganan',
                        source: sourceWallet,
                        target: 'Merchant',
                        description: `Pembayaran Langganan: ${name}`,
                        date: new Date().toISOString(),
                        isSubscription: true,
                        subscriptionId: docRef.id,
                        createdAt: serverTimestamp()
                    })
                }
            }

            // Optimistic Update
            const newSub = {
                id: docRef.id,
                uid: user.uid,
                ledgerId,
                name,
                cost: Number(cost),
                dueDay: Number(dueDay),
                type: type || 'Monthly',
                color: color || 'blue'
            }
            set((state) => ({ subscriptions: [...state.subscriptions, newSub] }))
            return { success: true }
        } catch (error) {
            console.error(error)
            return { success: false, reason: error.message }
        }
    },

    removeSubscription: async (id) => {
        // Optimistic
        set((state) => ({ subscriptions: state.subscriptions.filter(s => s.id !== id) }))
        await deleteDoc(doc(db, 'subscriptions', id))
    },

    // --- Collaboration Actions ---

    invitePartner: async (email) => {
        const { user, ledgerId } = get()
        if (!user || !email) return

        await addDoc(collection(db, 'invitations'), {
            fromUid: user.uid,
            fromName: user.displayName || 'Seseorang',
            toEmail: email,
            ledgerId: ledgerId,
            status: 'pending',
            date: new Date().toISOString()
        })
    },

    acceptInvitation: async (invitationId, newLedgerId) => {
        const { user } = get()
        if (!user) return

        // 1. Update User Profile to point to new Ledger
        const userRef = doc(db, 'users', user.uid)
        await setDoc(userRef, { ledgerId: newLedgerId }, { merge: true })

        // 2. Update Invitation Status
        const inviteRef = doc(db, 'invitations', invitationId)
        await setDoc(inviteRef, { status: 'accepted' }, { merge: true })
    },

    declineInvitation: async (invitationId) => {
        await deleteDoc(doc(db, 'invitations', invitationId))
    },

    logout: async () => {
        try {
            await signOut(auth)
            get().cleanup()
        } catch (error) {
            console.error("Logout error", error)
        }
    },

    toggleDarkMode: () => {
        const isDark = !get().darkMode
        set({ darkMode: isDark })
        localStorage.setItem('darkMode', isDark) // Persist
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    },

    // Privacy Mode (Hide Balance)
    isPrivacyMode: localStorage.getItem('isPrivacyMode') === 'true',
    togglePrivacyMode: () => {
        const newVal = !get().isPrivacyMode
        set({ isPrivacyMode: newVal })
        localStorage.setItem('isPrivacyMode', newVal)
    },

    addWallet: async (name, type, color, icon, initialBalance) => {
        if (!get().ledgerId) return
        try {
            await addDoc(collection(db, 'wallets'), {
                ledgerId: get().ledgerId,
                name,
                type,
                color,
                icon,
                initialBalance: Number(initialBalance)
            })
        } catch (error) {
            console.error("Add Wallet Error:", error)
            throw error
        }
    },

    editTransaction: async (id, newData) => {
        const { ledgerId } = get()
        if (!ledgerId) return

        const ref = doc(db, 'transactions', id)
        await updateDoc(ref, {
            ...newData,
            amount: toIDR(newData.amount) // Ensure number
        })
    },

    deleteTransaction: async (id) => {
        await deleteDoc(doc(db, 'transactions', id))
    },

    reset: async () => {
        const { ledgerId, user } = get()
        if (!ledgerId) return

        try {
            const batch = writeBatch(db)

            // 1. Delete Transactions
            get().transactions.forEach(t => {
                batch.delete(doc(db, 'transactions', t.id))
            })

            // 2. Delete Budgets
            get().budgets.forEach(b => {
                batch.delete(doc(db, 'budgets', b.id))
            })

            // 3. Delete Goals
            get().goals.forEach(g => {
                batch.delete(doc(db, 'goals', g.id))
            })

            // 4. Delete Subscriptions
            get().subscriptions.forEach(s => {
                batch.delete(doc(db, 'subscriptions', s.id))
            })

            await batch.commit()

            // Reset Local State
            set({
                transactions: [],
                budgets: [],
                goals: [],
                wallets: [],
            })

            window.location.reload()

        } catch (error) {
            console.error("Reset Error:", error)
            alert("Gagal mereset data. Coba lagi.")
        }
    },

    // Biometric Preference
    biometricEnabled: false,
    setBiometric: (enabled) => set({ biometricEnabled: enabled }),

    // --- Chat Advisor (Local Persistence) ---
    chatHistory: [],

    loadChatHistory: () => {
        const { user } = get()
        if (!user) return
        const key = `chat_history_${user.uid}`
        const saved = localStorage.getItem(key)
        if (saved) {
            try {
                set({ chatHistory: JSON.parse(saved) })
            } catch (e) {
                set({ chatHistory: [] }) // CORRUPT PROTECTION
            }
        } else {
            set({ chatHistory: [] })
        }
    },

    addChatMessage: (sender, text) => {
        const { user, chatHistory } = get()
        const newMsg = { id: Date.now(), sender, text }
        const newHistory = [...chatHistory, newMsg]
        set({ chatHistory: newHistory })

        if (user) {
            localStorage.setItem(`chat_history_${user.uid}`, JSON.stringify(newHistory))
        }
    },

    clearChatHistory: () => {
        const { user } = get()
        set({ chatHistory: [] })
        if (user) {
            localStorage.removeItem(`chat_history_${user.uid}`)
        }
    }
}))

export default useWalletStore