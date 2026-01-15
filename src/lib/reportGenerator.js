import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Generates and downloads a monthly financial report PDF.
 * @param {Array} transactions List of all transactions
 * @param {Object} user User profile object
 */
export const generateMonthlyReport = (transactions, user) => {
    const doc = new jsPDF()
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const monthName = now.toLocaleString('id-ID', { month: 'long' })

    // Filter Current Month Transactions
    const monthlyTransactions = transactions.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    // Calculate Totals
    let totalIncome = 0
    let totalExpense = 0

    monthlyTransactions.forEach(t => {
        const amount = Number(t.amount)
        if (t.type === 'INCOME') totalIncome += amount
        if (t.type === 'EXPENSE') totalExpense += amount
    })

    const netBalance = totalIncome - totalExpense

    // Formatting
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    // --- PDF Construction ---

    // Header
    doc.setFontSize(18)
    doc.text('Laporan Keuangan Bulanan', 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`DuaSaku App - ${monthName} ${currentYear}`, 14, 30)

    // User Info
    if (user) {
        doc.text(`User: ${user.displayName || 'Pengguna'}`, 14, 36)
    }

    // Summary Card
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(14, 45, 180, 25, 3, 3, 'FD')

    doc.setFontSize(10)
    doc.setTextColor(50)
    doc.text('Pemasukan', 20, 52)
    doc.text('Pengeluaran', 80, 52)
    doc.text('Selisih (Net)', 140, 52)

    doc.setFontSize(12)
    doc.setTextColor(34, 197, 94) // Green
    doc.text(formatCurrency(totalIncome), 20, 62)

    doc.setTextColor(239, 68, 68) // Red
    doc.text(formatCurrency(totalExpense), 80, 62)

    doc.setTextColor(0) // Black
    doc.text(formatCurrency(netBalance), 140, 62)

    // Table Data
    const tableData = monthlyTransactions.map(t => [
        new Date(t.date).toLocaleDateString('id-ID'),
        t.category,
        t.type === 'expense' ? 'Pengeluaran' : (t.type === 'income' ? 'Pemasukan' : 'Transfer'),
        t.type === 'expense' ? `-${formatCurrency(t.amount)}` : formatCurrency(t.amount),
        t.source
    ])

    // Table
    autoTable(doc, {
        startY: 80,
        head: [['Tanggal', 'Kategori', 'Tipe', 'Jumlah', 'Sumber']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85] },
        styles: { fontSize: 9 },
        columnStyles: {
            3: { halign: 'right' }
        }
    })

    // Footer
    const finalY = doc.lastAutoTable.finalY || 80
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Dicetak otomatis oleh DuaSaku pada ${now.toLocaleString()}`, 14, finalY + 10)

    // Download
    doc.save(`Laporan_Keuangan_${user?.displayName || 'User'}_${monthName}_${currentYear}.pdf`)
}

/**
 * Generates and downloads a CSV report of all transactions.
 * @param {Array} transactions List of all transactions
 */
export const generateCSV = (transactions) => {
    if (!transactions || transactions.length === 0) {
        alert("Tidak ada data untuk diexport")
        return
    }

    // 1. Define Headers
    const headers = ['Date', 'Title', 'Category', 'Type', 'Wallet', 'Amount']

    // 2. Map Data
    const rows = transactions.map(t => {
        const date = new Date(t.date).toISOString().split('T')[0] // YYYY-MM-DD
        const title = t.description || t.category // fallback title
        const category = t.category || 'Uncategorized'
        const type = t.type
        const wallet = t.source
        const amount = Number(t.amount) // Raw number for Excel calculation

        // Escape CSV special characters (comma, quotes)
        const cleanTitle = `"${title.replace(/"/g, '""')}"`
        const cleanCategory = `"${category.replace(/"/g, '""')}"`

        return [date, cleanTitle, cleanCategory, type, wallet, amount].join(',')
    })

    // 3. Combine Header + Rows
    const csvContent = [headers.join(','), ...rows].join('\n')

    // 4. Create Blob & Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    const now = new Date()
    const timestamp = now.toISOString().split('T')[0]

    link.setAttribute('href', url)
    link.setAttribute('download', `Laporan-Duasaku-${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
