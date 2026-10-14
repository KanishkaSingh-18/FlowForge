import { createContext, useContext, useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const response = await axiosInstance.get('/users/me')
                setUser(response.data.user)
            } catch {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        restoreSession()
    }, [])

    const signup = async (name, email, password) => {
        const response = await axiosInstance.post('/users/signup', {
            name,
            email,
            password,
        })

        setUser(response.data.user)
        return response.data.user
    }

    const login = async (email, password) => {
        const response = await axiosInstance.post('/users/login', {
            email,
            password,
        })

        setUser(response.data.user)
        return response.data.user
    }

    const logout = async () => {
        try {
            await axiosInstance.post('/users/logout')
        } finally {
            setUser(null)
        }
    }

    const value = {
        user,
        loading,
        signup,
        login,
        logout,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider')
    }

    return context
}
