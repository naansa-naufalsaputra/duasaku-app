export function parseTransactionText(text) {
    if (!text) return { amount: 0, category: 'Misc', sourceWallet: 'CASH', description: '' }

    const lowercaseText = text.toLowerCase()

    // --- 1. Smart Amount Detection ---
    const blacklistSuffixes = ['bulan', 'hari', 'minggu', 'tahun', 'x', 'pcs', 'orang', 'kali', 'jam']
    const currencySuffixes = {
        'rb': 1000,
        'ribu': 1000,
        'k': 1000,
        'jt': 1000000,
        'juta': 1000000,
        'rp': 1
    }

    // Regex to capture: (Number)(Space?)(Suffix?)
    // Updated to support dots involved in the number part better (15.000)
    const numberPattern = /([\d,.]+)(\s*)([a-z]+)?/gi
    let matches
    let candidates = []
    let matchedStringToRemove = ''

    while ((matches = numberPattern.exec(lowercaseText)) !== null) {
        const fullMatch = matches[0]
        let rawNum = matches[1].replace(/\./g, '').replace(',', '.') // standardize 15.000 -> 15000
        let val = parseFloat(rawNum)
        if (isNaN(val)) continue

        const suffix = matches[3] ? matches[3].toLowerCase() : ''

        // Skip if followed by blacklisted time/qty keywords
        if (blacklistSuffixes.includes(suffix)) continue

        // Check currency suffix
        if (currencySuffixes[suffix]) {
            val *= currencySuffixes[suffix]
            candidates.push({ val, priority: 2, raw: fullMatch })
        } else {
            // If just a number like "15.000", verify it's likely money (e.g. > 1000 or specific context)
            // For now, accept it with lower priority
            candidates.push({ val, priority: 1, raw: fullMatch })
        }
    }

    let amount = 0
    if (candidates.length > 0) {
        // Sort: Priority DESC, then Value DESC
        candidates.sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority
            return b.val - a.val
        })
        amount = candidates[0].val
        matchedStringToRemove = candidates[0].raw
    }

    // --- 2. Category Detection ---
    let category = 'Misc'
    const categories = {
        'F&B': ['makan', 'minum', 'kopi', 'cafe', 'warteg', 'jajan', 'lunch', 'dinner', 'sarapan', 'es', 'teh', 'bakso', 'mie'],
        'Transport': ['bensin', 'parkir', 'tol', 'gojek', 'grab', 'ojek', 'uber', 'taxi', 'kereta'],
        'Shopping': ['belanja', 'mart', 'indo', 'alfa', 'baju', 'celana', 'sepatu', 'tas', 'skincare'],
        'Bills': ['listrik', 'air', 'internet', 'pulsa', 'pln', 'token', 'wifi', 'netflix', 'spotify', 'youtube']
    }

    for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => lowercaseText.includes(keyword))) {
            category = cat
            break
        }
    }

    // --- 3. Source Wallet Detection ---
    let sourceWallet = null
    const atmKeywords = ['qris', 'tf', 'transfer', 'gopay', 'ovo', 'dana', 'bank', 'debit', 'linkaja', 'shopeepay', 'atm']
    const cashKeywords = ['tunai', 'cash', 'kembalian', 'warung', 'abang', 'receh']

    if (atmKeywords.some(keyword => lowercaseText.includes(keyword))) {
        sourceWallet = 'ATM'
    } else if (cashKeywords.some(keyword => lowercaseText.includes(keyword))) {
        sourceWallet = 'CASH'
    } else {
        // Fallback Logic: Big amount = ATM, Small = Cash
        // Adjusted threshold to 100rb
        sourceWallet = amount >= 100000 ? 'ATM' : 'CASH'
    }

    // --- 4. Description Formatting (Beautifier V3 - Aggressive) ---
    // Remove the matched amount string from the original text (Strip Amount)
    let rawDescription = text
    if (matchedStringToRemove) {
        // Remove ALL occurrences of the matched string to be safe, using word boundary if possible?
        // Actually, just remove the specific raw match we found.
        const regexRemove = new RegExp(matchedStringToRemove.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi')
        rawDescription = rawDescription.replace(regexRemove, '')
    }

    // Clean up extra spaces/punctuation
    rawDescription = rawDescription.replace(/\s+/g, ' ').trim()

    // Title Case Helper
    const toTitleCase = (str) => {
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        })
    }

    // Aggressive clean: Remove "qris", "tf", "transfer" from title if they are dangling? 
    // User requested "bayar makan 50 ribu qris" -> "Bayar Makan Qris". 
    // Title Case handles the casing. Amount removal handles "50 ribu".

    let description = toTitleCase(rawDescription) || 'Transaksi'

    // Subscription Keyword Formatting (Netflix, Spotify, etc)
    const subscriptionMap = {
        'netflix': 'Langganan Netflix',
        'spotify': 'Langganan Spotify',
        'youtube': 'Langganan YouTube',
        'wifi': 'Pembayaran WiFi',
        'pln': 'Bayar Listrik',
        'listrik': 'Bayar Listrik',
        'air': 'Bayar Air',
        'pdam': 'Bayar PDAM',
        'indihome': 'Pembayaran IndiHome'
    }

    const lowerDesc = description.toLowerCase()

    // Check specific keywords map
    for (const [key, value] of Object.entries(subscriptionMap)) {
        if (lowerDesc.includes(key)) {
            // Check if suffix like "1 bulan" exists
            const suffix = description.substring(description.toLowerCase().indexOf(key) + key.length).trim()
            description = `${value} ${suffix}`.trim()
            break
        }
    }

    return {
        amount,
        category,
        sourceWallet,
        description
    }
}
