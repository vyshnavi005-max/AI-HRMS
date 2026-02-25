import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    LuLayoutDashboard, LuUsers, LuClipboardList, LuBrain,
    LuLogOut, LuMenu, LuX
} from 'react-icons/lu'

const links = [
    { to: '/dashboard', label: 'Dashboard', Icon: LuLayoutDashboard },
    { to: '/employees', label: 'Employees', Icon: LuUsers },
    { to: '/tasks', label: 'Tasks', Icon: LuClipboardList },
    { to: '/ai-insights', label: 'AI Insights', Icon: LuBrain },
]

function NavContent({ onClose }) {
    const { org, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                        <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <div>
                        <p className="text-slate-900 font-bold text-sm leading-tight">PulseHR</p>
                        <p className="text-slate-400 text-xs truncate max-w-[110px]">{org?.name}</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-700 p-1">
                        <LuX size={20} />
                    </button>
                )}
            </div>

            <nav className="flex-1 p-3 space-y-0.5">
                {links.map(({ to, label, Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                                {label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-3 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl px-3 py-3 mb-2">
                    <p className="text-slate-800 text-xs font-semibold truncate">{org?.name}</p>
                    <p className="text-slate-400 text-xs truncate">{org?.email}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 text-sm font-medium transition"
                >
                    <LuLogOut size={15} />
                    Sign out
                </button>
            </div>
        </div>
    )
}

export default function Sidebar() {
    const [open, setOpen] = useState(false)
    const location = useLocation()

    // close drawer on route change
    useEffect(() => { setOpen(false) }, [location.pathname])

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-white border border-slate-200 text-slate-700 p-2 rounded-xl shadow-md"
                aria-label="Open menu"
            >
                <LuMenu size={20} />
            </button>

            {open && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-50 shadow-sm flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shrink-0
        `}
            >
                <NavContent onClose={() => setOpen(false)} />
            </aside>
        </>
    )
}
