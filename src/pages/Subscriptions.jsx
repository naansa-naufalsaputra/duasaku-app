import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWalletStore from '@/stores/useWalletStore'
import { ArrowLeft, Plus, Calendar, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'

const COLORS = [
    { name: 'Purple', value: 'bg-purple-500', text: 'text-purple-500', bg: 'bg-purple-100' },
    { name: 'Red', value: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-100' },
    { name: 'Blue', value: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-100' },
    { name: 'Orange', value: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-100' },
]

const Subscriptions = () => {
    const navigate = useNavigate()
    const { subscriptions, addSubscription, removeSubscription } = useWalletStore()

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false)

    // Form Stats
    const [name, setName] = useState('')
    const [cost, setCost] = useState('')
    const [dueDay, setDueDay] = useState('')
    const [color, setColor] = useState(COLORS[0])

    // New States for "Record Now"
    const [recordNow, setRecordNow] = useState(false)
    const [sourceWallet, setSourceWallet] = useState('ATM')

    const totalMonthlyBill = subscriptions.reduce((acc, curr) => acc + (curr.cost || 0), 0)

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!name || !cost || !dueDay) return

        await addSubscription({
            name,
            cost: Number(cost),
            dueDay,
            color: color.value,
            type: 'Monthly',
            recordNow,
            sourceWallet
        })
        setShowAddModal(false)
        resetForm()
    }

    const handleDelete = async (id, subName) => {
        if (confirm(`Hapus langganan "${subName}"?`)) {
            await removeSubscription(id)
        }
    }

    const resetForm = () => {
        setName('')
        setCost('')
        setDueDay('')
        setDueDay('')
        setColor(COLORS[0])
        setRecordNow(false)
        setSourceWallet('ATM')
    }

    // Helper: Real-time Rupiah Formatting
    const handleAmountChange = (e, setFunc) => {
        const raw = e.target.value.replace(/\D/g, '')
        setFunc(raw ? Number(raw) : '')
    }

    // Fixed formatIDR helper
    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 font-sans">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 px-6 pt-8 pb-12 rounded-b-[2rem] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                <div className="flex items-center text-white mb-6 relative z-10">
                    <button onClick={() => navigate('/')} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold ml-4">Langganan Rutin</h1>
                </div>

                <div className="relative z-10 text-center">
                    <p className="text-purple-100 text-sm mb-1 uppercase tracking-wider font-semibold">Total Tagihan Bulanan</p>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight">{formatIDR(totalMonthlyBill)}</h2>
                </div>
            </div>

            {/* List */}
            <div className="px-6 -mt-8 relative z-10 pb-24">
                {subscriptions.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center shadow-sm border border-slate-100 dark:border-slate-700 py-16"
                    >
                        <div className="w-20 h-20 bg-purple-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                            🗓️
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Aman, tidak ada tagihan.</h3>
                        <p className="text-slate-500 text-sm">Tambahkan langganan agar tidak lupa bayar!</p>
                    </motion.div>
                ) : (
                    <div className="flex flex-col space-y-4">
                        {subscriptions.map((sub) => {
                            // Find color object
                            const subColor = COLORS.find(c => c.value === sub.color) || COLORS[0]

                            return (
                                <motion.div
                                    key={sub.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-12 h-12 rounded-2xl ${subColor.bg} flex items-center justify-center text-lg font-bold ${subColor.text}`}>
                                            {sub.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">{sub.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Setiap tgl {sub.dueDay}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{formatIDR(sub.cost)}</span>
                                        <button
                                            onClick={() => handleDelete(sub.id, sub.name)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* FAB */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 rounded-full shadow-2xl shadow-purple-300 dark:shadow-purple-900/50 flex items-center justify-center text-white z-50"
            >
                <Plus className="w-8 h-8" />
            </motion.button>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowAddModal(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            className="relative z-10 bg-white dark:bg-slate-800 w-full sm:w-96 rounded-t-[2rem] sm:rounded-2xl p-6 shadow-2xl safe-area-bottom border-t border-slate-100 dark:border-slate-700"
                        >
                            <h2 className="text-xl font-bold mb-6 dark:text-white">Tambah Langganan 📅</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Nama Layanan</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full mt-1 bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                                        placeholder="Netflix / Spotify..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Biaya Bulanan</label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                                        <input
                                            type="text"
                                            value={cost ? new Intl.NumberFormat('id-ID').format(cost) : ''}
                                            onChange={(e) => handleAmountChange(e, setCost)}
                                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl pl-12 pr-4 py-3 border-none focus:ring-2 focus:ring-purple-500 dark:text-white font-mono text-lg"
                                            placeholder="186.000"
                                            inputMode="numeric"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Tanggal Tagihan (1-31)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={dueDay}
                                        onChange={(e) => setDueDay(e.target.value)}
                                        className="w-full mt-1 bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                                        placeholder="Tgl 25"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Warna Label</label>
                                    <div className="flex space-x-3">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c.name}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                className={`w-8 h-8 rounded-full ${c.value} ${color.name === c.name ? 'ring-4 ring-offset-2 ring-purple-200 dark:ring-purple-900' : ''}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Record Now Option */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                id="recordNow"
                                                checked={recordNow}
                                                onChange={(e) => setRecordNow(e.target.checked)}
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white checked:border-purple-600 checked:bg-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all dark:border-slate-500 dark:bg-slate-800 dark:checked:border-purple-500 dark:checked:bg-purple-500"
                                            />
                                            <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                                                <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <label htmlFor="recordNow" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                                            Catat pembayaran bulan ini ke History?
                                        </label>
                                    </div>

                                    {/* Source Wallet Dropdown (Conditional) */}
                                    <AnimatePresence>
                                        {recordNow && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pl-8 pt-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Sumber Dana</label>
                                                    <select
                                                        value={sourceWallet}
                                                        onChange={(e) => setSourceWallet(e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-purple-500 dark:text-white"
                                                    >
                                                        <option value="ATM">💳 ATM / Bank</option>
                                                        <option value="CASH">💵 Tunai / Cash</option>
                                                    </select>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform">
                                    Simpan Langganan
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >
        </div >
    )
}

export default Subscriptions
