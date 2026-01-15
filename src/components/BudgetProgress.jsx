import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

const BudgetProgress = ({ category, spent, limit }) => {
    const percentage = Math.min((spent / limit) * 100, 100)

    // Color Logic
    let colorClass = 'bg-emerald-500'
    if (percentage >= 80) colorClass = 'bg-red-500'
    else if (percentage >= 50) colorClass = 'bg-yellow-500'

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="font-semibold text-slate-700">{category}</h3>
                    <p className="text-xs text-slate-400">
                        Terpakai: <span className={percentage >= 80 ? 'text-red-500 font-bold' : 'text-slate-600'}>{formatCurrency(spent)}</span>
                        <span className="mx-1">/</span>
                        {formatCurrency(limit)}
                    </p>
                </div>
                <div className="text-right">
                    <span className={`text-sm font-bold ${percentage >= 80 ? 'text-red-600' : 'text-slate-600'}`}>
                        {percentage.toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${colorClass}`}
                />
            </div>

            {/* Warning Message */}
            {percentage >= 80 && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-lg text-xs font-medium animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Awas Boncos! Pengeluaran menipis.</span>
                </div>
            )}
        </div>
    )
}

export default BudgetProgress
