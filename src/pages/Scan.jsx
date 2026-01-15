import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { scanReceipt } from '@/lib/geminiService'
import { ArrowLeft, Camera as CameraIcon, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const Scan = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleTakePhoto = async () => {
        setError('')
        try {
            const image = await Camera.getPhoto({
                quality: 80,
                allowEditing: false, // Set true if you want cropping
                resultType: CameraResultType.Base64,
                source: CameraSource.Camera
            })

            if (image.base64String) {
                processImage(image.base64String)
            }
        } catch (e) {
            console.error("Camera Error:", e)
            if (e.message !== 'User cancelled photos app') {
                setError("Gagal membuka kamera. Pastikan izin diberikan.")
            }
        }
    }

    const handlePickPhoto = async () => {
        setError('')
        try {
            const image = await Camera.getPhoto({
                quality: 80,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Photos
            })

            if (image.base64String) {
                processImage(image.base64String)
            }
        } catch (e) {
            console.error("Gallery Error:", e)
        }
    }

    const processImage = async (base64) => {
        setLoading(true)
        try {
            const result = await scanReceipt(base64)

            if (result && result.amount) {
                // Success! Navigate to Dashboard with data
                navigate('/', {
                    state: {
                        scanResult: {
                            amount: result.amount,
                            title: result.title,
                            category: result.category,
                            date: result.date
                        },
                        openModal: 'expense'
                    }
                })
            } else {
                setError("Gagal mengenali struk. Coba foto lebih jelas.")
            }
        } catch (e) {
            console.error("AI Error:", e)
            setError("Gagal menganalisis gambar. Coba lagi nanti.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-60 h-60 bg-blue-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-60 h-60 bg-purple-600/20 rounded-full blur-3xl"></div>

            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 p-2 bg-white/10 rounded-full backdrop-blur-md active:scale-95 transition-transform"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="w-full max-w-sm space-y-10 text-center z-10">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Scan Struk</h1>
                    <p className="text-slate-400">Foto struk belanjamu, biar AI yang catat!</p>
                </div>

                {/* Animated Scanner Visual */}
                <div className="relative w-64 h-64 mx-auto border-2 border-dashed border-slate-600 rounded-3xl flex items-center justify-center bg-slate-800/50 backdrop-blur-sm overflow-hidden group">
                    {loading ? (
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
                            <span className="text-sm font-medium animate-pulse">Menganalisis...</span>
                        </div>
                    ) : (
                        <CameraIcon className="w-20 h-20 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    )}

                    {/* Scanning Beam Animation */}
                    {loading && (
                        <motion.div
                            initial={{ top: 0 }}
                            animate={{ top: "100%" }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                        />
                    )}
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl flex items-center justify-center space-x-2 text-sm"
                    >
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </motion.div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={handleTakePhoto}
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-lg shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                        <CameraIcon className="w-5 h-5" />
                        <span>Ambil Foto</span>
                    </button>

                    <button
                        onClick={handlePickPhoto}
                        disabled={loading}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-lg text-slate-300 active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                        <ImageIcon className="w-5 h-5" />
                        <span>Pilih dari Galeri</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Scan
