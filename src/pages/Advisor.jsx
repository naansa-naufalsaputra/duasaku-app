import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useWalletStore from '@/stores/useWalletStore'
import { chatWithAdvisor } from '@/lib/geminiService'
import { ArrowLeft, Send, Bot, User as UserIcon, Loader2, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'

const Advisor = () => {
    const navigate = useNavigate()
    const { atmBalance, cashBalance, transactions, user, chatHistory, addChatMessage, clearChatHistory, loadChatHistory } = useWalletStore()
    const [inputText, setInputText] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)

    // Load history on mount
    useEffect(() => {
        loadChatHistory()
    }, [user])

    // Initial greeting if empty
    useEffect(() => {
        if (chatHistory.length === 0 && user) {
            const totalBalance = atmBalance + cashBalance
            const formattedBalance = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalBalance)

            // Auto-add greeting to store so it persists
            addChatMessage('ai', `Halo ${user?.displayName?.split(' ')[0] || 'Teman'}! 👋 \nSaldo kamu sekarang **${formattedBalance}**. Ada yang bisa aku bantu? Curhat dong!`)
        }
    }, [chatHistory.length, user, atmBalance, cashBalance])

    // Smooth Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [chatHistory, loading])

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!inputText.trim() || loading) return

        const question = inputText
        setInputText('')
        setLoading(true)

        // 1. Save User Message
        addChatMessage('user', question)

        // 2. Prepare Context
        const totalBalance = atmBalance + cashBalance
        const recentTx = transactions
            .filter(t => t.type !== 'TRANSFER') // Exclude Transfers
            .slice(0, 5)
            .map(t =>
                `- ${t.type} ${t.category}: ${t.amount} (${t.description})`
            ).join('\n')

        const context = `
        Total Saldo: Rp ${totalBalance.toLocaleString('id-ID')}
        (ATM: ${atmBalance.toLocaleString('id-ID')}, Cash: ${cashBalance.toLocaleString('id-ID')})
        5 Transaksi Terakhir:
        ${recentTx || "Belum ada transaksi."}
        `

        try {
            // 3. Call AI
            const reply = await chatWithAdvisor(question, context)

            // 4. Save AI Reply
            addChatMessage('ai', reply)
        } catch (error) {
            console.error("AI Error:", error)
            addChatMessage('ai', `Maaf, error: ${error}. Coba lagi ya!`)
        } finally {
            setLoading(false)
        }
    }

    const handleClearChat = () => {
        if (confirm("Hapus semua riwayat chat?")) {
            clearChatHistory()
        }
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 p-4 pb-2 shadow-sm flex items-center justify-between z-10 sticky top-0">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-200" />
                    </button>
                    <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 rounded-full">
                            <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800 dark:text-white leading-tight">DuaSaku Advisor</h1>
                            <p className="text-xs text-green-500 font-medium flex items-center">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                Online
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trash Button */}
                <button
                    onClick={handleClearChat}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {chatHistory.map((msg) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
                            }`}>
                            {msg.sender === 'user' ? (
                                msg.text
                            ) : (
                                <ReactMarkdown
                                    components={{
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                        li: ({ node, ...props }) => <li className="" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold text-indigo-600 dark:text-indigo-400" {...props} />,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            )}
                        </div>
                    </motion.div>
                ))}

                {/* Loading Bubble */}
                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-2">
                            <Bot className="w-4 h-4 text-indigo-500 animate-bounce" />
                            <span className="text-xs text-slate-400 italic">Mengetik...</span>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area (Fixed Bottom) */}
            <div className="bg-white dark:bg-slate-800 p-4 border-t border-slate-100 dark:border-slate-700 sticky bottom-0">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Tanya tips hemat..."
                        className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-full px-5 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || loading}
                        className={`p-3.5 rounded-full text-white transition-all shadow-md ${!inputText.trim() || loading
                            ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                            }`}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Advisor
