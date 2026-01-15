import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Wallet, TrendingUp, AlertCircle, CheckCircle, Trash2, Edit2 } from 'lucide-react'
import useWalletStore from '@/stores/useWalletStore'
import { motion, AnimatePresence } from 'framer-motion'

const Budgets = () => {
    const { budgets, transactions, setBudget, deleteBudget, monthlyBudgetLimit } = useWalletStore()

    // Local State for Modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedBudget, setSelectedBudget] = useState(null)
    const [category, setCategory] = useState('F&B')
    const [limit, setLimit] = useState('')

    // Helpers
    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
    const formatInput = (val) => new Intl.NumberFormat('id-ID').format(val.replace(/\D/g, ''))

    // Calculate Usage
    const getUsage = (cat) => {
        const now = new Date()
        return transactions
            .filter(t => t.type === 'EXPENSE' && t.category === cat && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
            .reduce((sum, t) => sum + Number(t.amount), 0)
    }

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.limit), 0)
    const totalUsage = budgets.reduce((sum, b) => sum + getUsage(b.category), 0)

    // Handlers
    const handleSave = async (e) => {
        e.preventDefault()
        const rawLimit = Number(limit.replace(/\./g, ''))
        if (!rawLimit || rawLimit <= 0) return

        await setBudget(category, rawLimit)

        triggerConfetti() // 🎉
        closeModal()
    }

    const handleDelete = async () => {
        if (selectedBudget && confirm(`Hapus budget ${selectedBudget.category}?`)) {
            await deleteBudget(selectedBudget.id)
            closeModal()
        }
    }

    const openEdit = (b) => {
        setSelectedBudget(b)
        setCategory(b.category)
        setLimit(formatInput(b.limit.toString()))
        setEditMode(true)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditMode(false)
        setSelectedBudget(null)
        setLimit('')
        setCategory('F&B')
    }

    const getProgressColor = (percent) => {
        if (percent >= 100) return 'bg-red-500'
        if (percent >= 80) return 'bg-orange-500'
        return 'bg-blue-500'
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 font-sans">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 px-6 py-4 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-white" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Atur Budget</h1>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 transition-colors">
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Overview Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <p className="text-blue-200 text-sm font-medium mb-1">Total Budget Bulanan</p>
                        <h2 className="text-4xl font-bold mb-4">{formatCurrency(totalBudget)}</h2>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold text-blue-100">
                                <span>Terpakai: {formatCurrency(totalUsage)}</span>
                                <span>{Math.round((totalUsage / totalBudget) * 100 || 0)}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min((totalUsage / totalBudget) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Budget List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Daftar Kategori</h3>
                        <span className="text-xs text-slate-400 font-medium">{budgets.length} Budget Aktif</span>
                    </div>

                    {budgets.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Belum ada budget yang diatur.</p>
                            <button onClick={() => setIsModalOpen(true)} className="text-blue-600 font-bold mt-2 text-sm">Buat Baru Sekarang</button>
                        </div>
                    ) : (
                        budgets.map(b => {
                            const usage = getUsage(b.category)
                            const percent = (usage / b.limit) * 100
                            const isOver = percent >= 100

                            return (
                                <motion.div
                                    key={b.id}
                                    layoutId={b.id}
                                    onClick={() => openEdit(b)}
                                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm active:scale-98 transition-transform cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2.5 rounded-xl ${isOver ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-white'}`}>
                                                {b.category === 'F&B' ? '🍔' : b.category === 'Transport' ? '🚗' : b.category === 'Shopping' ? '🛍️' : '📄'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white">{b.category}</h4>
                                                <p className="text-xs text-slate-400">Limit: {formatCurrency(b.limit)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {formatCurrency(usage)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="relative pt-1">
                                        <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-100 dark:bg-slate-700">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(percent, 100)}%` }}
                                                transition={{ duration: 1 }}
                                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getProgressColor(percent)}`}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1.5">
                                            <p className={`text-[10px] font-bold ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {isOver ? 'Over Budget!' : `Sisa ${formatCurrency(b.limit - usage)}`}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400">{percent.toFixed(0)}%</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Modal Form */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold dark:text-white">{editMode ? 'Edit Budget' : 'Tambah Budget'}</h3>
                                {editMode && (
                                    <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSave} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Kategori</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['F&B', 'Transport', 'Shopping', 'Bills', 'Misc'].map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setCategory(cat)}
                                                className={`p-2 rounded-xl text-sm font-medium border transition-all ${category === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Batas Nominal</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                                        <input
                                            type="text"
                                            value={limit}
                                            onChange={(e) => setLimit(formatInput(e.target.value))}
                                            placeholder="0"
                                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl pl-12 pr-4 py-3.5 font-bold text-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            inputMode="numeric"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                                    Simpan
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Budgets
