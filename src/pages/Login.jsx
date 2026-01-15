import React from 'react'
import { auth, googleProvider } from '@/lib/firebase'
import { signInWithPopup, signInAnonymously } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { Wallet, User as UserIcon } from 'lucide-react'

const Login = () => {
    const navigate = useNavigate()

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider)
            navigate('/')
        } catch (error) {
            console.error("Login Failed:", error)
            alert("Gagal login: " + error.message)
        }
    }

    const handleGuestLogin = async () => {
        try {
            await signInAnonymously(auth)
            // Navigate is handled by auth state listener in App.jsx usually, 
            // but explicit navigate is safer here if listener is slow
            navigate('/')
        } catch (error) {
            console.error("Guest Login Failed:", error)
            alert("Gagal masuk tamu: " + error.message)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 text-center space-y-8">
            <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full">
                    <Wallet className="w-16 h-16 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        DuaSaku
                    </h1>
                    <p className="text-slate-500 mt-2">Kelola ATM & Tunai dengan Mudah</p>
                </div>
            </div>

            <div className="w-full max-w-sm space-y-4">
                <button
                    onClick={handleLogin}
                    className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                    <span>Masuk dengan Google</span>
                </button>

                <button
                    onClick={handleGuestLogin}
                    className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-200 rounded-lg text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                    <UserIcon className="w-5 h-5" />
                    <span>Masuk sebagai Tamu</span>
                </button>
            </div>

            <p className="text-xs text-slate-400">
                Dengan masuk, Anda menyetujui Kebijakan Privasi
            </p>
        </div>
    )
}

export default Login
