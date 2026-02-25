import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const { loginAdmin, loginEmployee } = useAuth()
    const navigate = useNavigate()

    const [mode, setMode] = useState('admin') // 'admin' or 'employee'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (mode === 'admin') {
                await loginAdmin(email, password)
                navigate('/dashboard')
            } else {
                await loginEmployee(email, password)
                navigate('/portal')
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong, try again')
        } finally {
            setLoading(false)
        }
    }

    const inputCls = 'w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition'

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
                        <span className="text-white text-xl font-bold">P</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">PulseHR</h1>
                    <p className="text-slate-500 mt-1 text-sm">Intelligent HR for modern teams</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg shadow-slate-100">
                    {/* role toggle */}
                    <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => { setMode('admin'); setError('') }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${mode === 'admin'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('employee'); setError('') }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${mode === 'employee'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Employee
                        </button>
                    </div>

                    <h2 className="text-xl font-semibold text-slate-900 mb-1">
                        {mode === 'admin' ? 'Admin Sign In' : 'Employee Sign In'}
                    </h2>
                    <p className="text-slate-500 text-sm mb-6">
                        {mode === 'admin' ? 'Access your organization dashboard' : 'View and update your assigned tasks'}
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                            <input
                                type="email" value={email}
                                onChange={e => setEmail(e.target.value)}
                                required placeholder={mode === 'admin' ? 'admin@company.com' : 'employee@company.com'}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <input
                                type="password" value={password}
                                onChange={e => setPassword(e.target.value)}
                                required placeholder="••••••••"
                                className={inputCls}
                            />
                        </div>
                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md shadow-indigo-100 mt-2"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {mode === 'admin' && (
                        <p className="text-center text-slate-500 text-sm mt-6">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                Register your organization
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
