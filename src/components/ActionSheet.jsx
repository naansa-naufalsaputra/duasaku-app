import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Trash2, X } from 'lucide-react'

const ActionSheet = ({ isOpen, onClose, onEdit, onDelete, title = "Aksi" }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-[2px]"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-[61] p-6 pb-12 border-t border-slate-100 dark:border-slate-800"
                    >
                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
                            <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    onEdit()
                                    onClose()
                                }}
                                className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white font-semibold active:scale-98 transition-transform"
                            >
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
                                    <Edit2 className="w-5 h-5" />
                                </div>
                                <span>Edit Detail Transaksi</span>
                            </button>

                            <button
                                onClick={() => {
                                    onDelete()
                                }}
                                className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-semibold active:scale-98 transition-transform"
                            >
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <span>Hapus Transaksi (Permanen)</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default ActionSheet
