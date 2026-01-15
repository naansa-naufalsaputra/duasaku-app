import React, { useEffect, useState, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
// Lazy load pages to isolate native plugin crashes
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Scan = lazy(() => import('@/pages/Scan'))
const History = lazy(() => import('@/pages/History'))
const Login = lazy(() => import('@/pages/Login'))
const Subscriptions = lazy(() => import('@/pages/Subscriptions'))
const Settings = lazy(() => import('@/pages/Settings'))
const Goals = lazy(() => import('@/pages/Goals'))
const Analysis = lazy(() => import('@/pages/Analysis'))
const Budgets = lazy(() => import('@/pages/Budgets'))
const Advisor = lazy(() => import('@/pages/Advisor'))
const Logs = lazy(() => import('@/pages/Logs'))

import PrivateRoute from '@/components/PrivateRoute'
import useWalletStore from '@/stores/useWalletStore'

import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Lock, Loader2 } from 'lucide-react'

function App() {
  const { initializeAuth } = useWalletStore()
  // 1. Default LOCKED to prevent content flash (but unlock immediately on web)
  const [isLocked, setIsLocked] = useState(true)

  // Auth Init
  useEffect(() => {
    const unsubscribe = initializeAuth()
    const isDark = useWalletStore.getState().darkMode
    if (isDark) document.documentElement.classList.add('dark')
    return () => unsubscribe()
  }, [])

  // Biometric Logic (Safe Dynamic Import)
  useEffect(() => {
    const checkBiometric = async () => {
      // WEB BYPASS: If not native, unlock immediately
      if (!Capacitor.isNativePlatform()) {
        setIsLocked(false)
        return
      }

      const { biometricEnabled } = useWalletStore.getState()

      // If disabled, unlock immediately
      if (!biometricEnabled) {
        setIsLocked(false)
        return
      }

      // If enabled, verify identity (Dynamic Import)
      try {
        console.log("[App] Loading NativeBiometric...")
        const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')

        await NativeBiometric.verifyIdentity({
          reason: "Buka kunci DuaSaku",
          title: "Verifikasi Identitas",
          subtitle: "Konfirmasi sidik jari atau wajah",
          description: "Aplikasi terkunci demi keamanan"
        })
        setIsLocked(false)
      } catch (error) {
        console.error("Biometric Verification Failed or Plugin Missing", error)
        // Keep locked. User can try again manually or handle error
      }
    }

    // Run on Mount
    checkBiometric()

    // Background/Resume Listener
    let listener = null
    if (Capacitor.isNativePlatform()) {
      const handleAppStateChange = async (state) => {
        const { biometricEnabled } = useWalletStore.getState()
        if (!biometricEnabled) return

        if (!state.isActive) {
          // App goes background -> Lock it
          setIsLocked(true)
        } else {
          // App resumes -> Verify again
          try {
            // Dynamic Import again for resume
            const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')

            await NativeBiometric.verifyIdentity({
              reason: "Buka kembali DuaSaku",
              title: "Verifikasi Ulang",
              subtitle: "Aplikasi baru saja dilanjutkan",
              description: "Verifikasi untuk melanjutkan"
            })
            setIsLocked(false)
          } catch (e) {
            console.error("Resume Verification Failed", e)
          }
        }
      }
      listener = CapApp.addListener('appStateChange', handleAppStateChange)
    }

    return () => {
      if (listener) listener.then(remove => remove.remove())
    }
  }, [])

  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white z-[9999] flex flex-col items-center justify-center space-y-8 p-4">
        {/* Lock Icon with Pulse Effect */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
          <div className="relative p-8 bg-slate-800 rounded-[2rem] border border-slate-700 shadow-2xl">
            <Lock className="w-16 h-16 text-blue-500" strokeWidth={1.5} />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Terkunci</h1>
          <p className="text-slate-400 font-medium">Pindai sidik jari untuk melihat saldo</p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full font-bold text-lg shadow-lg shadow-blue-900/50 hover:scale-105 active:scale-95 transition-all"
        >
          Buka Kunci
        </button>
      </div>
    )
  }

  // Suspense Fallback
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/history" element={<History />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/advisor" element={<Advisor />} />
          <Route path="/logs" element={<Logs />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
