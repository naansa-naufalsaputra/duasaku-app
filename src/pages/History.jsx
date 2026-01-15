import React, { useState, useMemo } from 'react'
import useWalletStore from '@/stores/useWalletStore'
import { generateMonthlyReport } from '@/lib/reportGenerator'
import { Trash2, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, FileText, ChevronLeft, ChevronRight, Calendar, X, Check, ChevronDown, LogOut } from 'lucide-react'
import { formatCurrency, formatNumberInput } from '@/lib/utils'
import ActionSheet from '@/components/ActionSheet'
import ModalPortal from '@/components/ModalPortal'
import { motion, AnimatePresence } from 'framer-motion'

const History = () => {
    const { transactions, user, deleteTransaction, editTransaction, addSubscription } = useWalletStore()
    const [selectedTx, setSelectedTx] = useState(null) // For ActionSheet

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editAmount, setEditAmount] = useState('')
    const [editTitle, setEditTitle] = useState('')
    const [editCategory, setEditCategory] = useState('')
    const [editAddToSub, setEditAddToSub] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Current Month State
    const [currentDate, setCurrentDate] = useState(new Date())

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            newDate.setMonth(prev.getMonth() - 1)
            return newDate
        })
    }

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            newDate.setMonth(prev.getMonth() + 1)
            return newDate
        })
    }

    // Checking if next month is available (future)
    const canGoNext = useMemo(() => {
        const now = new Date()
        return currentDate.getMonth() < now.getMonth() || currentDate.getFullYear() < now.getFullYear()
    }, [currentDate])



    // Filter & Group Logic
    const groupedTransactions = useMemo(() => {
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()

        const filtered = transactions.filter(t => {
            const tDate = new Date(t.date)
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
        }).sort((a, b) => new Date(b.date) - new Date(a.date))

        // Group by Date String (YYYY-MM-DD)
        const groups = {}
        filtered.forEach(t => {
            const dateKey = new Date(t.date).toDateString() // "Mon Jan 12 2026"
            if (!groups[dateKey]) {
                groups[dateKey] = []
            }
            groups[dateKey].push(t)
        })

        return groups
    }, [transactions, currentDate])

    // Delete Logic
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingTx, setDeletingTx] = useState(null)

    const handleDeleteClick = () => {
        if (!selectedTx) return
        setDeletingTx(selectedTx)
        setSelectedTx(null) // Close ActionSheet

        // Wait for ActionSheet to close (animation duration)
        setTimeout(() => {
            setShowDeleteModal(true)
        }, 300)
    }

    const confirmDelete = async () => {
        if (deletingTx) {
            await deleteTransaction(deletingTx.id)
            setDeletingTx(null)
            setShowDeleteModal(false)
        }
    }

    const handleEditClick = () => {
        if (!selectedTx) return
        setEditAmount(formatNumberInput(selectedTx.amount.toString()))
        setEditTitle(selectedTx.description || selectedTx.category)
        setEditCategory(selectedTx.category)
        setEditAddToSub(false)
        setIsEditModalOpen(true)
        setSelectedTx(null) // Close Action Sheet
    }

    const handleSaveEdit = async (e) => {
        e.preventDefault()
        if (!selectedTx && !isEditModalOpen) return // Safety check, though logic differs slightly as we closed ActionSheet
        // We need to store the ID somewhere. Let's use a ref or just keep selectedTx open? 
        // Actually, handleEditClick closed selectedTx. We need to track which ID we are editing.
        // Let's modify handleEditClick to NOT clear selectedTx immediately or store it in another state?
        // Better: Use a separate state `editingTxId` or just keep `selectedTx` as the source of truth for the ID, 
        // but current logic closes ActionSheet by clearing `selectedTx`. 
        // FIX: I will add `editingTx` state.
    }

    // Refined Logic for Edit
    const [editingTx, setEditingTx] = useState(null)

    const handleEditClickRefined = () => {
        if (!selectedTx) return
        setEditingTx(selectedTx) // Store for editing
        setEditAmount(formatNumberInput(selectedTx.amount.toString()))
        setEditTitle(selectedTx.description || selectedTx.category)
        setEditCategory(selectedTx.category)
        setEditAddToSub(false)
        setIsEditModalOpen(true)
        setSelectedTx(null) // Close Action Sheet
    }

    const handleSaveEditFinal = async (e) => {
        e.preventDefault()
        if (!editingTx) return

        setIsSubmitting(true)
        try {
            const val = Number(editAmount.replace(/\./g, ''))
            if (!val || val <= 0) throw new Error("Nominal tidak valid")

            const newData = {
                amount: val,
                category: editCategory,
                description: editTitle
            }

            await editTransaction(editingTx.id, newData)

            if (editAddToSub) {
                await addSubscription({
                    name: editTitle,
                    cost: val,
                    dueDay: new Date().getDate(),
                    type: 'Monthly',
                    color: 'blue'
                })
            }

            setIsEditModalOpen(false)
            setEditingTx(null)
        } catch (error) {
            alert("Gagal menyimpan: " + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }


    const handleDownloadReport = () => {
        const currentMonthTx = Object.values(groupedTransactions).flat()
        if (currentMonthTx.length === 0) {
            alert("Tidak ada data di bulan ini untuk dilaporkan.")
            return
        }
        try {
            generateMonthlyReport(currentMonthTx, user)
        } catch (error) {
            console.error("PDF Fail:", error)
            alert("Gagal membuat PDF.")
        }
    }

    const monthLabel = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <div className="p-4 pb-32 min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header Area */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Riwayat</h1>
                <button
                    onClick={handleDownloadReport}
                    className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95"
                >
                    <FileText className="w-5 h-5" />
                </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </button>
                <div className="text-center">
                    <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Periode</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white">{monthLabel}</span>
                </div>
                <button
                    onClick={handleNextMonth}
                    disabled={!canGoNext}
                    className={`p-2 rounded-full transition-colors ${!canGoNext ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    <ChevronRight className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </button>
            </div>

            {/* Grouped List */}
            <div className="space-y-6">
                {Object.keys(groupedTransactions).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Calendar className="w-16 h-16 text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">Belum ada transaksi di bulan ini</p>
                    </div>
                ) : (
                    Object.entries(groupedTransactions).map(([dateStr, txs]) => {
                        const dateObj = new Date(txs[0].date)
                        const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' })
                        const dayNum = dateObj.getDate()
                        const monthShort = dateObj.toLocaleDateString('id-ID', { month: 'short' })

                        return (
                            <motion.div
                                key={dateStr}
                                initial="hidden"
                                animate="visible"
                                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                            >
                                {/* Date Header */}
                                <div className="flex items-baseline space-x-2 mb-3 px-2">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{dayName},</h3>
                                    <span className="text-sm font-medium text-slate-500">{dayNum} {monthShort}</span>
                                </div>

                                {/* List Items */}
                                <div className="space-y-3">
                                    {txs.map((t) => (
                                        <motion.div
                                            key={t.id}
                                            variants={itemVariants}
                                            onClick={() => setSelectedTx(t)}
                                            className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between active:scale-98 transition-transform cursor-pointer"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-3 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : t.type === 'EXPENSE' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                                                    {t.type === 'INCOME' ? <ArrowDownLeft className="w-5 h-5" /> :
                                                        t.type === 'EXPENSE' ? <ArrowUpRight className="w-5 h-5" /> :
                                                            <ArrowRightLeft className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-1">{t.category}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{t.description || 'Tidak ada catatan'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`block font-bold text-sm ${t.type === 'TRANSFER' ? 'text-slate-500 dark:text-slate-400' :
                                                        t.type === 'EXPENSE' ? 'text-slate-800 dark:text-white' :
                                                            'text-emerald-600'
                                                    }`}>
                                                    {t.type === 'TRANSFER' ? '' : t.type === 'EXPENSE' ? '-' : '+'} {formatCurrency(t.amount)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>

            <ActionSheet
                isOpen={!!selectedTx}
                onClose={() => setSelectedTx(null)}
                title="Detail Transaksi"
                onDelete={handleDeleteClick}
                onEdit={handleEditClickRefined}
            />

            {/* CUSTOM DELETE MODAL */}
            <AnimatePresence>
                {showDeleteModal && (
                    <ModalPortal>
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative w-full max-w-sm bg-slate-900 rounded-[20px] p-6 text-center border border-slate-700 shadow-2xl z-10"
                            >
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <LogOut className="w-8 h-8 text-red-500 ml-1" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Hapus Transaksi?</h3>
                                <p className="text-slate-400 text-sm mb-6">Data yang dihapus tidak dapat dikembalikan.</p>
                                <div className="flex space-x-3 relative z-10">
                                    <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-slate-600 text-slate-300 font-bold hover:bg-slate-800 transition-colors">Batal</button>
                                    <button type="button" onClick={confirmDelete} className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-900/30 transition-all">Hapus</button>
                                </div>
                            </motion.div>
                        </div>
                    </ModalPortal>
                )}
            </AnimatePresence>

            {/* --- EDIT MODAL (FLEXBOX STRUCTURE) --- */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
                        {/* Backdrop */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />

                        {/* Modal Card */}
                        <motion.form
                            onSubmit={handleSaveEditFinal}
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border-t border-slate-700 shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            {/* A. Header (Fixed) */}
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 rounded-t-3xl shrink-0">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Edit Transaksi</h3>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
                            </div>

                            {/* B. Content (SCROLLABLE) */}
                            <div className="p-5 overflow-y-auto flex-1 gap-4 flex flex-col">
                                {/* Amount Input */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">Nominal (Rp)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className="w-full rounded-[20px] border-none bg-slate-100 dark:bg-slate-800 p-5 text-2xl font-bold text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(formatNumberInput(e.target.value))}
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">Kategori</label>
                                    <div className="relative">
                                        <select className="w-full appearance-none rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                                            <option value="F&B">Makanan & Minuman</option>
                                            <option value="Transport">Transportasi</option>
                                            <option value="Shopping">Belanja</option>
                                            <option value="Bills">Tagihan</option>
                                            <option value="Misc">Lain-lain</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">Keterangan</label>
                                    <input type="text" className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                                </div>

                                {/* Add to Sub (Only if Expense) */}
                                {editingTx?.type === 'EXPENSE' && (
                                    <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                                        <input type="checkbox" id="editAutoSub" checked={editAddToSub} onChange={(e) => setEditAddToSub(e.target.checked)} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500" />
                                        <label htmlFor="editAutoSub" className="text-xs font-bold text-purple-700 dark:text-purple-300 cursor-pointer select-none">🔄 Masukkan ke Langganan Rutin?</label>
                                    </div>
                                )}
                            </div>

                            {/* C. Footer / Submit Button (Fixed) */}
                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 pb-8 sm:pb-5 rounded-b-none shrink-0">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95 shadow-xl shadow-slate-200 dark:shadow-none ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default History
