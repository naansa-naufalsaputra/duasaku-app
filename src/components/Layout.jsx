import React from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

const Layout = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground font-sans flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar for Desktop */}
            <Sidebar className="hidden md:flex w-72 flex-shrink-0 h-screen sticky top-0 z-20" />

            {/* Main Content Area */}
            <main className="flex-1 pb-24 md:pb-0 h-screen overflow-y-auto scroll-smooth">
                <div className="w-full h-full relative">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Nav for Mobile */}
            <div className="md:hidden">
                <BottomNav />
            </div>
        </div>
    )
}

export default Layout
