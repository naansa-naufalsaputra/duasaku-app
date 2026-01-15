import confetti from 'canvas-confetti'

// 1. Standard "Pop" - Good for small wins (New Wallet, New Budget)
export const triggerConfetti = () => {
    confetti({
        origin: { y: 0.7 },
        particleCount: 100,
        spread: 70,
        colors: ['#3b82f6', '#10b981', '#f59e0b'] // Blue, Green, Amber
    })
}

// 2. "School Pride" (Side Cannons) - For Big Achievements (Goal Reached)
export const triggerSchoolPride = () => {
    const end = Date.now() + 2 * 1000 // 2 seconds duration

        // Loop for animation frame
        (function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#3b82f6', '#ef4444']
            })
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#3b82f6', '#ef4444']
            })

            if (Date.now() < end) {
                requestAnimationFrame(frame)
            }
        }())
}
