import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Trash2, AlertCircle, Terminal, RefreshCw } from 'lucide-react'
import { getLocalLogs, clearLocalLogs } from '@/utils/Logger'

const Logs = () => {
    const navigate = useNavigate()
    const [logs, setLogs] = useState([])

    useEffect(() => {
        loadLogs()
    }, [])

    const loadLogs = () => {
        setLogs(getLocalLogs())
    }

    const handleClear = () => {
        if (confirm("Hapus semua log offline?")) {
            clearLocalLogs()
            loadLogs()
        }
    }

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2))
        const downloadAnchorNode = document.createElement('a')
        downloadAnchorNode.setAttribute("href", dataStr)
        downloadAnchorNode.setAttribute("download", `duasaku_logs_${new Date().toISOString()}.json`)
        document.body.appendChild(downloadAnchorNode)
        downloadAnchorNode.click()
        downloadAnchorNode.remove()
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-10 font-mono text-sm">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-white" />
                    </button>
                    <div>
                        <h1 className="font-bold text-slate-800 dark:text-white flex items-center">
                            <Terminal className="w-4 h-4 mr-2 text-slate-500" />
                            System Logs
                        </h1>
                        <p className="text-[10px] text-slate-400">{logs.length} entries stored locally</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button onClick={loadLogs} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button onClick={handleExport} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                        <Download className="w-5 h-5" />
                    </button>
                    <button onClick={handleClear} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Logs List */}
            <div className="p-4 space-y-3">
                {logs.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 opacity-50" />
                        </div>
                        <p>No offline logs found.</p>
                        <p className="text-xs mt-2 opacity-70">Logs will appear here when errors occur.</p>
                    </div>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-3 border-l-4 border-red-500 shadow-sm font-mono text-xs overflow-hidden">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-red-600 dark:text-red-400 flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {log.type}
                                </span>
                                <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>

                            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Context: {log.context}</p>
                            <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded text-slate-600 dark:text-slate-400 break-words whitespace-pre-wrap">
                                {log.message}
                            </div>

                            {log.data && Object.keys(log.data).length > 0 && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-blue-500 hover:underline text-[10px]">View Metadata</summary>
                                    <pre className="mt-1 p-2 bg-slate-100 dark:bg-black rounded text-[10px] text-slate-500 overflow-x-auto">
                                        {JSON.stringify(log.data, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Logs
