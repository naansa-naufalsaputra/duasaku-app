import React from 'react'
import { motion } from 'framer-motion'

const CreditCard = ({ balance, label, colorClass, icon: Icon }) => {
    // colorClass expect tailwind classes like "bg-blue-100 dark:bg-blue-900"

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`relative w-full aspect-[1.586] rounded-2xl p-5 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between overflow-hidden ${colorClass}`}
        >
            {/* Content */}
            <div className="relative z-10 flex items-center space-x-2.5">
                <div className="p-2 bg-white/50 dark:bg-white/10 rounded-xl backdrop-blur-md shadow-sm">
                    {Icon && <Icon className="w-5 h-5 text-slate-700 dark:text-white" />}
                </div>
                <span className="font-semibold text-sm tracking-wide opacity-80 uppercase">{label}</span>
            </div>

            <div className="relative z-10 mt-4">
                <p className="text-[10px] font-medium opacity-60 uppercase mb-0.5 tracking-wider">Total Balance</p>
                <h2 className="text-[28px] font-extrabold tracking-tight leading-none truncate">
                    {balance}
                </h2>
            </div>

            {/* Giant Watermark */}
            <div className="absolute -bottom-6 -right-6 z-0 opacity-[0.07] dark:opacity-[0.05] rotate-12 pointer-events-none">
                {Icon && <Icon className="w-40 h-40" />}
            </div>
        </motion.div>
    )
}

export default CreditCard
