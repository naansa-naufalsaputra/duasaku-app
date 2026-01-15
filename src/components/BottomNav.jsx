import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Scan, History, Calendar, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const BottomNav = () => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 border-t bg-background h-20 pb-4 flex items-center justify-around px-2 z-50">
            {[
                { to: "/", icon: Home, label: "Beranda" },
                { to: "/scan", icon: Scan, label: "Scan" },
                { to: "/goals", icon: Target, label: "Impian" },
                { to: "/subscriptions", icon: Calendar, label: "Langganan" },
                { to: "/history", icon: History, label: "Riwayat" }
            ].map(({ to, icon: Icon, label }) => (
                <NavLink
                    key={to}
                    to={to}
                    className="flex-1 flex flex-col items-center justify-center space-y-1"
                >
                    {({ isActive }) => (
                        <>
                            <div className={cn(
                                "w-12 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                isActive ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200" : "text-slate-500 dark:text-slate-400"
                            )}>
                                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium transition-colors",
                                isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-500"
                            )}>
                                {label}
                            </span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    )
}

export default BottomNav
