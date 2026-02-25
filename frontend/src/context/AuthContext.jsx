import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

axios.defaults.withCredentials = true

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)      // admin org or employee info
    const [userRole, setUserRole] = useState(null) // 'admin' or 'employee'
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get('/api/auth/me')
            .then(res => {
                setUser(res.data)
                setUserRole(res.data.userRole)
            })
            .catch(() => {
                setUser(null)
                setUserRole(null)
            })
            .finally(() => setLoading(false))
    }, [])

    const loginAdmin = async (email, password) => {
        const res = await axios.post('/api/auth/login', { email, password })
        setUser(res.data.org)
        setUserRole('admin')
        return res.data
    }

    const loginEmployee = async (email, password) => {
        const res = await axios.post('/api/auth/employee-login', { email, password })
        setUser(res.data.employee)
        setUserRole('employee')
        return res.data
    }

    const register = async (name, email, password, industry) => {
        const res = await axios.post('/api/auth/register', { name, email, password, industry })
        setUser(res.data.org)
        setUserRole('admin')
        return res.data
    }

    const logout = async () => {
        try { await axios.post('/api/auth/logout') } catch { }
        setUser(null)
        setUserRole(null)
    }

    // backwards compat: org = user for admin pages
    const org = userRole === 'admin' ? user : null

    return (
        <AuthContext.Provider value={{ user, userRole, org, loading, loginAdmin, loginEmployee, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
