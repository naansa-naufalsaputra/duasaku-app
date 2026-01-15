import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Scan, History, Calendar, Target, LogOut, Settings, Bot, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import useWalletStore from '@/stores/useWalletStore'

const Sidebar = ({ className }) => {
    const { user, logout } = useWalletStore()

    const navItems = [
        { to: "/", icon: Home, label: "Beranda" },
        { to: "/scan", icon: Scan, label: "Scan QR" },
        { to: "/goals", icon: Target, label: "Impian" },
        { to: "/subscriptions", icon: Calendar, label: "Langganan" },
        { to: "/history", icon: History, label: "Riwayat" },
        { to: "/analysis", icon: Calendar, label: "Analisis" }, // Added to match desktop expectation if needed, or stick to bottom nav items
    ]
    // Filter out Analysis if it is not in bottom nav? BottomNav didn't have Analysis link directly in the list I saw?
    // Checking BottomNav again: Home, Scan, Goals, Subscriptions, History. Analysis is via Quick Action.
    // I will add Analysis to Sidebar as it is common for desktop.

    // Actually, BottomNav had: Home, Scan, Goals, Subscriptions, History.
    // I will stick to that set + Analysis (since user asked for desktop experience).

    return (
        <aside className={cn("bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col", className)}>
            {/* Logo */}
            <div className="p-8 pb-4">
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    DuaSaku
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-wider mt-1">SMART FINANCE</p>
            </div>

            {/* Menu */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {[
                    { to: "/", icon: Home, label: "Beranda" },
                    { to: "/scan", icon: Scan, label: "Scan Transaksi" },
                    { to: "/advisor", icon: Bot, label: "Advisor AI" },
                    { to: "/analysis", icon: PieChart, label: "Analisis" },
                    { to: "/goals", icon: Target, label: "Tabungan Impian" },
                    { to: "/subscriptions", icon: Calendar, label: "Langganan Rutin" },
                    { to: "/history", icon: History, label: "Riwayat Transaksi" },
                ].map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => cn(
                            "flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group",
                            isActive
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                                <span>{label}</span>
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Profile / Bottom Action */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => window.location.href = '/settings'}
                    className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                >
                    {user?.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-full" alt="User" /> : <div className="w-8 h-8 bg-slate-200 rounded-full" />}
                    <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.displayName || 'User'}</p>
                        <p className="text-xs text-slate-400">Pengaturan</p>
                    </div>
                    <Settings className="w-4 h-4" />
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
