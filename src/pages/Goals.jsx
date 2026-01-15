import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWalletStore from '@/stores/useWalletStore'
import { ArrowLeft, Plus, Target, Wallet, Trash2, Camera as CameraIcon } from 'lucide-react'
import { Camera, CameraResultType } from '@capacitor/camera'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils' // Assuming utils exists, or inline formatted
import { triggerSchoolPride } from '@/lib/confetti'

const COLORS = [
    { name: 'Blue', value: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-100' },
    { name: 'Purple', value: 'bg-purple-500', text: 'text-purple-500', bg: 'bg-purple-100' },
    { name: 'Pink', value: 'bg-pink-500', text: 'text-pink-500', bg: 'bg-pink-100' },
    { name: 'Orange', value: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-100' },
    { name: 'Green', value: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-100' },
]

const Goals = () => {
    const navigate = useNavigate()
    const { goals, addGoal, addSavings, deleteGoal, atmBalance, cashBalance } = useWalletStore()

    // Modals State
    const [showAddModal, setShowAddModal] = useState(false)
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [selectedGoal, setSelectedGoal] = useState(null)

    // Form Stats
    const [title, setTitle] = useState('')
    const [targetAmount, setTargetAmount] = useState('') // String input
    const [emoji, setEmoji] = useState('🎯')
    const [image, setImage] = useState(null)
    const [color, setColor] = useState(COLORS[0])

    // Savings Form
    const [saveAmount, setSaveAmount] = useState('')
    const [sourceWallet, setSourceWallet] = useState('ATM')

    const totalSaved = goals.reduce((acc, curr) => acc + (curr.savedAmount || curr.currentAmount || 0), 0)

    // Handlers
    const handleCreateGoal = async (e) => {
        e.preventDefault()
        if (!title || !targetAmount) return

        await addGoal({
            title,
            targetAmount,
            emoji,
            image,
            color: color.value
        })
        setShowAddModal(false)
        resetForm()
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!selectedGoal || !saveAmount) return

        const success = await addSavings(selectedGoal.id, saveAmount, sourceWallet)
        if (success) {
            // Check for Gamification
            const current = (selectedGoal.savedAmount || 0) + Number(saveAmount)
            const target = selectedGoal.targetAmount || 1
            if (current >= target) {
                triggerSchoolPride() // 🎉
            }

            setShowSaveModal(false)
            setSaveAmount('')
        }
    }

    const handleDelete = async () => {
        if (!selectedGoal) return
        if (confirm(`Yakin hapus tabungan "${selectedGoal.title}"?`)) {
            await deleteGoal(selectedGoal.id)
            setShowSaveModal(false)
        }
    }

    const resetForm = () => {
        setTitle('')
        setTargetAmount('')
        setEmoji('🎯')
        setImage(null)
        setColor(COLORS[0])
    }

    const openSaveModal = (goal) => {
        setSelectedGoal(goal)
        setShowSaveModal(true)
    }

    // Helper: Real-time Rupiah Formatting
    const handleAmountChange = (e, setFunc) => {
        const raw = e.target.value.replace(/\D/g, '')
        setFunc(raw ? Number(raw) : '')
    }

    const handleSelectImage = async () => {
        try {
            const photo = await Camera.getPhoto({
                quality: 80,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: 'PHOTOS'
            })
            if (photo.base64String) {
                setImage(`data:image/jpeg;base64,${photo.base64String}`)
            }
        } catch (error) {
            console.log("User cancelled camera", error)
        }
    }

    // Formatters
    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 font-sans">
            {/* Header */}
            <div className="bg-indigo-600 px-6 pt-8 pb-12 rounded-b-[2rem] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

                <div className="flex items-center text-white mb-6 relative z-10">
                    <button onClick={() => navigate('/')} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold ml-4">Impianku</h1>
                </div>

                <div className="relative z-10 text-center">
                    <p className="text-indigo-200 text-sm mb-1">Total Tabungan</p>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight">{formatIDR(totalSaved)}</h2>
                </div>
            </div>

            {/* Goals Grid */}
            <div className="px-6 -mt-8 relative z-10 pb-24">
                {goals.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center shadow-sm border border-slate-100 dark:border-slate-700 py-16"
                    >
                        <div className="text-6xl mb-4">🚀</div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Belum ada impian nih.</h3>
                        <p className="text-slate-500 text-sm">Yuk mulai wujudkan impianmu sekarang!</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {goals.map((goal) => {
                            const current = goal.savedAmount || goal.currentAmount || 0
                            const percent = Math.min((current / goal.targetAmount) * 100, 100)
                            const goalColor = COLORS.find(c => c.value === goal.color) || COLORS[0]

                            return (
                                <motion.div
                                    key={goal.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => openSaveModal(goal)}
                                    className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden cursor-pointer"
                                >
                                    {/* Thumbnail Background (Optional) */}
                                    {goal.image && (
                                        <div className="absolute inset-0 z-0">
                                            <img src={goal.image} alt="bg" className="w-full h-full object-cover opacity-10" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-800 dark:via-slate-800/80"></div>
                                        </div>
                                    )}

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`w-12 h-12 rounded-2xl ${goalColor.bg} dark:bg-slate-700 flex items-center justify-center text-2xl shadow-inner overflow-hidden border border-white/20`}>
                                                {goal.image ? (
                                                    <img src={goal.image} className="w-full h-full object-cover" alt="icon" />
                                                ) : (
                                                    goal.emoji
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target</span>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatIDR(goal.targetAmount)}</p>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{goal.title || goal.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            Terkumpul: <span className={goalColor.text + " font-bold"}>{formatIDR(current)}</span>
                                        </p>

                                        {/* Progress Bar */}
                                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percent}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                className={`h-full ${goal.color}`}
                                            />
                                        </div>
                                        <div className="mt-2 text-right">
                                            <span className="text-xs font-bold text-slate-400">{percent.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Floating Action Button (Fixed) */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-2xl shadow-indigo-300 dark:shadow-indigo-900/50 flex items-center justify-center text-white z-50"
            >
                <Plus className="w-8 h-8" />
            </motion.button>

            {/* Modal: Add Goal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowAddModal(false)}
                        />
                        {/* Content */}
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            className="relative z-10 bg-white dark:bg-slate-800 w-full sm:w-96 rounded-t-[2rem] sm:rounded-2xl p-6 shadow-2xl safe-area-bottom border-t border-slate-100 dark:border-slate-700"
                        >
                            <h2 className="text-xl font-bold mb-6 dark:text-white">Impian Baru ✨</h2>
                            <form onSubmit={handleCreateGoal} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Nama Impian</label>
                                    <div className="flex space-x-3 mt-1">

                                        {/* Image Picker */}
                                        <button
                                            type="button"
                                            onClick={handleSelectImage}
                                            className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex-none overflow-hidden relative border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 transition-colors"
                                        >
                                            {image ? (
                                                <img src={image} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                    <CameraIcon className="w-6 h-6" />
                                                    <span className="text-[10px] font-bold mt-1">FOTO</span>
                                                </div>
                                            )}
                                        </button>

                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                            placeholder="Liburan ke Bali..."
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Target Dana</label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                                        <input
                                            type="text"
                                            value={targetAmount ? new Intl.NumberFormat('id-ID').format(targetAmount) : ''}
                                            onChange={(e) => handleAmountChange(e, setTargetAmount)}
                                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl pl-12 pr-4 py-3 border-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono text-lg"
                                            placeholder="5.000.000"
                                            inputMode="numeric"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Warna Kartu</label>
                                    <div className="flex space-x-3">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c.name}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                className={`w-8 h-8 rounded-full ${c.value} ${color.name === c.name ? 'ring-4 ring-offset-2 ring-indigo-200 dark:ring-indigo-900' : ''}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all">
                                    ✨ Simpan Impian
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Add Savings */}
            <AnimatePresence>
                {showSaveModal && selectedGoal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowSaveModal(false)}
                        />
                        {/* Content */}
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            className="relative z-10 bg-white dark:bg-slate-800 w-full sm:w-96 rounded-t-[2rem] sm:rounded-2xl p-6 shadow-2xl safe-area-bottom border-t border-slate-100 dark:border-slate-700"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold dark:text-white">Nabung Yuk! 💰</h2>
                                    <p className="text-sm text-slate-500">untuk {selectedGoal.title}</p>
                                </div>
                                <button onClick={() => handleDelete()} className="p-2 text-red-400 hover:bg-red-50 rounded-full">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Ambil Dari</label>
                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setSourceWallet('ATM')}
                                            className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${sourceWallet === 'ATM' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}
                                        >
                                            💳 ATM ({formatCurrency(atmBalance)})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSourceWallet('CASH')}
                                            className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${sourceWallet === 'CASH' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-400'}`}
                                        >
                                            💵 CASH ({formatCurrency(cashBalance)})
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Nominal</label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                                        <input
                                            type="text"
                                            value={saveAmount ? new Intl.NumberFormat('id-ID').format(saveAmount) : ''}
                                            onChange={(e) => handleAmountChange(e, setSaveAmount)}
                                            className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl pl-12 pr-4 py-3 border-none focus:ring-2 focus:ring-green-500 dark:text-white font-mono text-lg"
                                            placeholder="100.000"
                                            inputMode="numeric"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full mt-8 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all">
                                    Masukan Tabungan
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Goals
