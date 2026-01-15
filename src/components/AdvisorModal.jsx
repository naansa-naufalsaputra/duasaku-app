import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bot, Sparkles } from 'lucide-react'

const AdvisorModal = ({ isOpen, onClose, isLoading, advice }) => {
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
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="fixed left-4 right-4 bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-md md:mx-auto bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center space-x-2">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Fin-Advisor AI</h3>
                                    <p className="text-[10px] opacity-80">Galak tapi penyayang</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 bg-slate-50 min-h-[200px] flex flex-col items-center justify-center">
                            {isLoading ? (
                                <div className="text-center space-y-4">
                                    <div className="relative w-16 h-16 mx-auto">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="w-full h-full border-4 border-violet-200 border-t-violet-600 rounded-full"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-violet-600 animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium animate-pulse">
                                        Sedang mengaudit dosa finansialmu...
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-start space-x-3 w-full">
                                    <div className="w-8 h-8 rounded-full bg-violet-100 flex-shrink-0 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div className="bg-white p-4 rounded-lg rounded-tl-none shadow-sm border border-slate-100 text-sm text-slate-700 leading-relaxed">
                                        {advice || "Halo! Klik tombol di bawah biar aku roasting pengeluaranmu."}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Decor */}
                        <div className="h-1 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default AdvisorModal
