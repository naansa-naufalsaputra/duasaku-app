import React, { useEffect, useState } from 'react'
import { auth, googleProvider } from '@/lib/firebase'
import { signInWithPopup, signInWithRedirect, getRedirectResult, signInAnonymously } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { Wallet, User as UserIcon, Loader2, AlertCircle } from 'lucide-react'

const Login = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // 1. Handle Redirect Result (For Mobile Return)
    useEffect(() => {
        const checkRedirect = async () => {
            try {
                const result = await getRedirectResult(auth)
                if (result) {
                    console.log("Redirect Login Success:", result.user.uid)
                    navigate('/')
                }
            } catch (error) {
                console.error("Redirect Error:", error)
                if (error.code !== 'auth/popup-closed-by-user') {
                    setError(formatErrorMessage(error.code))
                }
            }
        }
        checkRedirect()
    }, [navigate])

    // Utility: Detect Mobile
    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }

    const handleLogin = async () => {
        setError('')
        setLoading(true)
        try {
            if (isMobile()) {
                // Mobile: Redirect (Robust)
                // Note: Redirect does not await here, page unloads
                await signInWithRedirect(auth, googleProvider)
            } else {
                // Desktop: Popup (Better UX)
                await signInWithPopup(auth, googleProvider)
                navigate('/')
            }
        } catch (error) {
            console.error("Login Failed:", error)
            setError(formatErrorMessage(error.code))
            setLoading(false)
        }
    }

    const handleGuestLogin = async () => {
        setError('')
        setLoading(true)
        try {
            await signInAnonymously(auth)
            // Navigate via Auth Listener usually handles this, but we force check
            navigate('/')
        } catch (error) {
            console.error("Guest Login Failed:", error)
            setError("Gagal masuk tamu: " + error.message)
            setLoading(false)
        }
    }

    const formatErrorMessage = (code) => {
        switch (code) {
            case 'auth/popup-blocked': return "Pop-up diblokir browser. Izinkan pop-up atau gunakan HP."
            case 'auth/popup-closed-by-user': return "Login dibatalkan."
            case 'auth/cancelled-popup-request': return "Permintaan login ganda."
            case 'auth/network-request-failed': return "Koneksi internet bermasalah."
            default: return "Gagal login. Coba lagi."
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 text-center space-y-8">
            <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-full animate-bounce-slow">
                    <Wallet className="w-16 h-16 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        DuaSaku
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Smart Finance for Smart People</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm max-w-xs animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="w-full max-w-sm space-y-4">
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full relative flex items-center justify-center space-x-3 py-3.5 px-4 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                >
                    {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    ) : (
                        <>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                            <span>Masuk dengan Google</span>
                        </>
                    )}
                </button>

                <button
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-3 py-3.5 px-4 border border-transparent rounded-xl text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                    <UserIcon className="w-5 h-5" />
                    <span>Masuk sebagai Tamu</span>
                </button>
            </div>

            <p className="text-xs text-slate-400">
                Dengan masuk, Anda menyetujui Kebijakan Privasi & Ketentuan Layanan
            </p>
        </div>
    )
}

export default Login
