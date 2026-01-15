import React from 'react'
import { Navigate } from 'react-router-dom'
import useWalletStore from '@/stores/useWalletStore'

const PrivateRoute = ({ children }) => {
    const { user, loading } = useWalletStore()

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    return user ? children : <Navigate to="/login" />
}

export default PrivateRoute
