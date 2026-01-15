import React from 'react'
import { RotateCcw, ShieldAlert } from 'lucide-react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center border border-slate-100 dark:border-slate-700">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert className="w-10 h-10 text-red-500 dark:text-red-400" strokeWidth={1.5} />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                            Ups, ada sedikit gangguan.
                        </h1>

                        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Jangan panik, data keuanganmu aman. Sistem mendeteksi kendala tak terduga.
                        </p>

                        <button
                            onClick={this.handleReload}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none flex items-center justify-center space-x-2"
                        >
                            <RotateCcw className="w-5 h-5" />
                            <span>Coba Lagi</span>
                        </button>

                        <div className="mt-6">
                            <details className="text-xs text-left text-slate-400 cursor-pointer">
                                <summary>Technical Details</summary>
                                <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto">
                                    {this.state.error && this.state.error.toString()}
                                </pre>
                            </details>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
