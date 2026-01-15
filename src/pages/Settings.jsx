import React, { useState } from 'react'
import useWalletStore from '@/stores/useWalletStore'
import { generateMonthlyReport, generateCSV } from '@/lib/reportGenerator'
import { updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import {
    ChevronLeft, User, Moon, Sun, FileText, Trash2, LogOut, ChevronRight, Edit2, Lock, Terminal, Download
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Modal from '@/components/Modal'

const Settings = () => {
    const navigate = useNavigate()
    const { user, darkMode, toggleDarkMode, transactions, reset, logout, ledgerId, invitations, invitePartner, acceptInvitation, declineInvitation, biometricEnabled, setBiometric } = useWalletStore()

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [newName, setNewName] = useState(user?.displayName || '')

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        if (!newName.trim()) return

        try {
            await updateProfile(auth.currentUser, {
                displayName: newName
            })
            // Force reload to reflect changes or manually update store if we had a setUser action (but onAuthStateChanged handles it usually on refresh)
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert("Gagal update profil.")
        }
    }

    const handleDownloadReport = () => {
        if (transactions.length === 0) {
            alert("Belum ada transaksi.")
            return
        }
        generateMonthlyReport(transactions, user)
    }

    const handleDownloadCSV = () => {
        if (transactions.length === 0) {
            alert("Belum ada transaksi.")
            return
        }
        generateCSV(transactions)
    }

    const handleResetData = () => {
        if (confirm("Apakah Anda yakin ingin menghapus SELURUH data transaksi? Tindakan ini tidak bisa dibatalkan.")) {
            if (confirm("Yakin 100%? Data akan hilang selamanya.")) {
                reset()
                alert("Data berhasil direset.")
                window.location.reload()
            }
        }
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-bold text-lg text-slate-800 dark:text-white">Pengaturan</h1>
                    <div className="w-8"></div> {/* Spacer */}
                </div>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6">

                {/* Profile Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center space-y-3"
                >
                    <div className="relative">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-full border-4 border-slate-50 dark:border-slate-700 shadow-md" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                <User className="w-10 h-10" />
                            </div>
                        )}
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white dark:border-slate-800"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user?.displayName || 'User'}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                </motion.div>

                {/* Settings Groups */}
                <div className="space-y-4">

                    {/* Appearance */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tampilan</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-200">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    </div>
                                    <span className="font-medium">Dark Mode</span>
                                </div>
                                <button
                                    onClick={toggleDarkMode}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Security */}
                <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Keamanan</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-200">
                                <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Kunci Aplikasi (Biometrik)</span>
                            </div>
                            <button
                                onClick={() => setBiometric(!biometricEnabled)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${biometricEnabled ? 'bg-rose-600' : 'bg-slate-200'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${biometricEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Collaboration */}
                <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kolaborasi (Shared Ledger)</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        {/* Current Status */}
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            <p>Ledger ID: <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">{ledgerId || '...'}</span></p>
                            {ledgerId !== user?.uid && <p className="text-emerald-600 text-xs mt-1">● Anda terhubung ke Ledger Partner</p>}
                        </div>

                        {/* Invite Form */}
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const email = e.target.inviteEmail.value
                            invitePartner(email)
                            e.target.reset()
                            alert(`Undangan dikirim ke ${email}`)
                        }} className="flex space-x-2">
                            <input
                                name="inviteEmail"
                                type="email"
                                required
                                placeholder="Email Partner"
                                className="flex-1 p-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                            />
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors">
                                Undang
                            </button>
                        </form>

                        {/* Pending Invitations */}
                        {invitations.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-500">Undangan Masuk:</p>
                                {invitations.map(inv => (
                                    <div key={inv.id} className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{inv.fromName}</p>
                                            <p className="text-xs text-slate-500">{inv.fromUid === inv.ledgerId ? 'Ingin berbagi ledger denganmu' : 'Mengundangmu ke ledger'}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => acceptInvitation(inv.id, inv.ledgerId)}
                                                className="p-1.5 bg-emerald-500 text-white rounded shadow-sm hover:bg-emerald-600"
                                            >
                                                <span className="text-xs font-bold">Terima</span>
                                            </button>
                                            <button
                                                onClick={() => declineInvitation(inv.id)}
                                                className="p-1.5 bg-red-400 text-white rounded shadow-sm hover:bg-red-500"
                                            >
                                                <span className="text-xs font-bold">Tolak</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Data */}
                <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data & Privasi</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        <button onClick={handleDownloadReport} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-200">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Download Laporan Bulanan</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        </button>
                        <button onClick={handleDownloadCSV} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-200">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <Download className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Download Laporan (.CSV)</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        </button>
                        <button onClick={handleResetData} className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group">
                            <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400">
                                <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Reset Transaksi</span>
                            </div>
                        </button>
                        <button onClick={() => navigate('/logs')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-200">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg">
                                    <Terminal className="w-5 h-5" />
                                </div>
                                <span className="font-medium">System Logs (Offline)</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Account */}
                <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Akun</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center space-x-3 text-red-600">
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Keluar Aplikasi</span>
                            </div>
                        </button>
                    </div>
                </div>

            </div>


            {/* Edit Profile Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profil">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Tampilan</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                        Simpan Perubahan
                    </button>
                </form>
            </Modal>
        </div >
    )
}

export default Settings
