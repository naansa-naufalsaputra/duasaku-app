import { create } from 'zustand'

const useAppStore = create((set) => ({
    user: null,
    theme: 'light',
    isScanning: false,
    setUser: (user) => set({ user }),
    toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    setIsScanning: (status) => set({ isScanning: status }),
}))

export default useAppStore
