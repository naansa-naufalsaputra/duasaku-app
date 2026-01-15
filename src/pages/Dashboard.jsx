import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useWalletStore from '@/stores/useWalletStore'
import { parseTransactionText } from '@/lib/smartParser'
import { formatCurrency, formatNumberInput } from '@/lib/utils'
import { askFinancialAdvisor, beautifyTransactionTitle } from '@/lib/geminiService'
import useVoiceInput from '@/hooks/useVoiceInput'
import { Send, LogOut, User as UserIcon, Plus, ArrowUpRight, Download, PieChart, ShoppingBag, Coffee, Car, Zap, MoreHorizontal, Settings, Bot, PenTool, Mic, MicOff, ChevronDown, Check, Banknote, CreditCard as LucideCreditCard, Wallet, X, Eye, EyeOff, PiggyBank, Smartphone, Landmark, Vault, Gift, Briefcase, Calculator } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CreditCard from '@/components/CreditCard'
import ExpenseChart from '@/components/ExpenseChart'
import AdvisorModal from '@/components/AdvisorModal'
import ActionSheet from '@/components/ActionSheet'
import ModalPortal from '@/components/ModalPortal'
import { triggerConfetti } from '@/lib/confetti'

const Dashboard = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, loading, wallets, transactions, withdrawCash, addExpense, budgets, setBudget, monthlyBudgetLimit, setBudgetLimit, transferFunds, addTransaction, editTransaction, deleteTransaction, addSubscription, isPrivacyMode, togglePrivacyMode, addWallet } = useWalletStore()

    // --- States ---
    const [inputText, setInputText] = useState('')
    const [showChart, setShowChart] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false) // AI Processing State

    // Voice Hook
    const { isListening, transcript, startListening, stopListening } = useVoiceInput()

    // Modal & Form States
    const [activeModal, setActiveModal] = useState(null) // 'topup', 'withdraw', 'expense', 'budget', 'budgetLimit', 'addWallet'
    const [showCategoryPicker, setShowCategoryPicker] = useState(false)
    const [amount, setAmount] = useState('')
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('Misc')
    const [walletSelection, setWalletSelection] = useState('ATM')
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedTime, setSelectedTime] = useState('')
    const [source, setSource] = useState('external')
    const [addToSubs, setAddToSubs] = useState(false)
    const [newWalletIcon, setNewWalletIcon] = useState('wallet')
    const [newWalletColor, setNewWalletColor] = useState('blue')

    // Success State
    const [showSuccess, setShowSuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState({ title: 'Berhasil!', subtitle: '' })

    // Edit/Delete State
    const [selectedTx, setSelectedTx] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    // Advisor State
    const [showAdvisor, setShowAdvisor] = useState(false)
    const [advisorLoading, setAdvisorLoading] = useState(false)
    const [advice, setAdvice] = useState('')

    // --- Effects ---

    // Sync Voice to Input
    useEffect(() => {
        if (transcript) setInputText(transcript)
    }, [transcript])

    // Handle Deep Link / Scan Result
    useEffect(() => {
        if (location.state?.scanResult && location.state?.openModal) {
            const { amount: scanAmount, title: scanTitle, category: scanCategory, date: scanDate } = location.state.scanResult
            setAmount(formatNumberInput(scanAmount.toString()))
            setTitle(scanTitle || '')
            setCategory(scanCategory || 'Misc')
            if (scanDate) {
                try {
                    setSelectedDate(new Date(scanDate).toISOString().split('T')[0])
                } catch (e) { }
            }
            setActiveModal(location.state.openModal)
            window.history.replaceState({}, document.title)
        }
    }, [location.state])

    // --- Logic ---

    const handleAmountChange = (e) => {
        const raw = e.target.value.replace(/\./g, '')
        if (!isNaN(raw)) setAmount(formatNumberInput(raw))
    }

    const triggerSuccess = (t, s) => {
        setSuccessMessage({ title: t, subtitle: s })
        setShowSuccess(true)
    }

    const resetForm = () => {
        setActiveModal(null)
        setAmount('')
        setTitle('')
        setCategory('Misc')
        setWalletSelection('ATM')
        setAddToSubs(false)
        setIsProcessing(false)
        setNewWalletIcon('wallet')
        setNewWalletColor('blue')
    }

    const openModal = (type) => {
        setActiveModal(type)
        setAmount('')
        setTitle('')
        setCategory('Misc')
        setWalletSelection('ATM')
        setAddToSubs(false)
        setIsProcessing(false)
        setNewWalletIcon('wallet')
        setNewWalletColor('blue')

        if (type === 'budgetLimit') {
            setAmount(formatNumberInput(useWalletStore.getState().monthlyBudgetLimit.toString()))
        }

        // Init Date info
        const now = new Date()
        const offset = now.getTimezoneOffset() * 60000
        const localIso = new Date(now - offset).toISOString()
        setSelectedDate(localIso.split('T')[0])
        setSelectedTime(localIso.split('T')[1].slice(0, 5))
    }

    // --- SMART SUBMIT LOGIC ---
    const handleSmartSubmit = (e) => {
        e.preventDefault()
        if (!inputText.trim()) return
        const result = parseTransactionText(inputText)
        if (result.amount > 0) {
            addExpense(result.amount, result.category, result.sourceWallet, inputText)
            setInputText('')
            triggerSuccess("Tercatat!", `${result.category} ${formatCurrency(result.amount)}`)
        } else {
            alert("Gagal mendeteksi nominal. Gunakan format angka (contoh: 15rb).")
        }
    }

    // --- MAIN SAVE TRANSACTION LOGIC ---
    const handleSaveTransaction = async (e) => {
        e.preventDefault()
        if (isProcessing) return // Prevent double submit

        const val = Number(amount.replace(/\./g, ''))
        if (!val || val <= 0) {
            alert("Nominal tidak valid")
            return
        }

        setIsProcessing(true) // 1. Lock UI

        try {
            // Processing Date
            let isoDate = new Date().toISOString()
            if (selectedDate && selectedTime) {
                isoDate = new Date(`${selectedDate}T${selectedTime}`).toISOString()
            }

            // --- 2. Smart Parser Processing (Final Clean) ---
            let finalTitle = title || category
            let finalAmount = val

            if (activeModal === 'expense' && title) {
                const parsed = parseTransactionText(title)
                finalTitle = parsed.description // Clean Title (e.g. "Beli Kopi")
                if (parsed.amount > 0) finalAmount = parsed.amount // Ensure strict amount

                // If amount is still 0, reject
                if (finalAmount <= 0) {
                    triggerError("Nominal Kosong", "Mohon masukkan nominal transaksi.")
                    setIsProcessing(false)
                    return
                }

                // Update state to match final (optional but good for syncing)
                setAmount(formatNumberInput(finalAmount.toString()))
            }

            // --- 3. Save Logic ---
            if (selectedTx) {
                // EDIT MODE
                const newData = {
                    amount: val,
                    date: isoDate,
                    category,
                    description: finalTitle,
                    source: walletSelection,
                    target: walletSelection,
                    type: activeModal === 'topup' ? 'INCOME' : activeModal === 'withdraw' ? 'TRANSFER' : 'EXPENSE'
                }
                if (activeModal === 'expense' && addToSubs) {
                    // strict separation: add to subscriptions collection
                    addSubscription({
                        name: finalTitle,
                        cost: val,
                        dueDay: new Date().getDate(),
                        type: 'Monthly',
                        color: 'purple'
                    })
                }

                await editTransaction(selectedTx.id, newData)
                triggerSuccess("Update Berhasil", finalTitle)
                setSelectedTx(null)

                // CRITICAL RETURN to prevent falling into Create Block
                setIsProcessing(false)
                resetForm()
                return
            }

            // --- CREATE MODE (Strict Else) ---
            // Verify we are NOT in edit mode
            if (!selectedTx) {
                if (activeModal === 'topup') {
                    if (source === 'external') {
                        console.log("[DEBUG] Adding Income:", { val, walletSelection, isoDate }) // LOG 1
                        await addTransaction({
                            id: Date.now(),
                            amount: val,
                            source: 'External',
                            target: walletSelection,
                            category: 'Income',
                            type: 'INCOME',
                            description: 'Top Up Manual',
                            date: isoDate
                        })
                        triggerSuccess("Top Up Berhasil", formatCurrency(val))
                    } else {
                        // Transfer
                        if (source === walletSelection) throw new Error("Dompet asal & tujuan sama")
                        await transferFunds(val, source, walletSelection)
                        triggerSuccess("Transfer Sukses", `${source} -> ${walletSelection}`)
                    }
                } else if (activeModal === 'withdraw') {
                    // Logic check inside store handles balance validation
                    await withdrawCash(val, isoDate)
                    triggerSuccess("Tarik Tunai", formatCurrency(val))
                } else if (activeModal === 'expense') {
                    await addExpense(val, category, walletSelection, finalTitle, isoDate)

                    // 4. Auto Subscription
                    if (addToSubs) {
                        try {
                            const subResult = await addSubscription({
                                name: finalTitle,
                                cost: val,
                                dueDay: new Date().getDate(),
                                type: 'Monthly',
                                color: 'purple'
                            })
                            if (!subResult.success && subResult.reason === 'Duplicate') {
                                // Optional: You could trigger a toast here, but for now we just log
                                console.log("Subscription skipped: Duplicate")
                            }
                        } catch (subErr) {
                            console.error("Subscription Auto-Add Failed:", subErr)
                        }
                    }
                    triggerSuccess("Tercatat!", `${finalTitle}`)
                } else if (activeModal === 'budget') {
                    await setBudget(category, val)
                    triggerSuccess("Budget", `${category}: ${formatCurrency(val)}`)
                } else if (activeModal === 'budgetLimit') {
                    await setBudgetLimit(val)
                    triggerSuccess("Limit Bulanan", formatCurrency(val))
                } else if (activeModal === 'addWallet') {
                    const walletName = title || 'Dompet Baru'
                    const walletType = source === 'external' ? 'Bank' : 'Cash'

                    await addWallet(walletName, walletType, newWalletColor, newWalletIcon, val)
                    triggerSuccess("Dompet Baru", walletName)
                }
            }

            resetForm()

        } catch (error) {
            console.error(error)
            alert(error.message || "Gagal menyimpan")
            setIsProcessing(false) // Unlock only on error
        }
    }

    const handleEditTx = () => {
        if (!selectedTx) return
        setAmount(formatNumberInput(selectedTx.amount.toString()))
        setCategory(selectedTx.category)
        if (selectedTx.type === 'INCOME') {
            setActiveModal('topup')
            setWalletSelection(selectedTx.target)
        } else if (selectedTx.type === 'EXPENSE') {
            setActiveModal('expense')
            setWalletSelection(selectedTx.source)
            setTitle(selectedTx.description)
        } else if (selectedTx.type === 'TRANSFER') {
            setActiveModal('withdraw')
        }
    }

    const handleDeleteClick = () => {
        if (!selectedTx) return
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        if (selectedTx) {
            await deleteTransaction(selectedTx.id)
            setSelectedTx(null)
            setShowDeleteModal(false)
            triggerSuccess("Terhapus", "Transaksi dihapus")
        }
    }

    // --- Render Helpers ---
    const getCategoryIcon = (c) => {
        switch (c) {
            case 'F&B': return Coffee
            case 'Transport': return Car
            case 'Shopping': return ShoppingBag
            case 'Bills': return Zap
            default: return MoreHorizontal
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>

    // --- UI RENDER ---
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-8 space-y-6 pb-32 md:pb-8 max-w-md md:max-w-7xl mx-auto overflow-visible">
            {/* 1. Header */}
            <div className="flex justify-between items-center py-2">
                <div className="flex items-center space-x-3">
                    {user?.photoURL ? <img src={user.photoURL} className="w-10 h-10 rounded-full" alt="User" /> : <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center"><UserIcon className="w-6 h-6 text-slate-500" /></div>}
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Selamat Datang,</p>
                        <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{user?.displayName?.split(' ')[0] || 'User'}</h1>
                    </div>
                </div>
                <button onClick={() => window.location.href = '/settings'} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><Settings className="w-6 h-6" /></button>
            </div>

            {/* 2. Smart Input */}
            <form onSubmit={handleSmartSubmit} className="relative group z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={isListening ? "Mendengarkan..." : "Ketik: 'Makan 15rb tunai'..."} className={`relative w-full pl-5 pr-20 py-3.5 rounded-full border-none bg-white shadow-sm focus:shadow-lg focus:ring-0 text-slate-700 text-sm placeholder-slate-400 transition-all font-medium ${isListening ? 'ring-2 ring-blue-400' : ''}`} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <button type="button" onClick={isListening ? stopListening : startListening} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}>{isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
                    <button type="submit" className="p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 shadow-md"><Send className="w-4 h-4" /></button>
                </div>
            </form>

            {/* --- DASHBOARD GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                    {/* 3. Premium Main Balance Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-800 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-purple-500/20 rounded-full blur-xl pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-purple-200 text-sm font-medium">Total Saldo Anda</p>
                                        <button onClick={togglePrivacyMode} className="text-purple-200 hover:text-white transition-colors">
                                            {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <h2 className={`text-4xl sm:text-5xl font-extrabold tracking-tight my-2 text-white ${isPrivacyMode ? 'blur-sm select-none' : ''}`}>
                                        {isPrivacyMode ? 'Rp •••••••' : formatCurrency(wallets.reduce((acc, w) => acc + (w.balance || 0), 0))}
                                    </h2>
                                </div>
                                <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                                    <Wallet className="w-6 h-6 text-purple-100" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3.1 Dynamic Wallet Cards */}
                    <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 md:gap-4 md:space-x-0 md:overflow-visible">
                        {wallets.map(wallet => {
                            let Icon = Wallet
                            if (wallet.icon === 'credit-card') Icon = LucideCreditCard
                            if (wallet.icon === 'banknote') Icon = Banknote
                            if (wallet.icon === 'piggy-bank') Icon = PiggyBank
                            if (wallet.icon === 'smartphone') Icon = Smartphone
                            if (wallet.icon === 'landmark') Icon = Landmark
                            if (wallet.icon === 'safe') Icon = Vault
                            if (wallet.icon === 'gift') Icon = Gift

                            // Color mapping logic (simplified)
                            const colorClass = wallet.color === 'blue'
                                ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-slate-600"
                                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-slate-600"

                            return (
                                <div key={wallet.id} className="w-[85%] md:w-full flex-shrink-0 snap-center">
                                    <CreditCard
                                        label={wallet.name}
                                        balance={isPrivacyMode ? '••••••' : formatCurrency(wallet.balance || 0)}
                                        colorClass={colorClass}
                                        icon={Icon}
                                    />
                                </div>
                            )
                        })}

                        {/* Add Wallet Button */}
                        <div className="w-[85%] md:w-full flex-shrink-0 flex items-center justify-center snap-center">
                            <button onClick={() => openModal('addWallet')} className="w-full h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-colors gap-2">
                                <Plus className="w-10 h-10" />
                                <span className="font-bold text-sm">Tambah Dompet</span>
                            </button>
                        </div>
                    </div>

                    {/* 5. Quick Actions */}
                    <div className="flex justify-between px-2 md:justify-around md:bg-white md:dark:bg-slate-800 md:p-4 md:rounded-3xl md:border md:border-slate-100 md:dark:border-slate-700">
                        <QuickAction icon={Plus} label="Isi Saldo" onClick={() => openModal('topup')} />
                        <QuickAction icon={PenTool} label="Catat" onClick={() => openModal('expense')} />
                        <QuickAction icon={PieChart} label="Analisis" onClick={() => navigate('/analysis')} />
                        <QuickAction icon={Bot} label="Advisor" onClick={() => navigate('/advisor')} />
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    {/* 4. Overview (Expense) */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Overview Pengeluaran</h2>
                            <button onClick={() => navigate('/budgets')} className="p-1.5 text-blue-600 font-bold text-xs hover:underline">Kelola Budget</button>
                        </div>

                        {/* Budget Alert Widget */}
                        {budgets.some(b => {
                            const used = transactions.filter(t => t.type === 'EXPENSE' && t.category === b.category && new Date(t.date).getMonth() === new Date().getMonth()).reduce((sum, t) => sum + Number(t.amount), 0)
                            return (used / b.limit) * 100 > 80
                        }) && (
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl flex items-start space-x-3 animate-pulse">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-200 rounded-full">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Peringatan Budget!</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Beberapa kategori budget Anda hampir habis.</p>
                                    </div>
                                    <button onClick={() => navigate('/budgets')} className="ml-auto p-2 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold shadow-sm">Cek</button>
                                </div>
                            )}

                        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Total Pengeluaran Bulan Ini</p>
                                    <h3 className={`text-2xl font-bold text-slate-800 dark:text-white mt-1 ${isPrivacyMode ? 'blur-sm' : ''}`}>{isPrivacyMode ? 'Rp •••••••' : formatCurrency(transactions.filter(t => t.type === 'EXPENSE' && new Date(t.date).getMonth() === new Date().getMonth()).reduce((sum, t) => sum + Number(t.amount), 0))}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Sisa Limit Budget</p>
                                    <p className="text-sm font-bold text-blue-600">{formatCurrency(Math.max((monthlyBudgetLimit || 5000000) - transactions.reduce((sum, t) => t.type === 'EXPENSE' && new Date(t.date).getMonth() === new Date().getMonth() ? sum + Number(t.amount) : sum, 0), 0))}</p>
                                </div>
                            </div>
                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                                <div style={{ width: `${Math.min((transactions.reduce((s, t) => t.type === 'EXPENSE' && new Date(t.date).getMonth() === new Date().getMonth() ? s + Number(t.amount) : s, 0) / (monthlyBudgetLimit || 5000000)) * 100, 100)}%` }} className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000" />
                            </div>
                        </div>
                    </div>

                    {/* 6. Transactions */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Transaksi Terbaru</h2>
                            <button onClick={() => navigate('/history')} className="text-xs font-semibold text-blue-600">Lihat Semua</button>
                        </div>
                        <div className="space-y-3">
                            {transactions.length === 0 ? <p className="text-center text-slate-400 py-8 text-sm">Belum ada transaksi</p> :
                                transactions.slice(0, 5).map(t => {
                                    const isExp = t.type === 'EXPENSE'
                                    const isTransfer = t.type === 'TRANSFER'
                                    let Icon = getCategoryIcon(t.category)
                                    if (isTransfer) Icon = ArrowUpRight
                                    return (
                                        <div key={t.id} onClick={() => setSelectedTx(t)} className="flex items-center p-3 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-98 transition-transform cursor-pointer hover:border-blue-200">
                                            <div className={`p-2.5 rounded-full mr-4 ${isTransfer ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400' :
                                                isExp ? 'bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400' :
                                                    'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                }`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{t.description || t.category}</h3>
                                                <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()} • {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <span className={`font-bold text-sm ${isTransfer ? 'text-slate-500 dark:text-slate-400' :
                                                isExp ? 'text-slate-800 dark:text-white' :
                                                    'text-emerald-600 dark:text-emerald-400'
                                                }`}>
                                                {isTransfer ? '' : isExp ? '-' : '+'} {isPrivacyMode ? '••••••' : formatCurrency(t.amount)}
                                            </span>
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- REWRITTEN MODAL (FIXED HEADER & FOOTER) --- */}
            <AnimatePresence>
                {!!activeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={resetForm} />

                        {/* Modal Card */}
                        <motion.form
                            onSubmit={handleSaveTransaction}
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col h-[85vh] md:h-auto md:max-h-[85vh] overflow-hidden"
                        >
                            {/* A. Header (Fixed) */}
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0 z-20">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                    {activeModal === 'topup' ? 'Isi Saldo' : activeModal === 'withdraw' ? 'Tarik Tunai' : activeModal === 'budgetLimit' ? 'Limit Bulanan' : activeModal === 'addWallet' ? 'Tambah Dompet' : 'Catat Pengeluaran'}
                                </h3>
                                <button type="button" onClick={resetForm} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
                            </div>

                            {/* B. Content (SCROLLABLE) */}
                            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 pb-32">
                                {/* Hero Input (Amount) */}
                                <div className="flex flex-col items-center justify-center py-4">
                                    <label className="text-sm font-medium text-slate-400 mb-2">Masukkan Nominal</label>
                                    <div className="flex items-center justify-center space-x-2">
                                        <span className="text-3xl font-bold text-slate-400 mt-2">Rp</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoFocus
                                            className="w-full bg-transparent border-none p-0 text-5xl font-extrabold text-slate-900 dark:text-white text-center focus:ring-0 placeholder-slate-600"
                                            placeholder="0"
                                            value={amount}
                                            onChange={handleAmountChange}
                                        />
                                    </div>
                                </div>

                                {/* Category (Expense/Budget only) */}
                                {(activeModal === 'expense' || activeModal === 'budget') && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">Kategori</label>
                                        <div
                                            onClick={() => setShowCategoryPicker(true)}
                                            className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-full ${category === 'F&B' ? 'bg-orange-100 text-orange-600' :
                                                    category === 'Transport' ? 'bg-blue-100 text-blue-600' :
                                                        category === 'Shopping' ? 'bg-emerald-100 text-emerald-600' :
                                                            category === 'Bills' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {React.createElement(getCategoryIcon(category), { size: 20 })}
                                                </div>
                                                <span className="font-semibold text-base">{
                                                    category === 'F&B' ? 'Makanan & Minuman' :
                                                        category === 'Transport' ? 'Transportasi' :
                                                            category === 'Shopping' ? 'Belanja' :
                                                                category === 'Bills' ? 'Tagihan' : 'Lain-lain'
                                                }</span>
                                            </div>
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        </div>
                                    </div>
                                )}

                                {/* Description & Auto-Sub (Expense only) */}
                                {activeModal === 'expense' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">Keterangan</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Contoh: Beli Kopi 20rb"
                                                value={title}
                                                onChange={(e) => {
                                                    const newTitle = e.target.value
                                                    setTitle(newTitle)
                                                    const parsed = parseTransactionText(newTitle)
                                                    if (parsed.amount > 0) setAmount(formatNumberInput(parsed.amount.toString()))
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                                            <input type="checkbox" id="autoSub" checked={addToSubs} onChange={(e) => setAddToSubs(e.target.checked)} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500" />
                                            <label htmlFor="autoSub" className="text-xs font-bold text-purple-700 dark:text-purple-300 cursor-pointer select-none">🔄 Masukkan ke Langganan Rutin?</label>
                                        </div>
                                    </div>
                                )}

                                {/* Source/Target Selection (Topup/Withdraw) */}
                                {(activeModal === 'topup' || activeModal === 'withdraw') && (
                                    <div className="space-y-6">
                                        {/* 1. TARGET SELECTION (GRID) */}
                                        <div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-3 block tracking-wider">
                                                    {activeModal === 'topup' ? 'Tujuan (Masuk Ke)' : 'Sumber (Ambil Dari)'}
                                                </label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {wallets.map((wallet) => {
                                                        const isActive = walletSelection === wallet.id
                                                        let Icon = Wallet
                                                        if (wallet.icon === 'credit-card') Icon = LucideCreditCard
                                                        if (wallet.icon === 'piggy-bank') Icon = PiggyBank
                                                        if (wallet.icon === 'smartphone') Icon = Smartphone
                                                        if (wallet.icon === 'landmark') Icon = Landmark
                                                        if (wallet.icon === 'banknote') Icon = Banknote
                                                        if (wallet.icon === 'safe') Icon = Vault
                                                        if (wallet.icon === 'gift') Icon = Gift

                                                        return (
                                                            <button
                                                                key={wallet.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setWalletSelection(wallet.id)
                                                                    if (activeModal !== 'topup') {
                                                                        const other = wallets.find(w => w.id !== wallet.id)
                                                                        if (other) setSource(other.id)
                                                                    } else {
                                                                        setSource('external')
                                                                    }
                                                                }}
                                                                className={`relative p-4 rounded-3xl transition-all duration-300 flex flex-col items-center space-y-2 border-2 ${isActive
                                                                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                                                                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400 hover:border-slate-200'
                                                                    }`}
                                                            >
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-1 ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                    <Icon size={24} />
                                                                </div>
                                                                <span className={`font-bold text-sm ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500'}`}>
                                                                    {wallet.name}
                                                                </span>
                                                                {isActive && <div className="absolute top-3 right-3 text-blue-500"><Check size={16} strokeWidth={3} /></div>}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Connector */}
                                            <div className="flex justify-center -my-2 relative z-10">
                                                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center animate-bounce">
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                </div>
                                            </div>

                                            {/* 2. SOURCE SELECTION (CAROUSEL) */}
                                            {activeModal === 'topup' && (
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase ml-1 mb-3 block tracking-wider">Sumber Dana</label>
                                                    <div className="flex space-x-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-1 p-2">
                                                        {/* External Option */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSource('external')}
                                                            className={`relative flex-shrink-0 w-32 h-24 rounded-2xl p-3 flex flex-col justify-between text-left transition-all duration-300 snap-center border-2 ${source === 'external'
                                                                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-900/10 scale-100'
                                                                : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 scale-95 opacity-70 hover:opacity-100'
                                                                }`}
                                                        >
                                                            <div className={`p-1.5 rounded-full w-fit ${source === 'external' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                                                <Banknote size={16} />
                                                            </div>
                                                            <span className={`text-xs font-bold ${source === 'external' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>Bank Transfer / External</span>
                                                            {source === 'external' && <div className="absolute top-2 right-2 text-blue-500"><Check size={14} strokeWidth={3} /></div>}
                                                        </button>

                                                        {/* Other Wallets for Transfer */}
                                                        {wallets.filter(w => w.id !== walletSelection).map(wallet => {
                                                            const active = source === wallet.id
                                                            let Icon = Wallet
                                                            if (wallet.icon === 'credit-card') Icon = LucideCreditCard
                                                            if (wallet.icon === 'piggy-bank') Icon = PiggyBank
                                                            if (wallet.icon === 'smartphone') Icon = Smartphone
                                                            if (wallet.icon === 'landmark') Icon = Landmark
                                                            if (wallet.icon === 'banknote') Icon = Banknote
                                                            if (wallet.icon === 'safe') Icon = Vault
                                                            if (wallet.icon === 'gift') Icon = Gift
                                                            return (
                                                                <button
                                                                    key={wallet.id}
                                                                    type="button"
                                                                    onClick={() => setSource(wallet.id)}
                                                                    className={`relative flex-shrink-0 w-32 h-24 rounded-2xl p-3 flex flex-col justify-between text-left transition-all duration-300 snap-center border-2 ${active
                                                                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-900/10 scale-100'
                                                                        : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 scale-95 opacity-70 hover:opacity-100'
                                                                        }`}
                                                                >
                                                                    <div className={`p-1.5 rounded-full w-fit ${active ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                                                        <Icon size={16} />
                                                                    </div>
                                                                    <span className={`text-xs font-bold ${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>{wallet.name}</span>
                                                                    {active && <div className="absolute top-2 right-2 text-blue-500"><Check size={14} strokeWidth={3} /></div>}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Add Wallet Block */}
                                {activeModal === 'addWallet' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">Nama Dompet</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Contoh: Tabungan Liburan"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                            />
                                        </div>

                                        {/* Icon Picker */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase ml-1 mb-3 block tracking-wider">Pilih Ikon</label>
                                            <div className="grid grid-cols-4 gap-3">
                                                {['wallet', 'credit-card', 'piggy-bank', 'smartphone', 'landmark', 'banknote', 'safe', 'gift'].map((iconKey) => {
                                                    let Icon = Wallet
                                                    if (iconKey === 'credit-card') Icon = LucideCreditCard
                                                    if (iconKey === 'piggy-bank') Icon = PiggyBank
                                                    if (iconKey === 'smartphone') Icon = Smartphone
                                                    if (iconKey === 'landmark') Icon = Landmark
                                                    if (iconKey === 'banknote') Icon = Banknote
                                                    if (iconKey === 'safe') Icon = Vault
                                                    if (iconKey === 'gift') Icon = Gift

                                                    const isSelected = newWalletIcon === iconKey
                                                    return (
                                                        <button
                                                            key={iconKey}
                                                            type="button"
                                                            onClick={() => setNewWalletIcon(iconKey)}
                                                            className={`p-3 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                                        >
                                                            <Icon size={24} />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Color Picker */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase ml-1 mb-3 block tracking-wider">Pilih Warna</label>
                                            <div className="flex justify-between px-2">
                                                {['blue', 'emerald', 'purple', 'orange', 'red', 'pink', 'indigo', 'cyan'].map(color => {
                                                    const isSelected = newWalletColor === color
                                                    const bgClass = {
                                                        blue: 'bg-blue-500', emerald: 'bg-emerald-500', purple: 'bg-purple-500',
                                                        orange: 'bg-orange-500', red: 'bg-red-500', pink: 'bg-pink-500',
                                                        indigo: 'bg-indigo-500', cyan: 'bg-cyan-500'
                                                    }[color]

                                                    return (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            onClick={() => setNewWalletColor(color)}
                                                            className={`w-8 h-8 rounded-full ${bgClass} transition-all ring-offset-2 dark:ring-offset-slate-900 ${isSelected ? 'ring-2 ring-slate-800 dark:ring-white scale-125' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase ml-1 mb-3 block tracking-wider">Tipe Saldo</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setSource('external')}
                                                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${source === 'external' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}
                                                >
                                                    <LucideCreditCard size={20} />
                                                    <span className="font-bold text-sm">Bank</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSource('cash')}
                                                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${source === 'cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}
                                                >
                                                    <Wallet size={20} />
                                                    <span className="font-bold text-sm">Tunai</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* C. Footer / Submit Button (Sticky Bottom) */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-30">
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className={`w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95 shadow-xl shadow-slate-200 dark:shadow-none ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing ? 'Memproses...' : 'Simpan'}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

const QuickAction = ({ icon: Icon, label, onClick }) => (
    <div onClick={onClick} className="flex flex-col items-center space-y-3 cursor-pointer group">
        <div className="w-16 h-16 rounded-[1.2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
            <Icon className="w-8 h-8 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
        </div>
        <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors">{label}</span>
    </div>
)

export default Dashboard