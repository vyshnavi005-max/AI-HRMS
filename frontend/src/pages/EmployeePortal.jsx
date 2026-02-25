import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LuLogOut, LuClock, LuChevronDown } from 'react-icons/lu'
import { BrowserProvider } from 'ethers'

const STATUS_OPTIONS = ['Assigned', 'In Progress', 'Completed']
const STATUS_STYLE = {
    'Assigned': 'bg-blue-50 text-blue-600 border-blue-100',
    'In Progress': 'bg-amber-50 text-amber-600 border-amber-100',
    'Completed': 'bg-green-50 text-green-600 border-green-100',
}
const PRIORITY_DOT = { Low: 'bg-stone-300', Medium: 'bg-amber-400', High: 'bg-red-400' }

export default function EmployeePortal() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState(null)

    // web3 state
    const [walletAddress, setWalletAddress] = useState(null)
    const [connecting, setConnecting] = useState(false)

    useEffect(() => { fetchTasks() }, [])

    // check if MetaMask is already connected
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' })
                .then(accounts => {
                    if (accounts.length > 0) setWalletAddress(accounts[0])
                })
                .catch(() => { })
        }
    }, [])

    const fetchTasks = () => {
        setLoading(true)
        axios.get('/api/tasks')
            .then(res => setTasks(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask to use blockchain verification')
            return
        }
        setConnecting(true)
        try {
            const provider = new BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const address = await signer.getAddress()
            setWalletAddress(address)
        } catch (err) {
            console.error('wallet connection failed:', err)
            if (err.code !== 4001) alert('Failed to connect wallet')
        } finally {
            setConnecting(false)
        }
    }

    const updateStatus = async (taskId, newStatus) => {
        setUpdatingId(taskId)
        try {
            let txHash = null

            // if completing a task AND wallet is connected, sign on blockchain
            if (newStatus === 'Completed' && walletAddress && window.ethereum) {
                try {
                    const provider = new BrowserProvider(window.ethereum)
                    const signer = await provider.getSigner()

                    const task = tasks.find(t => t.id === taskId)
                    const message = `PulseHR Task Completion\n\nTask: ${task.title}\nTask ID: ${taskId}\nEmployee: ${user?.name}\nCompleted: ${new Date().toISOString()}`

                    // sign the message — creates a cryptographic proof
                    const signature = await signer.signMessage(message)
                    txHash = signature
                } catch (signErr) {
                    // user rejected the signature, still update status but without blockchain proof
                    if (signErr.code === 4001) {
                        console.log('user skipped blockchain signing')
                    } else {
                        console.error('signing error:', signErr)
                    }
                }
            }

            const res = await axios.patch(`/api/tasks/${taskId}/status`, {
                status: newStatus,
                tx_hash: txHash
            })
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

    const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

    return (
        <div className="min-h-screen bg-stone-50">
            {/* top bar */}
            <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">

                    <div>
                        <p className="text-stone-900 font-bold text-sm">PulseHR</p>
                        <p className="text-stone-400 text-xs">Employee Portal</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* wallet connection */}
                    {walletAddress ? (
                        <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xl">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-green-700 text-xs font-medium">{shortAddr(walletAddress)}</span>
                        </div>
                    ) : (
                        <button onClick={connectWallet} disabled={connecting}
                            className="hidden sm:flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-xl text-xs font-medium transition disabled:opacity-50">
                            🦊 {connecting ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    )}
                    <div className="text-right hidden sm:block">
                        <p className="text-stone-800 text-sm font-medium">{user?.name}</p>
                        <p className="text-stone-400 text-xs">{user?.role} · {user?.department}</p>
                    </div>
                    <button onClick={handleLogout}
                        className="text-stone-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition">
                        <LuLogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* welcome */}
                <div className="mb-6">
                    <h1 className="text-xl lg:text-2xl font-bold text-stone-900">
                        Welcome, {user?.name?.split(' ')[0]}
                    </h1>
                    <p className="text-stone-500 text-sm mt-0.5">Here are your assigned tasks</p>
                </div>

                {/* mobile wallet button */}
                <div className="sm:hidden mb-4">
                    {walletAddress ? (
                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-3 py-2 rounded-xl w-fit">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-green-700 text-xs font-medium">{shortAddr(walletAddress)}</span>
                        </div>
                    ) : (
                        <button onClick={connectWallet} disabled={connecting}
                            className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 px-3 py-2 rounded-xl text-xs font-medium transition">
                            🦊 {connecting ? 'Connecting...' : 'Connect MetaMask for blockchain verification'}
                        </button>
                    )}
                </div>

                {/* stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Total', value: stats.total, bg: 'bg-stone-100 border-stone-200', color: 'text-stone-700' },
                        { label: 'Assigned', value: stats.assigned, bg: 'bg-blue-50 border-blue-100', color: 'text-blue-600' },
                        { label: 'In Progress', value: stats.inProgress, bg: 'bg-amber-50 border-amber-100', color: 'text-amber-600' },
                        { label: 'Completed', value: stats.completed, bg: 'bg-green-50 border-green-100', color: 'text-green-600' },
                    ].map(({ label, value, bg, color }) => (
                        <div key={label} className={`${bg} border rounded-2xl p-4`}>
                            <p className="text-stone-500 text-xs mb-1">{label}</p>
                            <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* task list */}
                {loading ? (
                    <div className="flex flex-col items-center gap-3 py-20">
                        <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin" />
                        <p className="text-stone-400 text-sm">Loading tasks...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center text-stone-400 py-20">No tasks assigned to you yet.</div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div key={task.id} className="portal-card group">
                                <div className="portal-task-layout">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 min-w-0">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                                            <h3 className="task-title truncate">{task.title}</h3>
                                        </div>
                                        {task.description && (
                                            <p className="text-stone-500 text-[11px] mb-2 line-clamp-2">{task.description}</p>
                                        )}
                                        <div className="task-meta-row mb-1">
                                            <span className="flex items-center gap-1 font-medium text-stone-600">
                                                {task.priority || 'No Priority'}
                                            </span>
                                            {task.due_date && (
                                                <span className="flex items-center gap-1">
                                                    <LuClock size={12} />
                                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* blockchain verification badge */}
                                        {task.tx_hash && (
                                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                                <div className="portal-verified-tag">
                                                    <span className="mr-1">🔗</span> Verified
                                                </div>
                                                <span className="text-stone-300 text-[10px] font-mono">{task.tx_hash.slice(0, 8)}...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* status info on right */}
                                    <div className="portal-status-col">
                                        <span className={`badge ${STATUS_STYLE[task.status]}`}>
                                            {task.status}
                                        </span>
                                        <div className="relative">
                                            <select
                                                value={task.status}
                                                onChange={e => updateStatus(task.id, e.target.value)}
                                                disabled={updatingId === task.id}
                                                className="portal-select"
                                            >
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <LuChevronDown size={12} className="absolute right-2 top-1/2 -transtone-y-1/2 text-stone-400 pointer-events-none" />
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
