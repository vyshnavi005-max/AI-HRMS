import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Other']

export default function Register() {
    const { register } = useAuth()
    const navigate = useNavigate()

    const [form, setForm] = useState({ name: '', email: '', password: '', industry: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password.length < 6) {
            setError('Password needs to be at least 6 characters')
            return
        }
        setError('')
        setLoading(true)
        try {
            await register(form.name, form.email, form.password, form.industry)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed, please try again')
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
                    <p className="text-slate-500 mt-1 text-sm">Register your organization</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg shadow-slate-100">
                    <h2 className="text-xl font-semibold text-slate-900 mb-1">Create organization</h2>
                    <p className="text-slate-500 text-sm mb-6">Get started in a few seconds</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Organization name</label>
                            <input value={form.name} onChange={set('name')} required placeholder="Acme Corp" className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin email</label>
                            <input type="email" value={form.email} onChange={set('email')} required placeholder="admin@acme.com" className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Industry</label>
                            <select value={form.industry} onChange={set('industry')} className={inputCls}>
                                <option value="">Select industry...</option>
                                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <input type="password" value={form.password} onChange={set('password')} required placeholder="Min 6 characters" className={inputCls} />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-indigo-100 mt-2"
                        >
                            {loading ? 'Creating account...' : 'Register Organization'}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-6">
                        Already registered?{' '}
                        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
