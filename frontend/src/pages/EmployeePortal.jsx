import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LuLogOut, LuClock, LuChevronDown } from 'react-icons/lu'

const STATUS_OPTIONS = ['Assigned', 'In Progress', 'Completed']
const STATUS_STYLE = {
    'Assigned': 'bg-blue-50 text-blue-600 border-blue-100',
    'In Progress': 'bg-amber-50 text-amber-600 border-amber-100',
    'Completed': 'bg-green-50 text-green-600 border-green-100',
}
const PRIORITY_DOT = { Low: 'bg-slate-300', Medium: 'bg-amber-400', High: 'bg-red-400' }

export default function EmployeePortal() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState(null)

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = () => {
        setLoading(true)
        axios.get('/api/tasks')
            .then(res => setTasks(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    const updateStatus = async (taskId, newStatus) => {
        setUpdatingId(taskId)
        try {
            const res = await axios.patch(`/api/tasks/${taskId}/status`, { status: newStatus })
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...res.data } : t))
        } catch (err) {
            alert('Failed to update task status')
        } finally {
            setUpdatingId(null)
        }
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const stats = {
        total: tasks.length,
        assigned: tasks.filter(t => t.status === 'Assigned').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        completed: tasks.filter(t => t.status === 'Completed').length,
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* top bar */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <div>
                        <p className="text-slate-900 font-bold text-sm">PulseHR</p>
                        <p className="text-slate-400 text-xs">Employee Portal</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-slate-800 text-sm font-medium">{user?.name}</p>
                        <p className="text-slate-400 text-xs">{user?.role} · {user?.department}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition"
                    >
                        <LuLogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* welcome */}
                <div className="mb-6">
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
                        Welcome, {user?.name?.split(' ')[0]}
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">Here are your assigned tasks</p>
                </div>

                {/* stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Total', value: stats.total, bg: 'bg-slate-100 border-slate-200', color: 'text-slate-700' },
                        { label: 'Assigned', value: stats.assigned, bg: 'bg-blue-50 border-blue-100', color: 'text-blue-600' },
                        { label: 'In Progress', value: stats.inProgress, bg: 'bg-amber-50 border-amber-100', color: 'text-amber-600' },
                        { label: 'Completed', value: stats.completed, bg: 'bg-green-50 border-green-100', color: 'text-green-600' },
                    ].map(({ label, value, bg, color }) => (
                        <div key={label} className={`${bg} border rounded-2xl p-4`}>
                            <p className="text-slate-500 text-xs mb-1">{label}</p>
                            <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* task list */}
                {loading ? (
                    <div className="flex flex-col items-center gap-3 py-20">
                        <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                        <p className="text-slate-400 text-sm">Loading tasks...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center text-slate-400 py-20">No tasks assigned to you yet.</div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-indigo-200 transition">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                                            <h3 className="text-slate-900 font-semibold text-sm">{task.title}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[task.status]}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        {task.description && (
                                            <p className="text-slate-500 text-xs mt-1 line-clamp-2">{task.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                            {task.priority && <span>Priority: <span className="text-slate-600">{task.priority}</span></span>}
                                            {task.due_date && (
                                                <span className="flex items-center gap-1">
                                                    <LuClock size={12} />
                                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* status dropdown */}
                                    <div className="shrink-0">
                                        <div className="relative">
                                            <select
                                                value={task.status}
                                                onChange={e => updateStatus(task.id, e.target.value)}
                                                disabled={updatingId === task.id}
                                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                                            >
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <LuChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
