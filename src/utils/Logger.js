import { db } from '../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const LOG_STORAGE_KEY = 'system_logs_offline'
const MAX_LOGS = 100

/**
 * Saves log to LocalStorage for offline viewing.
 * Implements a circular buffer (keeps latest MAX_LOGS).
 */
const saveToLocal = (logItem) => {
    try {
        const existing = localStorage.getItem(LOG_STORAGE_KEY)
        let logs = existing ? JSON.parse(existing) : []

        // Add new log to beginning
        logs.unshift(logItem)

        // Trim
        if (logs.length > MAX_LOGS) {
            logs = logs.slice(0, MAX_LOGS)
        }

        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs))
    } catch (e) {
        console.error("Local Logging Failed", e)
    }
}

/**
 * Logs an error to Firestore AND LocalStorage.
 * @param {string} context - Where the error happened.
 * @param {Error|string} errorObject - The error object or message.
 * @param {object} additionalData - Any extra payload.
 */
export async function logError(context, errorObject, additionalData = {}) {
    const message = errorObject?.message || errorObject?.toString() || 'Unknown Error'
    const stack = errorObject?.stack || null
    const timestamp = new Date().toISOString()
    const platform = "Android (Capacitor)" // or detect dynamically if needed

    const logItem = {
        type: 'ERROR',
        context,
        message,
        stack,
        data: additionalData,
        timestamp,
        platform
    }

    // 1. Always log to Console
    console.error(`[Logger] ${context}:`, message, additionalData)

    // 2. Save to LocalStorage (Offline Support)
    saveToLocal(logItem)

    // 3. Try sending to Cloud (Best Effort)
    try {
        if (navigator.onLine) {
            await addDoc(collection(db, 'system_logs'), {
                ...logItem,
                timestamp: serverTimestamp() // Use server time for cloud
            })
        }
    } catch (loggingErr) {
        // If cloud fails, at least we have local
        console.error("Cloud Logging Failed:", loggingErr)
    }
}

export function getLocalLogs() {
    try {
        return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]')
    } catch {
        return []
    }
}

export function clearLocalLogs() {
    localStorage.removeItem(LOG_STORAGE_KEY)
}
