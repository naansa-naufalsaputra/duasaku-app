/**
 * Detects potential subscriptions from transaction history.
 * Logic: Looks for expenses with the same amount and category that occur in consecutive months.
 * @param {Array} transactions 
 * @returns {Array} List of potential subscriptions
 */
export function detectSubscriptions(transactions) {
    if (!transactions || transactions.length === 0) return []

    // 1. Group by key: "Category-Amount"
    // We assume exact amount match for subscriptions (e.g. Netflix always 186,000)
    const groups = {}

    transactions.forEach(t => {
        if (t.type !== 'EXPENSE') return

        // Create a unique key. 
        // Note: In real world, we might want to check Merchant name too, but we don't always have it structured.
        // We use Category + Amount for this MVP.
        const key = `${t.category}-${t.amount}`

        if (!groups[key]) {
            groups[key] = {
                category: t.category,
                amount: Number(t.amount),
                dates: [],
                transactions: []
            }
        }
        groups[key].transactions.push(t)
        groups[key].dates.push(new Date(t.date))
    })

    const subscriptions = []

    // 2. Analyze each group for patterns
    Object.values(groups).forEach(group => {
        // Need at least 2 occurrences to call it a pattern
        if (group.dates.length < 2) return

        // Sort dates ascending
        const sortedDates = group.dates.sort((a, b) => a - b)

        // Check for consecutive months
        let isSubscription = false
        let consecutiveCount = 0

        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = sortedDates[i]
            const next = sortedDates[i + 1]

            const diffTime = Math.abs(next - current)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            // Allow some wiggle room (e.g. 28-32 days) or just check month difference
            // Simplest: Month diff is 1 (or 11 if crossing year)
            const monthDiff = (next.getFullYear() * 12 + next.getMonth()) - (current.getFullYear() * 12 + current.getMonth())

            if (monthDiff === 1) {
                consecutiveCount++
                if (consecutiveCount >= 1) { // Found at least 2 consecutive months (1 gap)
                    isSubscription = true
                }
            } else {
                consecutiveCount = 0 // Reset if gap broken
            }
        }

        if (isSubscription) {
            subscriptions.push({
                id: `${group.category}-${group.amount}`,
                name: group.category, // Or use most frequent merchant name if available
                category: group.category,
                amount: group.amount,
                cycle: 'Bulanan',
                nextDueDate: new Date(sortedDates[sortedDates.length - 1].setMonth(sortedDates[sortedDates.length - 1].getMonth() + 1))
            })
        }
    })

    return subscriptions
}
