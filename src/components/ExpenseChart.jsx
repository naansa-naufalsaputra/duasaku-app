import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import useWalletStore from '@/stores/useWalletStore'

const ExpenseChart = () => {
    const { transactions } = useWalletStore()

    // Calculate expenses by category
    const expenses = transactions.filter(t => t.type === 'EXPENSE')
    const dataMap = expenses.reduce((acc, curr) => {
        const cat = curr.category || 'Misc'
        acc[cat] = (acc[cat] || 0) + Number(curr.amount)
        return acc
    }, {})

    const data = Object.entries(dataMap).map(([name, value]) => ({ name, value }))

    // Colors for chart
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-slate-100 min-h-[200px]">
                <div className="w-32 h-32 rounded-full border-4 border-slate-100 mb-3 relative flex items-center justify-center">
                    <span className="text-xs text-slate-300">No Data</span>
                </div>
                <p className="text-xs text-slate-400">Belum ada data pengeluaran</p>
            </div>
        )
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Ringkasan Pengeluaran</h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center text-xs text-slate-600">
                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="truncate">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ExpenseChart
